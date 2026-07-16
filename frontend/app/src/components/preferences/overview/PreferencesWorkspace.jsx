import { useState, useRef, useEffect } from 'react'
import { Settings, UploadCloud, PlaySquare, Sparkles, Bell, Cpu, Palette, Sliders, Info, ChevronDown, ChevronRight } from 'lucide-react'
import { useSettingsStore } from '../../../store/settings/settingsStore'
import { showToast } from '../../common/NotificationToast'
import PreferencesNavigation from './PreferencesNavigation'
import PreferencesArtwork from './PreferencesArtwork'
import PreferenceActionBar from './PreferenceActionBar'
import PreferenceSection from './PreferenceSection'
import PreferenceToggle from './PreferenceToggle'
import PreferenceDropdown from './PreferenceDropdown'
import PreferenceSlider from './PreferenceSlider'
import AiSettingsSection from './AiSettingsSection'

import { useTranslation } from '../../../i18n/useTranslation'

export default function PreferencesWorkspace() {
  const [activeCategory, setActiveCategory] = useState('general')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdvancedPerf, setShowAdvancedPerf] = useState(false)
  const scrollRef = useRef(null)
  const { t } = useTranslation()

  const config = useSettingsStore(s => s.config)
  const fetchSettings = useSettingsStore(s => s.fetchSettings)
  const updateSettings = useSettingsStore(s => s.updateSettings)
  const updateLocalSetting = useSettingsStore(s => s.updateLocalSetting)

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const playTestSound = (type = 'success') => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      if (type === 'success') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15) // E5
        gain.gain.setValueAtTime(0.1, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.5)
      } else {
        osc.type = 'square'
        osc.frequency.setValueAtTime(300, ctx.currentTime)
        osc.frequency.setValueAtTime(250, ctx.currentTime + 0.1)
        gain.gain.setValueAtTime(0.05, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.4)
      }
    } catch (e) {
      console.warn('AudioContext not supported or blocked')
    }
  }

  const updateConfig = (key, value) => {
    updateLocalSetting(key, value)
    
    // Realtime Effects
    if (key === 'notif_desktop' && value === true) {
      if (window.Notification && Notification.permission !== 'granted') {
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') {
            new Notification('Raynz PitStop', { body: 'Desktop Notifications Enabled!' })
          }
        })
      } else if (window.Notification && Notification.permission === 'granted') {
        new Notification('Raynz PitStop', { body: 'Desktop Notifications Enabled!' })
      }
    }
    
    if (key === 'notif_sound' && value === true) {
      playTestSound('success')
    }
    
    if (key === 'notif_success' && value === true) {
      showToast('Upload Complete Alert Enabled', 'success')
      if (config?.notif_sound) playTestSound('success')
    }
    
    if (key === 'notif_fail' && value === true) {
      showToast('Upload Failure Alert Enabled', 'error')
      if (config?.notif_sound) playTestSound('error')
    }
  }

  const [isSaving, setIsSaving] = useState(false)
  
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
  const [updateInfo, setUpdateInfo] = useState(null)
  const [isInstalling, setIsInstalling] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(null)
  const pollIntervalRef = useRef(null)

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true)
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/system/update/check')
      const data = await res.json()
      if (data.success) {
        setUpdateInfo(data)
        if (!data.update_available) {
          showToast(`You are on the latest version (${data.local_version})`, 'success')
        }
      } else {
        showToast('Failed to check for updates', 'error')
      }
    } catch (e) {
      showToast('Error checking update', 'error')
    } finally {
      setIsCheckingUpdate(false)
    }
  }

  const handleInstallUpdate = async () => {
    if (!updateInfo?.download_url) return
    setIsInstalling(true)
    setDownloadProgress({ progress: 0, downloaded: 0, total: 0, status: 'starting' })
    try {
      showToast('Downloading update... Please wait.', 'info', 5000)
      const res = await fetch('http://127.0.0.1:8000/api/v1/system/update/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ download_url: updateInfo.download_url })
      })
      const data = await res.json()
      if (data.success) {
        // Start polling for progress
        pollIntervalRef.current = setInterval(async () => {
          try {
            const progRes = await fetch('http://127.0.0.1:8000/api/v1/system/update/progress')
            const progData = await progRes.json()
            if (progData.success && progData.data) {
              setDownloadProgress(progData.data)
              if (progData.data.status === 'installing') {
                clearInterval(pollIntervalRef.current)
                showToast('Update downloaded. Application will restart shortly...', 'success', 8000)
              } else if (progData.data.status === 'error') {
                clearInterval(pollIntervalRef.current)
                showToast('Error during download: ' + progData.data.message, 'error')
                setIsInstalling(false)
              }
            }
          } catch (err) {
            console.error('Failed to poll progress', err)
          }
        }, 1000)
      } else {
        showToast('Failed to start update download', 'error')
        setIsInstalling(false)
      }
    } catch (e) {
      showToast('Error initiating update', 'error')
      setIsInstalling(false)
    }
  }

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [])

  const handleOpenLogs = async () => {
    try {
      await fetch('http://127.0.0.1:8000/api/v1/system/logs/open-folder', { method: 'POST' })
      showToast('Opened logs folder', 'success')
    } catch (e) {
      showToast('Failed to open logs folder', 'error')
    }
  }

  const handleSave = async () => {
    if (config) {
      setIsSaving(true)
      try {
        await updateSettings(config)
        showToast('Settings saved successfully', 'success')
      } catch (e) {
        showToast('Failed to save settings.', 'error')
      } finally {
        setIsSaving(false)
      }
    }
  }

  // Auto scroll to top when category changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [activeCategory])

  if (!config) {
    return <div className="flex-1 flex items-center justify-center text-white/50">Loading settings...</div>
  }

  return (
    <div className="flex-1 h-full flex relative overflow-hidden bg-gradient-to-br from-[var(--bg-sidebar-from)] via-[var(--bg-sidebar-via)] to-[var(--bg-sidebar-to)]">
      
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <path d="M0,800 C400,900 500,700 1000,1000" fill="none" stroke="#22d3ee" strokeWidth="1" />
          <path d="M0,200 C300,300 400,100 1000,400" fill="none" stroke="#22d3ee" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Top Right Artwork */}
      <PreferencesArtwork config={config} />

      {/* Left Panel */}
      <div className="relative z-10 flex h-full">
        <PreferencesNavigation 
          activeCategory={activeCategory} 
          onSelectCategory={setActiveCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </div>

      {/* Right Panel (Configuration Workspace) */}
      <div className="flex-1 h-full flex flex-col relative z-10 overflow-hidden">
        
        {/* Scrollable Config Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar px-16 pt-16 pb-[140px] flex flex-col gap-16">
          
          {/* Hero Section */}
          <div className="flex flex-col gap-3 relative z-10 max-w-[600px] mb-8">
            <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-md">
              {t('settings.title')}
            </h1>
            <p className="text-[15px] text-white/50 leading-relaxed">
              {t('settings.subtitle')}
            </p>
          </div>

          {(activeCategory === 'general' || searchQuery) && (
            <PreferenceSection id="general" title={t('settings.general.title')} icon={Settings} description={t('settings.general.desc')}>
              <PreferenceDropdown 
                label={t('settings.general.lang')} description={t('settings.general.lang.desc')}
                value={config.general_language} onChange={(v) => updateConfig('general_language', v)}
                options={[{label: 'English (US)', value: 'en'}, {label: 'Indonesian', value: 'id'}]}
              />
              <PreferenceToggle 
                label={t('settings.general.startup')} description={t('settings.general.startup.desc')}
                checked={config.general_launch} onChange={(v) => updateConfig('general_launch', v)}
              />
              <PreferenceToggle 
                label={t('settings.general.update')} description={t('settings.general.update.desc')}
                checked={config.general_update} onChange={(v) => updateConfig('general_update', v)}
              />
            </PreferenceSection>
          )}

          {(activeCategory === 'appearance' || searchQuery) && (
            <PreferenceSection id="appearance" title={t('settings.appearance.title')} icon={Palette} description={t('settings.appearance.desc')}>
              <PreferenceDropdown 
                label={t('settings.appearance.theme')} description={t('settings.appearance.theme.desc')}
                value={config.general_theme} onChange={(v) => updateConfig('general_theme', v)}
                options={[{label: 'Dark Aurora (Default)', value: 'dark'}, {label: 'Midnight Blue', value: 'midnight'}, {label: 'High Contrast', value: 'hc'}]}
              />
              <PreferenceDropdown 
                label={t('settings.appearance.density')} description={t('settings.appearance.density.desc')}
                value={config.app_density} onChange={(v) => updateConfig('app_density', v)}
                options={[{label: 'Comfortable', value: 'comfortable'}, {label: 'Compact (Desktop)', value: 'compact'}]}
              />
              <PreferenceDropdown 
                label="Accent Color" description="Primary glow and interaction color."
                value={config.app_color} onChange={(v) => updateConfig('app_color', v)}
                options={[{label: 'Neon Cyan (Default)', value: 'cyan'}, {label: 'Electric Purple', value: 'purple'}, {label: 'Matrix Green', value: 'green'}]}
              />
              <PreferenceToggle 
                label="Enable UI Animations" description="Use GPU accelerated transitions and micro-animations."
                checked={config.app_anim} onChange={(v) => updateConfig('app_anim', v)}
              />
              <PreferenceToggle 
                label="Compact Sidebar" description="Keep the sidebar collapsed by default."
                checked={config.app_compact} onChange={(v) => updateConfig('app_compact', v)}
              />
            </PreferenceSection>
          )}

          {(activeCategory === 'notifications' || searchQuery) && (
            <PreferenceSection id="notifications" title="System Notifications" icon={Bell} description="Desktop alerts and sound effects.">
              <PreferenceToggle 
                label="Desktop Notifications" description="Show native Windows notifications."
                checked={config.notif_desktop} onChange={(v) => updateConfig('notif_desktop', v)}
              />
              <PreferenceToggle 
                label="Sound Effects" description="Play ui sounds when tasks complete or fail."
                checked={config.notif_sound} onChange={(v) => updateConfig('notif_sound', v)}
              />
              <PreferenceToggle 
                label="Alert on Upload Complete" description="Notify when a video successfully finishes uploading."
                checked={config.notif_success} onChange={(v) => updateConfig('notif_success', v)}
              />
              <PreferenceToggle 
                label="Alert on Upload Failure" description="Notify immediately if an upload crashes or is rejected."
                checked={config.notif_fail} onChange={(v) => updateConfig('notif_fail', v)}
              />
            </PreferenceSection>
          )}

          {(activeCategory === 'uploads' || searchQuery) && (
            <PreferenceSection id="uploads" title="Upload Engine" icon={UploadCloud} description="Configure how the upload queue handles tasks and retries.">
              <PreferenceSlider 
                label="Retry Attempts" description="How many times to retry a failed upload before marking it as error."
                min={0} max={10} value={config.upload_retry} onChange={(v) => updateConfig('upload_retry', v)}
              />
            </PreferenceSection>
          )}

          {(activeCategory === 'ai' || searchQuery) && (
            <AiSettingsSection config={config} updateConfig={updateConfig} />
          )}

          {(activeCategory === 'performance' || searchQuery) && (
            <PreferenceSection id="performance" title="Hardware Performance" icon={Cpu} description="Resource limits and hardware acceleration.">
              <PreferenceDropdown 
                label="Performance Mode" description="Automatically balances resource usage."
                value={config.perf_mode} onChange={(v) => updateConfig('perf_mode', v)}
                options={[{label: 'Balanced', value: 'balanced'}, {label: 'Fast', value: 'fast'}, {label: 'Maximum', value: 'maximum'}]}
              />
              
              <div className="mt-4 pt-4 border-t border-white/[0.05]">
                <button 
                  onClick={() => setShowAdvancedPerf(!showAdvancedPerf)}
                  className="flex items-center gap-2 text-[13px] text-white/50 hover:text-white transition-colors"
                >
                  {showAdvancedPerf ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  Advanced Performance Settings
                </button>
                
                {showAdvancedPerf && (
                  <div className="mt-6 flex flex-col gap-6 pl-4 border-l border-white/[0.05]">
                    <PreferenceSlider 
                      label="Background Workers" description="Number of isolated processes for handling background tasks."
                      min={1} max={16} value={config.perf_workers} onChange={(v) => updateConfig('perf_workers', v)}
                    />
                    <PreferenceSlider 
                      label="CPU Threads" description="Maximum CPU threads allowed during media processing."
                      min={1} max={32} value={config.perf_threads} onChange={(v) => updateConfig('perf_threads', v)}
                    />
                    <PreferenceToggle 
                      label="Hardware Acceleration (GPU)" description="Use Nvidia NVENC / AMD VCE for processing when available."
                      checked={config.perf_gpu} onChange={(v) => updateConfig('perf_gpu', v)}
                    />
                    <PreferenceSlider 
                      label="Memory Cache Limit" description="Maximum RAM allocated for application caching."
                      min={512} max={16384} step={512} unit="MB" value={config.perf_mem} onChange={(v) => updateConfig('perf_mem', v)}
                    />
                  </div>
                )}
              </div>
            </PreferenceSection>
          )}

          {(activeCategory === 'advanced' || searchQuery) && (
            <PreferenceSection id="advanced" title="Advanced Options" icon={Sliders} description="Developer tooling and system configurations.">
              <PreferenceToggle 
                label="Developer Mode" description="Enable extended error logging and debug boundaries."
                checked={config.adv_dev} onChange={(v) => updateConfig('adv_dev', v)}
              />
              <PreferenceToggle 
                label="Retain Logs" description="Keep task logs on disk for 30 days instead of deleting them."
                checked={config.adv_logs} onChange={(v) => updateConfig('adv_logs', v)}
              />
            </PreferenceSection>
          )}

          {(activeCategory === 'about' || searchQuery) && (
            <PreferenceSection id="about" title="About Ryanz Pitstop" icon={Info} description="Application version and licensing information.">
              <div className="pl-4 py-2 border-l-2 border-[var(--accent-500)]/30">
                <p className="text-white text-[14px] font-medium">Ryanz Pitstop Pro</p>
                <p className="text-white/50 text-[12px] mt-1">Current Version: {updateInfo ? updateInfo.local_version : '1.0.0'}</p>
                <p className="text-white/30 text-[11px] mt-4 mb-4">Licensed to the current user.</p>
                
                {updateInfo?.update_available ? (
                  <div className="bg-[var(--accent-500)]/10 border border-[var(--accent-500)]/20 rounded-xl p-4 mt-2">
                    <p className="text-[var(--accent-400)] font-bold text-sm mb-1">New Version Available: {updateInfo.latest_version}</p>
                    <p className="text-white/60 text-xs mb-4 whitespace-pre-line">{updateInfo.release_notes || 'Bug fixes and performance improvements.'}</p>
                    
                    {isInstalling && downloadProgress && downloadProgress.status === 'downloading' && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-white/60 mb-1">
                          <span>Downloading...</span>
                          <span>{downloadProgress.progress}% ({Math.round(downloadProgress.downloaded / 1024 / 1024)}MB / {Math.round(downloadProgress.total / 1024 / 1024)}MB)</span>
                        </div>
                        <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden border border-white/5">
                          <div 
                            className="bg-[var(--accent-500)] h-full transition-all duration-300 relative"
                            style={{ width: `${downloadProgress.progress}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <button 
                      onClick={handleInstallUpdate}
                      disabled={isInstalling}
                      className="px-4 py-2 bg-[var(--accent-500)] text-white text-xs font-bold rounded-lg hover:bg-[var(--accent-600)] transition-colors disabled:opacity-50"
                    >
                      {isInstalling ? (downloadProgress?.status === 'installing' ? 'Restarting Application...' : 'Downloading & Installing...') : 'Download & Install Update'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleCheckUpdate}
                      disabled={isCheckingUpdate}
                      className="px-4 py-2 border border-white/10 text-white/70 text-xs font-medium rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                      {isCheckingUpdate ? 'Checking...' : 'Check for Updates'}
                    </button>
                    <button 
                      onClick={handleOpenLogs}
                      className="px-4 py-2 border border-[var(--accent-500)]/30 bg-[var(--accent-500)]/10 text-[var(--accent-400)] text-xs font-bold rounded-lg hover:bg-[var(--accent-500)]/20 transition-colors flex items-center gap-2"
                    >
                      📁 Open Debug Logs Folder
                    </button>
                  </div>
                )}
              </div>
            </PreferenceSection>
          )}

        </div>

        {/* Sticky Footer */}
        <PreferenceActionBar onSave={handleSave} isSaving={isSaving} />

      </div>
    </div>
  )
}
