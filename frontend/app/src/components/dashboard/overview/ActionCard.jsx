import { ChevronRight } from 'lucide-react'

export default function ActionCard({ title, description, icon: Icon, iconColor, iconBg, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between px-4 py-3 rounded-[16px] bg-[#0d121c]/60 backdrop-blur-xl border border-white/[0.06] hover:border-white/[0.15] hover:bg-[#111824]/80 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] cursor-pointer transition-all duration-300 group shrink-0 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/[0.0] via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="flex items-center gap-4 relative z-10 min-w-0 flex-1">
        <div className={`w-10 h-10 rounded-[12px] ${iconBg} flex items-center justify-center shrink-0 border border-white/[0.05] group-hover:shadow-[inset_0_1px_4px_rgba(255,255,255,0.1),0_0_15px_rgba(255,255,255,0.05)] transition-shadow`}>
          <Icon size={18} className={iconColor} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col min-w-0 flex-1 justify-center">
          <span className="text-white font-bold text-[14px] tracking-wide group-hover:text-cyan-100 transition-colors truncate drop-shadow-sm leading-tight mb-0.5">{title}</span>
          <span className="text-white/50 text-[12px] truncate leading-tight">{description}</span>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-white/50 group-hover:text-white group-hover:bg-white/[0.1] shadow-inner transition-all relative z-10 shrink-0 ml-3">
        <ChevronRight size={16} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  )
}
