import { useState, useEffect } from 'react'
import { useAccountsStore } from '../../../store/accounts/accountsStore'
import { useProfileStore } from '../../../store/profiles/profileStore'
import TooltipHelper from '../../common/TooltipHelper'
import AccountsLogItem from '../logs/AccountsLogItem'
import ConfirmModal from '../../common/ConfirmModal'
import WatchFolderHealthPanel from './WatchFolderHealthPanel'
import apiClient from '../../../api/client'

export default function AccountsPanel() {
  const selectedAccount = useAccountsStore((s) => s.selectedAccount)
  const logs = useAccountsStore((s) => s.logs)
  const updateAccount = useAccountsStore((s) => s.updateAccount)
  const deleteAccount = useAccountsStore((s) => s.deleteAccount)
  
  const profiles = useProfileStore((s) => s.profiles)
  const fetchProfiles = useProfileStore((s) => s.fetchProfiles)

  const startHealthPolling = useAccountsStore((s) => s.startHealthPolling)
  const stopHealthPolling = useAccountsStore((s) => s.stopHealthPolling)

  useEffect(() => {
    startHealthPolling()
    return () => stopHealthPolling()
  }, [startHealthPolling, stopHealthPolling])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  const [channelName, setChannelName] = useState(selectedAccount?.channel_name || '')
  const [sourceType, setSourceType] = useState(selectedAccount?.source_type || 'M1_VIDEO_SPLITTER')
  const [watchEnabled, setWatchEnabled] = useState(selectedAccount?.watch_folder_enabled || false)
  const [watchPath, setWatchPath] = useState(selectedAccount?.watch_folder || '')
  const [targetRegion, setTargetRegion] = useState(selectedAccount?.region || 'Indonesia')
  const [selectedProfileId, setSelectedProfileId] = useState(selectedAccount?.profile_id || '')
  
  const [browserProfile, setBrowserProfile] = useState(selectedAccount?.browser_profile || '')
  const [metadataProfile, setMetadataProfile] = useState(selectedAccount?.metadata_profile || '')
  const [uploadPreset, setUploadPreset] = useState(selectedAccount?.upload_preset || '')
  const [playlist, setPlaylist] = useState(selectedAccount?.playlist || '')
  const [category, setCategory] = useState(selectedAccount?.category || '20')
  const [audience, setAudience] = useState(selectedAccount?.audience || 'not_kids')
  const [license, setLicense] = useState(selectedAccount?.license || 'standard')
  const [language, setLanguage] = useState(selectedAccount?.language || 'en')
  
  const [logsOpen, setLogsOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Sync state when selected account changes
  useEffect(() => {
    if (selectedAccount) {
      setChannelName(selectedAccount.channel_name || '')
      setSourceType(selectedAccount.source_type || 'M1_VIDEO_SPLITTER')
      setWatchEnabled(selectedAccount.watch_folder_enabled || false)
      setWatchPath(selectedAccount.watch_folder || '')
      setTargetRegion(selectedAccount.region || 'Indonesia')
      setSelectedProfileId(selectedAccount.profile_id || '')
      setBrowserProfile(selectedAccount.browser_profile || '')
      setMetadataProfile(selectedAccount.metadata_profile || '')
      setUploadPreset(selectedAccount.upload_preset || '')
      setPlaylist(selectedAccount.playlist || '')
      setCategory(selectedAccount.category || '20')
      setAudience(selectedAccount.audience || 'not_kids')
      setLicense(selectedAccount.license || 'standard')
      setLanguage(selectedAccount.language || 'en')
    }
  }, [selectedAccount])

  if (!selectedAccount) {
    return (
      <div className="flex-1 min-h-0 bg-[#141821] border border-white/5 rounded-2xl flex items-center justify-center text-white/30 text-sm">
        Select an account to view details
      </div>
    )
  }

  return (
    <>
    <div className="flex-1 min-h-0 bg-[#141821] border border-white/5 rounded-2xl overflow-hidden flex flex-col">
      <div className="h-[64px] border-b border-white/5 px-5 flex items-center shrink-0">
        <div>
          <div className="text-sm font-semibold text-purple-300">Account Detail</div>
          <div className="text-[11px] text-white/40 mt-1">
            <TooltipHelper label="Upload identity & automation profile" tooltip="Manage channel configuration including profile templates, watch folder, and target region settings." />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 scroll-smooth overscroll-contain space-y-5">
        
        {/* GENERAL SECTION */}
        <div>
          <div className="text-[11px] font-bold text-white/90 mb-3 tracking-wide">General</div>
          <div className="space-y-1.5">
            <div className="min-h-[72px] flex flex-col justify-center border-b border-white/[0.02] py-1.5">
              <Section title="Nama Saluran">
                <Input value={channelName} onChange={(e) => setChannelName(e.target.value)} />
              </Section>
            </div>
            <div className="grid grid-cols-2 gap-3 min-h-[82px] items-center border-b border-white/[0.02] py-1.5">
              <Section title="Workspace Profile">
                <select 
                  value={selectedProfileId} 
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="w-full h-[34px] rounded-lg bg-white/[0.03] border border-white/5 px-2.5 text-[11px] text-white/85 outline-none appearance-none cursor-pointer focus:border-[var(--accent-500)]/30 transition-all">
                  <option value="" className="bg-[#141821] text-white/50">-- Select Profile --</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id} className="bg-[#141821] text-white">{p.name}</option>
                  ))}
                </select>
              </Section>
              <Section title="Source Type">
                <Select value={sourceType} onChange={setSourceType} options={['MANUAL_UPLOAD', 'M1_VIDEO_SPLITTER', 'M3_PLAYLIST_BUILDER']} />
              </Section>
            </div>
            <div className="min-h-[72px] flex flex-col justify-center border-b border-white/[0.02] py-1.5">
              <Section title={<span className="flex items-center gap-1">Target Region <TooltipHelper label="" tooltip="Future scheduler optimization: upload window timing will be adjusted based on the target region for best engagement."/></span>}>
                <Select value={targetRegion} onChange={setTargetRegion} options={['Indonesia', 'USA', 'Japan', 'Brazil']} />
              </Section>
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-white/[0.02]" />

        {/* AUTOMATION SECTION */}
        <div>
          <div className="text-[11px] font-bold text-white/90 mb-3 tracking-wide">Automation</div>
          <div className="space-y-1.5">
            {(sourceType === 'M1_VIDEO_SPLITTER' || sourceType === 'M3_PLAYLIST_BUILDER') && (
              <div className="min-h-[82px] flex flex-col justify-center border-b border-white/[0.02] py-2">
                <Section title={<span className="flex items-center gap-1">Watch Folder <TooltipHelper label="" tooltip="When enabled, new videos entering this folder will automatically enter the Upload Queue."/></span>}>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <div onClick={() => setWatchEnabled(!watchEnabled)} className={`w-[38px] h-[20px] rounded-full transition-all relative ${watchEnabled ? 'bg-[var(--accent-500)]' : 'bg-white/[0.1]'}`}>
                        <div className={`absolute top-[2px] w-[16px] h-[16px] rounded-full bg-white transition-all ${watchEnabled ? 'left-[20px]' : 'left-[2px]'}`} />
                      </div>
                      <span className="text-[11px] text-white/70">{watchEnabled ? 'Enabled' : 'Disabled'}</span>
                    </label>
                    {watchEnabled && (
                      <FolderInput value={watchPath} onChange={(v) => setWatchPath(v)} />
                    )}
                  </div>
                </Section>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3 min-h-[82px] items-center border-b border-white/[0.02] py-1.5">
              <Section title="Approval Mode">
                <Select value="Always Review" options={['Always Review', 'Auto Approve']} />
              </Section>
              {sourceType === 'M3_PLAYLIST_BUILDER' && (
                <Section title="Gemini Metadata">
                  <Select value="Gemini 1.5 Pro" options={['Gemini 1.5 Pro', 'Gemini 1.5 Flash']} />
                </Section>
              )}
            </div>
            
            {(sourceType === 'M1_VIDEO_SPLITTER' || sourceType === 'M3_PLAYLIST_BUILDER') && (
              <WatchFolderHealthPanel accountId={selectedAccount.id} watchEnabled={watchEnabled} />
            )}
          </div>
        </div>

        <div className="h-[1px] bg-white/[0.02]" />

        {/* AUTHENTICATION SECTION */}
        <div>
          <div className="text-[11px] font-bold text-white/90 mb-3 tracking-wide">Authentication</div>
          <div className="space-y-1.5">
            <div className="min-h-[82px] flex flex-col justify-center border-b border-white/[0.02] py-1.5">
              <Section title="YouTube Connection">
                {selectedAccount.authentication_status === 'Connected' ? (
                  <div className="flex items-center justify-between h-[34px] rounded-lg border border-green-500/20 bg-green-500/5 px-4 text-sm">
                    <span className="text-green-300 text-[11px] font-medium flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      Connected ({selectedAccount.channel_id || 'Unknown ID'})
                    </span>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => {
                          useAccountsStore.getState().refreshOAuthToken(selectedAccount.id)
                        }}
                        className="text-[10px] uppercase font-bold text-cyan-500/70 hover:text-[var(--accent-400)] transition-colors">
                        Refresh Token
                      </button>
                      <button 
                        onClick={() => {
                          apiClient.post(`/oauth/channels/${selectedAccount.id}/reconnect`)
                            .then(data => { if(data && data.auth_url) apiClient.post('/system/open-url', { url: data.auth_url }) })
                            .catch(err => console.error(err))
                        }}
                        className="text-[10px] uppercase font-bold text-white/50 hover:text-white transition-colors">
                        Reconnect
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('Are you sure you want to disconnect this channel?')) {
                            useAccountsStore.getState().disconnectAccount(selectedAccount.id)
                          }
                        }}
                        className="text-[10px] uppercase font-bold text-red-500/70 hover:text-red-400 transition-colors">
                        Disconnect
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between h-[34px] rounded-lg border border-red-500/20 bg-red-500/5 px-4 text-sm">
                    <span className="text-red-300 text-[11px] font-medium">Not Connected</span>
                      <button 
                        onClick={() => {
                          apiClient.post(`/oauth/channels/${selectedAccount.id}/reconnect`)
                            .then(data => { if(data && data.auth_url) apiClient.post('/system/open-url', { url: data.auth_url }) })
                            .catch(err => console.error(err))
                        }}
                        className="text-[10px] uppercase font-bold text-white/70 hover:text-white transition-colors">
                      Connect YouTube
                    </button>
                  </div>
                )}
              </Section>
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-white/[0.02]" />

        {/* UPLOAD DEFAULTS SECTION */}
        <div>
          <div className="text-[11px] font-bold text-white/90 mb-3 tracking-wide">Upload Defaults</div>
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-3 min-h-[82px] items-center border-b border-white/[0.02] py-1.5">
              <Section title="Browser Profile">
                <Input value={browserProfile} onChange={(e) => setBrowserProfile(e.target.value)} placeholder="e.g. Default" />
              </Section>
              <Section title="Upload Preset">
                <Input value={uploadPreset} onChange={(e) => setUploadPreset(e.target.value)} placeholder="e.g. Gaming Preset" />
              </Section>
            </div>
            <div className="grid grid-cols-2 gap-3 min-h-[82px] items-center border-b border-white/[0.02] py-1.5">
              <Section title="Metadata Profile">
                <Input value={metadataProfile} onChange={(e) => setMetadataProfile(e.target.value)} placeholder="e.g. Standard V1" />
              </Section>
              <Section title="Playlist">
                <Input value={playlist} onChange={(e) => setPlaylist(e.target.value)} placeholder="e.g. Let's Play Series" />
              </Section>
            </div>
            <div className="grid grid-cols-4 gap-3 min-h-[82px] items-center border-b border-white/[0.02] py-1.5">
              <Section title="Category">
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. 20" />
              </Section>
              <Section title="Audience">
                <Select value={audience} onChange={setAudience} options={['not_kids', 'kids']} />
              </Section>
              <Section title="License">
                <Select value={license} onChange={setLicense} options={['standard', 'creativeCommon']} />
              </Section>
              <Section title="Language">
                <Select value={language} onChange={setLanguage} options={['en', 'id', 'es', 'ja', 'ko']} />
              </Section>
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-white/[0.02]" />

        {/* QUEUE & SCHEDULING SECTION */}
        <div>
          <div className="text-[11px] font-bold text-white/90 mb-3 tracking-wide">Queue & Scheduling</div>
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-3 min-h-[82px] items-center border-b border-white/[0.02] py-1.5">
              <Section title="Upload Window">
                <Select value="18:00 - 22:00" options={['08:00 - 12:00', '12:00 - 18:00', '18:00 - 22:00', '22:00 - 02:00']} />
              </Section>
              <Section title="Humanized Scheduler">
                <Select value="Enabled (Random +/- 15m)" options={['Disabled', 'Enabled (Random +/- 15m)', 'Enabled (Random +/- 30m)']} />
              </Section>
            </div>
            <div className="min-h-[72px] flex flex-col justify-center border-b border-white/[0.02] py-1.5">
              <Section title="Queue Settings">
                <Select value="Default Priority (Process FIFO)" options={['Default Priority (Process FIFO)', 'High Priority (Bypass Default)']} />
              </Section>
            </div>
          </div>
        </div>

      </div>

      {/* LOGS COLLAPSIBLE */}
      <div className="border-t border-white/5 bg-[#12161e] shrink-0">
        <button onClick={() => setLogsOpen(!logsOpen)} className="w-full h-[34px] px-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
          <div className="text-[11px] font-semibold text-orange-300 tracking-wide flex items-center gap-2">
            Account Logs
            {logsOpen && <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
          </div>
          <svg className={`w-3 h-3 text-orange-300 transition-transform ${logsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {logsOpen && (
          <div className="h-[120px] overflow-y-auto p-3 space-y-1.5 text-[9px] text-white/60 font-mono border-t border-white/5 bg-[#0f1219]">
            {logs.map((log, i) => (
              <AccountsLogItem key={i} message={log} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-white/5 p-4 flex gap-3 bg-[#11141b] shrink-0">
        <button 
          onClick={async () => {
            await updateAccount(selectedAccount.id, {
              channel_name: channelName,
              source_type: sourceType,
              region: targetRegion,
              profile_id: selectedProfileId,
              watch_folder: watchPath,
              watch_folder_enabled: watchEnabled,
              browser_profile: browserProfile,
              metadata_profile: metadataProfile,
              upload_preset: uploadPreset,
              playlist: playlist,
              category: category,
              audience: audience,
              license: license,
              language: language
            })
            useAccountsStore.getState().fetchAllWatchFolderHealth()
          }}
          className="flex-1 bg-[var(--accent-500)]/15 hover:bg-[var(--accent-500)]/20 border border-[var(--accent-500)]/20 text-[var(--accent-400)] rounded-xl py-1.5 text-sm font-medium transition-all">
          Save Changes
        </button>
        <button 
          onClick={() => setShowDeleteConfirm(true)}
          className="flex-[0.5] bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl py-1.5 text-sm text-red-200 font-medium transition-all">
          Delete
        </button>
      </div>
    </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false)
          deleteAccount(selectedAccount.id)
        }}
        title="Delete Account?"
        subtitle="This action cannot be undone."
        itemLabel="Account"
        itemValue={selectedAccount.channel_name}
        confirmLabel="Hapus"
        confirmColor="red"
      />
    </>
  )
}

function FolderInput({ value, onChange }) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="D:\Render\M1"
        className="flex-1 h-[34px] rounded-lg bg-white/[0.03] border border-white/5 px-2.5 text-[11px] text-white/85 outline-none focus:border-[var(--accent-500)]/30 transition-all font-mono"
      />
      <div className="relative group">
        <button
          disabled
          className="h-[34px] px-3 rounded-lg bg-white/[0.02] border border-white/5 text-[10px] text-white/25 cursor-not-allowed flex items-center gap-1.5"
        >
          <span>📁</span>
          <span className="font-medium">Browse</span>
        </button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 border border-white/10 rounded text-[10px] text-white/70 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
          Coming Later — native folder picker
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-white/35 mb-1">
        {title}
      </div>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full h-[34px] rounded-lg bg-white/[0.03] border border-white/5 px-2.5 text-[11px] text-white/85 outline-none focus:border-[var(--accent-500)]/30 transition-all"
    />
  )
}

function Select({ value, onChange, options = [] }) {
  return (
    <div className="relative">
      <select 
        value={value} 
        onChange={(e) => onChange && onChange(e.target.value)}
        className="w-full h-[34px] rounded-lg bg-white/[0.03] border border-white/5 px-2.5 text-[11px] text-white/85 outline-none appearance-none cursor-pointer focus:border-[var(--accent-500)]/30 transition-all">
        {options.map((opt, i) => (
          <option key={i} value={opt} className="bg-[#141821] text-white">{opt}</option>
        ))}
        {options.length === 0 && <option className="bg-[#141821] text-white">{value}</option>}
      </select>
      <span className="absolute right-2.5 top-[10px] text-[10px] text-white/30 pointer-events-none">▼</span>
    </div>
  )
}
