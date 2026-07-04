import { useState } from 'react'
import { useAppStore } from '../store/app/appStore'
import { LayoutDashboard, UploadCloud, CheckSquare, CheckCircle2, History, Radio, Activity, Settings2 } from 'lucide-react'
import { useTranslation } from '../i18n/useTranslation'
import { useSettingsStore } from '../store/settings/settingsStore'

import { useQueueStore } from '../store/upload/uploadStore'

const mainItems = [
  { label: 'Dashboard', transKey: 'nav.dashboard', icon: LayoutDashboard },
  { label: 'Upload', transKey: 'nav.upload', icon: UploadCloud },
  { label: 'Review', transKey: 'nav.review', icon: CheckSquare },
  { label: 'Complete', transKey: 'nav.complete', icon: CheckCircle2 },
  { label: 'Channels', transKey: 'nav.channels', icon: Radio },
  { label: 'Analytics', transKey: 'nav.analytics', icon: Activity },
  { label: 'Settings', transKey: 'nav.settings', icon: Settings2 },
]

export default function Sidebar() {
  const activeModule = useAppStore((s) => s.activeModule)
  const setActiveModule = useAppStore((s) => s.setActiveModule)
  const { t } = useTranslation()
  const config = useSettingsStore(s => s.config)
  const isUploading = useQueueStore(s => s.isUploading)
  const uploadProgress = useQueueStore(s => s.uploadProgress)

  const isCompactMode = config?.app_compact || activeModule === 'Review' || activeModule === 'Completed' || activeModule === 'Channels'
  const [isHovered, setIsHovered] = useState(false)
  const userName = useAppStore((s) => s.userName || 'Admin')
  const setUserName = useAppStore((s) => s.setUserName)
  const [showNameEdit, setShowNameEdit] = useState(false)
  const [tempName, setTempName] = useState(userName)

  return (
    <nav 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`h-full bg-gradient-to-br from-[var(--bg-sidebar-from)] via-[var(--bg-sidebar-via)] to-[var(--bg-sidebar-to)] border-r border-white/[0.04] flex flex-col shrink-0 relative z-50 overflow-hidden shadow-[12px_0_40px_rgba(0,0,0,0.5)] transition-[width] duration-200 group/sidebar ${
        isCompactMode ? 'w-[72px] hover:w-[260px]' : 'w-[260px]'
      }`}
    >
      
      {/* Subtle Background Effects */}
      <div className="absolute top-0 left-[-40px] w-[150px] h-full bg-[var(--accent-500)]/5 blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-[-50px] w-[200px] h-[200px] bg-teal-500/5 blur-[100px] pointer-events-none"></div>
      
      {/* Left Edge Accent Reflection */}
      <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent shadow-[0_0_15px_var(--color-primary-cyan)]"></div>

      {/* Premium Logo Area */}
      <div className="pt-12 pb-8 px-4 flex items-center gap-3.5 shrink-0 relative group cursor-pointer overflow-hidden whitespace-nowrap">
        {/* Soft Ambient Glow Behind Logo */}
        <div className="absolute top-1/2 left-6 w-[40px] h-[40px] -translate-y-1/2 bg-[var(--accent-400)]/15 blur-[20px] rounded-full opacity-40 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        
        <div className="w-[40px] h-[40px] rounded-[12px] shrink-0 bg-gradient-to-br from-[#0c1322] to-[#090e18] border border-[var(--accent-500)]/20 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.4)] group-hover:border-[var(--accent-400)]/40 group-hover:shadow-[0_4px_15px_rgba(34,211,238,0.2)] transition-all duration-200 z-10 relative">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-[var(--accent-400)] drop-shadow-[0_0_4px_rgba(34,211,238,0.5)] group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all duration-200">
            <path d="M5 3l14 9-14 9V3z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <span className={`text-white/95 font-bold text-[17px] tracking-wide relative z-10 transition-all duration-200 ${isCompactMode ? 'opacity-0 group-hover/sidebar:opacity-100' : 'opacity-100'}`}>
          AutoUploader
        </span>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 flex flex-col gap-1 px-3 mt-8 overflow-x-hidden relative z-10">
        {mainItems.map((item) => {
          const isActive = activeModule === item.label
          const Icon = item.icon
          return (
            <button
              key={item.label}
              aria-label={item.label}
              onClick={() => setActiveModule(item.label)}
              className={`w-full flex items-center gap-4 px-[14px] py-[13px] rounded-[12px] group relative shrink-0 overflow-hidden whitespace-nowrap neon-interactive ${
                isActive ? 'active border border-white/[0.04]' : 'border border-transparent bg-transparent'
              }`}
            >
              <div className={`shrink-0 flex items-center justify-center transition-all duration-200 ${isActive ? 'text-[var(--accent-400)] drop-shadow-[0_0_8px_var(--color-primary-cyan)]' : 'text-white/40 group-hover:text-cyan-200/60'}`}>
                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              </div>
              <span className={`text-left text-[14px] tracking-wide transition-all duration-200 ${
                isCompactMode ? 'opacity-0 group-hover/sidebar:opacity-100 w-0 group-hover/sidebar:w-auto' : 'opacity-100'
              } ${isActive ? 'font-bold text-white' : 'font-medium text-white/50 group-hover:text-white/90'}`}>
                {t(item.transKey)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Upload Progress Indicator */}
      {isUploading && (
        <div className={`px-4 mb-3 shrink-0 transition-all duration-300 ${isCompactMode ? 'opacity-0 h-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:h-auto group-hover/sidebar:mb-3' : 'opacity-100 h-auto'}`}>
          <div className="bg-[#05080e]/80 border border-[var(--accent-500)]/20 p-3 rounded-[12px] flex flex-col gap-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-[var(--accent-400)] flex items-center gap-1.5"><UploadCloud size={12} className="animate-bounce" /> Importing...</span>
              <span className="text-white/80">{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[var(--accent-500)] to-[var(--accent-400)] transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Section: Premium Profile Card */}
      <div className="p-3 shrink-0 relative z-10 mb-2 overflow-visible whitespace-nowrap">
        <div onClick={() => { setShowNameEdit(true); setTempName(userName); }} className="px-3 py-3 rounded-[14px] border border-transparent hover:bg-white/[0.03] hover:border-white/[0.05] cursor-pointer flex items-center gap-3.5 group transition-all">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-[#071320] border border-[var(--accent-500)]/20 text-[var(--accent-400)] font-bold text-[12px] flex items-center justify-center shrink-0 shadow-[inset_0_1px_4px_rgba(255,255,255,0.05)]">
            {userName.substring(0, 2).toUpperCase()}
          </div>
          <div className={`flex flex-col min-w-0 justify-center transition-all duration-200 ${
            isCompactMode ? 'opacity-0 group-hover/sidebar:opacity-100 w-0 group-hover/sidebar:w-auto' : 'opacity-100'
          }`}>
            <span className="text-white/90 font-semibold text-[13px] truncate leading-tight group-hover:text-white transition-colors duration-200">{userName}</span>
            <span className="text-[var(--accent-400)]/50 font-bold text-[9px] uppercase tracking-wider truncate mt-0.5">Creator Plan</span>
          </div>
        </div>

        {showNameEdit && (
          <div className="absolute bottom-[70px] left-3 w-[220px] bg-[#0b1d25] border border-[var(--accent-500)]/20 shadow-2xl rounded-[12px] p-3 z-50">
            <span className="text-[11px] font-bold text-white/50 mb-2 block uppercase tracking-wide">Edit Profile Name</span>
            <input 
              autoFocus
              type="text" 
              value={tempName} 
              onChange={e => setTempName(e.target.value)} 
              className="w-full bg-[#05080e]/60 border border-[var(--accent-500)]/30 rounded-[6px] px-2 py-1.5 text-[12px] text-white outline-none focus:border-[var(--accent-400)] mb-2"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setUserName(tempName || 'Admin');
                  setShowNameEdit(false);
                }
              }}
            />
            <div className="flex gap-2">
               <button onClick={() => setShowNameEdit(false)} className="flex-1 px-2 py-1.5 rounded-[6px] border border-white/10 text-white/50 hover:text-white hover:bg-white/5 text-[11px] font-bold transition-colors">Cancel</button>
               <button onClick={() => { setUserName(tempName || 'Admin'); setShowNameEdit(false); }} className="flex-1 px-2 py-1.5 rounded-[6px] bg-[var(--accent-500)]/10 border border-[var(--accent-500)]/30 text-[var(--accent-400)] hover:bg-[var(--accent-500)]/20 text-[11px] font-bold transition-colors">Save</button>
            </div>
          </div>
        )}
      </div>

    </nav>
  )
}