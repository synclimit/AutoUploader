import { Upload } from 'lucide-react'
import { useAppStore } from '../../../store/app/appStore'
import { useTranslation } from '../../../i18n/useTranslation'

export default function HomeHero() {
  const { setActiveModule, userName } = useAppStore()
  const { t } = useTranslation()

  return (
    <div className="relative w-full h-[85px] min-h-[85px] rounded-[16px] overflow-hidden flex items-center bg-[#070b13]/90 border border-[var(--accent-500)]/20 shadow-[0_4px_24px_rgba(34,211,238,0.05)] shrink-0">
      
      {/* Background Effects (Hardware Accelerated) */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f1a]/80 via-[#0d1624]/60 to-[#0a141e]/80 z-0"></div>
      <div className="absolute top-[-50%] right-[0%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(34,211,238,0.12)_0%,transparent_70%)] rounded-full z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-50%] left-[20%] w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(6,182,212,0.08)_0%,transparent_70%)] rounded-full z-0 pointer-events-none"></div>
      
      {/* Abstract Lines SVG with Depth */}
      <svg className="absolute inset-0 w-full h-full opacity-40 z-0 pointer-events-none" viewBox="0 0 1000 85" preserveAspectRatio="none">
        <path d="M0,45 Q250,85 500,45 T1000,45" fill="none" stroke="#22d3ee" strokeWidth="1.5" opacity="0.4"/>
        <path d="M0,60 Q250,25 500,60 T1000,60" fill="none" stroke="#22d3ee" strokeWidth="0.75" opacity="0.2"/>
        <path d="M0,30 Q250,85 500,30 T1000,30" fill="none" stroke="#67e8f9" strokeWidth="1" opacity="0.3"/>
      </svg>

      <div className="relative z-10 px-6 flex-1 flex justify-between items-center h-full">
        {/* Left Content */}
        <div className="max-w-xl flex flex-col justify-center items-start">
          <div className="text-white/60 text-[13px] font-semibold tracking-tight mb-0.5 drop-shadow-sm">{t('dashboard.welcome')} {userName || 'Admin'}</div>
          <div className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-cyan-500 text-[20px] font-black tracking-tight drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">Semuanya berjalan lancar.</div>
        </div>

        {/* Right Content */}
        <div className="flex items-center gap-4 shrink-0">
          <button 
            onClick={() => setActiveModule('Import')}
            className="group px-4 py-2 rounded-xl bg-gradient-to-b from-cyan-400 to-cyan-500 text-[#05070b] font-bold text-[12px] flex items-center gap-2 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all duration-300"
          >
            <Upload size={14} strokeWidth={2.5} className="group-hover:-translate-y-0.5 transition-transform" />
            Impor Video
          </button>
        </div>
      </div>
    </div>
  )
}
