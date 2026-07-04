import { ChevronRight } from 'lucide-react'

export default function QuickActionCard({ title, icon: Icon, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between px-4 py-3 rounded-[16px] bg-[#0d121c]/60 backdrop-blur-xl border border-white/[0.06] hover:border-[var(--accent-500)]/40 hover:bg-[#111824]/80 hover:shadow-[0_8px_32px_rgba(34,211,238,0.15)] cursor-pointer transition-all duration-300 group shrink-0 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="flex items-center gap-4 relative z-10 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-[12px] bg-[var(--accent-500)]/10 flex items-center justify-center shrink-0 group-hover:bg-[var(--accent-500)]/20 shadow-[inset_0_1px_4px_rgba(255,255,255,0.05)] group-hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all">
          <Icon size={20} className="text-[var(--accent-400)]" strokeWidth={2.5} />
        </div>
        <span className="text-white font-bold text-[14px] tracking-wide group-hover:text-[var(--accent-400)] transition-colors drop-shadow-sm truncate">{title}</span>
      </div>
      <div className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-white/50 group-hover:text-[var(--accent-400)] group-hover:bg-[var(--accent-500)]/10 shadow-inner group-hover:shadow-[0_0_15px_var(--color-primary-cyan)] transition-all relative z-10 shrink-0 ml-3">
        <ChevronRight size={16} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  )
}
