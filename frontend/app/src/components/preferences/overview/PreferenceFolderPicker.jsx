import { Folder } from 'lucide-react'

export default function PreferenceFolderPicker({ label, description, value }) {
  return (
    <div className="p-4 rounded-[14px] bg-[#0a0f18]/60 backdrop-blur-md border border-white/[0.04] flex items-center justify-between group shadow-[inset_0_1px_2px_rgba(255,255,255,0.02),0_4px_15px_rgba(0,0,0,0.2)]">
      
      <div className="flex flex-col gap-0.5 pr-8">
        <span className="text-[14px] font-bold text-white/90 tracking-wide">
          {label}
        </span>
        {description && (
          <span className="text-[12px] text-white/40 leading-snug">
            {description}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="w-[300px] h-[36px] bg-[#0f1623] border border-white/[0.08] rounded-[8px] px-3 flex items-center gap-2 shadow-inner group-hover:border-white/10 transition-colors">
          <Folder size={14} className="text-[var(--accent-400)]/50 shrink-0" />
          <span className="text-[13px] text-white/70 font-mono truncate">
            {value || 'No folder selected'}
          </span>
        </div>
        <button className="h-[36px] px-4 rounded-[8px] bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] hover:border-[var(--accent-500)]/30 hover:text-[var(--accent-400)] text-white/80 text-[12px] font-bold transition-all neon-interactive shadow-[0_2px_10px_rgba(0,0,0,0.1)] shrink-0">
          Browse...
        </button>
      </div>

    </div>
  )
}
