import { useAppStore } from '../store/app/appStore'
import { useState, useRef, useEffect } from 'react'
import { Bell, UploadCloud, CheckSquare, CheckCircle2, LayoutDashboard, Radio, Activity, AlertTriangle, X, ShieldAlert } from 'lucide-react'
import { useQueueStore } from '../store/upload/uploadStore'
import { useAccountsStore } from '../store/accounts/accountsStore'

export default function Topbar() {
  const { activeModule, userName } = useAppStore()
  const [showNotifs, setShowNotifs] = useState(false)
  const notifRef = useRef(null)
  
  const tasks = useQueueStore(s => s.tasks || [])
  const accounts = useAccountsStore(s => s.accounts || [])
  
  const failedTasks = tasks.filter(t => t.status === 'FAILED')
  const oauthIssues = accounts.filter(a => a.auth_status !== 'authenticated' || a.status !== 'active')
  
  const notifications = [
    ...failedTasks.map(t => ({ id: `task-${t.id}`, type: 'error', text: `Upload Failed: ${t.title || 'Unknown Video'}`, subtext: 'Check Complete or Review tab for details.' })),
    ...oauthIssues.map(a => ({ id: `acc-${a.id}`, type: 'critical', text: `Auth Issue: ${a.channel_name || 'Channel'}`, subtext: 'OAuth expired or channel disconnected. Please re-authenticate.' }))
  ]
  const hasErrors = notifications.length > 0
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const titles = {
    'Import': {
      title: 'Import Videos',
      subtitle: 'Upload, connect cloud storage, or auto-sync your library.',
      icon: <UploadCloud size={20} className="text-[var(--accent-400)] drop-shadow-[0_0_8px_var(--color-primary-cyan)]" />
    },
    'Review': {
      title: 'Review Videos',
      subtitle: 'Inspect, edit metadata, and approve your videos for publishing.',
      icon: <CheckSquare size={20} className="text-[var(--accent-400)] drop-shadow-[0_0_8px_var(--color-primary-cyan)]" />
    },
    'Completed': {
      title: 'Completed',
      subtitle: 'Monitor all approved videos and scheduled uploads in real time.',
      icon: <CheckCircle2 size={20} className="text-[var(--accent-400)] drop-shadow-[0_0_8px_var(--color-primary-cyan)]" />
    },
    'Channels': {
      title: 'Channel Management',
      subtitle: 'Configure watch folders, defaults, and connection profiles for all your channels.',
      icon: <Radio size={20} className="text-[var(--accent-400)] drop-shadow-[0_0_8px_var(--color-primary-cyan)]" />
    },
    'Analytics': {
      title: 'Channel Analytics',
      subtitle: 'Comprehensive performance telemetries, AI diagnostics, and growth insights.',
      icon: <Activity size={20} className="text-[var(--accent-400)] drop-shadow-[0_0_8px_var(--color-primary-cyan)]" />
    },
    'Dashboard': {
      title: 'Dashboard Overview',
      subtitle: 'Real-time telemetry and automation status across your channels.',
      icon: <LayoutDashboard size={20} className="text-[var(--accent-400)] drop-shadow-[0_0_8px_var(--color-primary-cyan)]" />
    },
    'Home': {
      title: `Good Evening, ${userName || 'Admin'}`,
      subtitle: 'Here is what\'s happening with your channels today.',
      icon: <LayoutDashboard size={20} className="text-[var(--accent-400)] drop-shadow-[0_0_8px_var(--color-primary-cyan)]" />
    },
  }

  const current = titles[activeModule] || titles['Home']

  return (
    <header className="px-5 pt-2 pb-0 shrink-0 relative z-40 pywebview-drag-region select-none">
      <div className="w-full h-[56px] min-h-[56px] px-5 bg-[#05080e]/60 backdrop-blur-3xl border border-white/[0.08] rounded-[16px] flex items-center justify-between relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.3)] group neon-interactive">
        
        {/* Animated Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/10 via-[#05080e]/20 to-[#05080e]/60 z-0 pointer-events-none"></div>
        <div className="absolute top-[-50%] left-[-10%] w-[300px] h-[300px] bg-[var(--accent-400)]/15 blur-[100px] rounded-full z-0 pointer-events-none animate-aurora"></div>
        <div className="absolute bottom-[-50%] right-[10%] w-[200px] h-[200px] bg-teal-400/10 blur-[80px] rounded-full z-0 pointer-events-none animate-aurora" style={{ animationDelay: '5s' }}></div>
        
        {/* Abstract Vector Wave */}
        <svg className="absolute inset-0 w-full h-full opacity-60 z-0 pointer-events-none animate-wave-float" viewBox="0 0 1000 100" preserveAspectRatio="none">
          <path d="M0,50 Q250,90 500,50 T1000,50" fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.3" filter="url(#glowTopbar)"/>
          <path d="M0,60 Q250,20 500,60 T1000,60" fill="none" stroke="#22d3ee" strokeWidth="0.5" opacity="0.15"/>
          <defs>
            <filter id="glowTopbar" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </svg>

        {/* Minimal Particles/Dots */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiMyMmQzZWUiIG9wYWNpdHk9IjAuNSIvPjwvc3ZnPg==')] [mask-image:linear-gradient(to_right,white,transparent_30%)]"></div>

        {/* Left Side: Greeting */}
        {/* Left Side: Content */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-2 rounded-xl bg-[var(--accent-500)]/10 border border-[var(--accent-500)]/20">
            {current.icon}
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-[16px] font-bold text-white flex items-center gap-2 drop-shadow-md tracking-wide leading-tight">
              {current.title}
            </h1>
            <div className="text-[12px] text-white/50 mt-0.5 font-medium tracking-wide leading-tight">
              {current.subtitle}
            </div>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="relative z-10 flex items-center gap-3 shrink-0 ml-4">
          <div className="relative" ref={notifRef}>
            <button aria-label="Notifications" onClick={() => setShowNotifs(!showNotifs)} className={`w-9 h-9 rounded-full bg-[#0d131f]/80 border border-white/[0.08] flex items-center justify-center transition-all relative group cursor-pointer shrink-0 ${hasErrors ? 'text-white/80 hover:text-[var(--accent-400)]' : 'text-white/30 hover:text-white/60'}`}>
              <Bell size={16} strokeWidth={2.5} className={hasErrors ? "group-hover:scale-110 transition-transform" : ""} />
              {hasErrors && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0d131f] shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></div>
              )}
            </button>
            
            {showNotifs && (
              <div className="absolute top-[48px] right-0 w-[320px] bg-[#0b1d25] border border-[var(--accent-500)]/20 shadow-2xl rounded-[12px] p-2 z-50 flex flex-col gap-2">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-[12px] font-bold text-white/70 uppercase tracking-wider">Alerts & Notifications</span>
                  <button onClick={() => setShowNotifs(false)} className="text-white/40 hover:text-white transition-colors"><X size={14}/></button>
                </div>
                {notifications.length === 0 ? (
                  <div className="py-6 flex flex-col items-center justify-center text-white/30">
                    <CheckCircle2 size={24} className="mb-2 text-green-500/50" />
                    <span className="text-[12px]">All systems operational</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {notifications.map(n => (
                      <div key={n.id} className="flex gap-3 p-2 rounded-[8px] bg-red-500/10 border border-red-500/20 items-start">
                        {n.type === 'critical' ? <ShieldAlert size={16} className="text-red-400 shrink-0 mt-0.5" /> : <AlertTriangle size={16} className="text-orange-400 shrink-0 mt-0.5" />}
                        <div className="flex flex-col">
                          <span className="text-[12px] font-bold text-white/90 leading-tight">{n.text}</span>
                          <span className="text-[11px] text-white/50 leading-tight mt-0.5">{n.subtext}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button aria-label="User Profile" className="w-9 h-9 rounded-full bg-[var(--accent-500)]/10 border border-[var(--accent-500)]/30 text-[var(--accent-400)] font-bold text-[13px] flex items-center justify-center hover:bg-[var(--accent-500)]/20 hover:shadow-[0_0_24px_rgba(34,211,238,0.3)] hover:scale-105 transition-all cursor-pointer shrink-0 mr-4">
            {(userName || 'Admin').substring(0, 2).toUpperCase()}
          </button>

          {/* Window Controls */}
          <div className="flex items-center gap-1 border-l border-white/[0.08] pl-4 h-6">
            <button aria-label="Minimize" onClick={() => window.pywebview?.api?.minimize()} className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
            <button aria-label="Maximize" onClick={() => window.pywebview?.api?.maximize()} className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="8" height="8" strokeWidth="1.5" rx="1"/></svg>
            </button>
            <button aria-label="Close" onClick={() => window.pywebview?.api?.close()} className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-red-500 rounded-md transition-colors cursor-pointer">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3 3L9 9M9 3L3 9" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}