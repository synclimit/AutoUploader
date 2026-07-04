import { Search } from 'lucide-react'

export default function PreferencesSearch({ value, onChange }) {
  return (
    <div className="px-4 py-4 shrink-0 border-b border-white/[0.04]">
      <div className="relative group">
        <div className="absolute inset-0 bg-[var(--accent-500)]/10 rounded-[8px] blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="h-[36px] bg-[#0a0f18]/80 backdrop-blur-md rounded-[8px] border border-white/[0.08] flex items-center px-3 gap-2 relative z-10 group-focus-within:border-[var(--accent-500)]/40 group-focus-within:shadow-[0_0_15px_rgba(34,211,238,0.15)] transition-all">
          <Search size={14} className="text-white/40 group-focus-within:text-[var(--accent-400)] transition-colors" />
          <input 
            type="text" 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search preferences..." 
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-white placeholder:text-white/30 font-medium"
          />
        </div>
      </div>
    </div>
  )
}
