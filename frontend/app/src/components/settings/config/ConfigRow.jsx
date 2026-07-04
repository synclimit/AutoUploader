export default function ConfigRow({ label, description, type, value, options }) {
  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 min-h-[92px] flex flex-col justify-between gap-3">
      <div>
        <div className="text-[12px] font-semibold text-white/90 leading-relaxed tracking-[0.01em]">
          {label}
        </div>

        <div className="text-[9px] text-white/38 mt-1.5 leading-[1.6] pr-2 break-words">
          {description}
        </div>
      </div>

      {type === 'toggle' ? (
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="text-[11px] font-semibold text-green-300 leading-none">
            {value}
          </div>

          <div className="w-[42px] h-[22px] rounded-full bg-[var(--accent-500)]/20 border border-[var(--accent-500)]/20 relative shrink-0">
            <div className="absolute top-[2px] right-[2px] w-[16px] h-[16px] rounded-full bg-cyan-300" />
          </div>
        </div>
      ) : type === 'api-key' ? (
        <div className="pt-2 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="h-[34px] flex-1 rounded-lg border border-white/10 bg-[#0a0c10] px-3 flex items-center">
              <span className="text-[14px] text-white/50 tracking-[0.2em] translate-y-[2px]">{value}</span>
            </div>
            <button className="h-[34px] px-4 rounded-lg bg-[var(--accent-500)]/10 hover:bg-[var(--accent-500)]/20 border border-[var(--accent-500)]/20 text-[10px] font-bold text-[var(--accent-400)] transition-colors">
              Test Connection
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-wider text-white/40">Status:</span>
            <span className="text-[10px] font-bold text-green-400">Connected</span>
          </div>
        </div>
      ) : type === 'gemini-usage' ? (
        <div className="pt-2 flex flex-col gap-2">
          <div className="h-[34px] rounded-lg border border-[var(--accent-500)]/10 bg-[var(--accent-500)]/5 px-3 flex items-center justify-between">
            <span className="text-[10px] text-white/50 uppercase tracking-wider">Daily Requests</span>
            <span className="text-[11px] font-bold text-[var(--accent-400)]">{value}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[9px] uppercase tracking-wider text-white/40">Status:</span>
            <span className="text-[10px] font-bold text-green-400">Healthy</span>
          </div>
        </div>
      ) : type === 'backup-status' ? (
        <div className="pt-2 flex flex-col gap-2">
          <div className="h-[34px] rounded-lg border border-white/[0.05] bg-[#10141c] px-3 flex items-center justify-between">
            <span className="text-[11px] font-mono text-white/50">{value}</span>
            <span className="text-[10px] text-white/30 uppercase">Timestamp</span>
          </div>
        </div>
      ) : type === 'backup-actions' ? (
        <div className="pt-2 flex items-center gap-2">
          <button className="flex-[0.5] h-[34px] rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-white/80 transition-colors">
            Export
          </button>
          <button className="flex-[0.5] h-[34px] rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-white/80 transition-colors">
            Import
          </button>
          <button className="flex-1 h-[34px] rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-[10px] font-bold text-purple-300 transition-colors">
            Backup Now
          </button>
        </div>
      ) : type === 'path-input' ? (
        <div className="pt-2 flex flex-col gap-2">
          <div className="h-[34px] rounded-lg border border-white/[0.05] bg-[#10141c] px-3 flex items-center gap-2">
            <span className="text-[10px] text-white/30 shrink-0">📁</span>
            <input 
              type="text" 
              defaultValue={value}
              className="w-full h-full bg-transparent text-[11px] text-white/90 font-mono outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-wider text-white/40">Status:</span>
            <span className="text-[10px] font-bold text-green-400">Connected</span>
          </div>
        </div>
      ) : type === 'select' ? (
        <div className="h-[38px] rounded-lg border border-white/[0.05] bg-[#10141c] px-3 flex items-center justify-between gap-3 overflow-hidden relative">
          <select 
            className="w-full h-full bg-transparent text-[11px] text-white/90 font-medium outline-none appearance-none cursor-pointer"
            defaultValue={value}
          >
            {options?.map(opt => (
              <option key={opt} value={opt} className="bg-[#141821] text-white">{opt}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 text-white/30 text-[10px] shrink-0 leading-none">
            ▼
          </div>
        </div>
      ) : (
        <div className="h-[38px] rounded-lg border border-white/[0.05] bg-[#10141c] px-3 flex items-center justify-between gap-3 overflow-hidden">
          <div className="text-[11px] text-white/90 font-medium truncate flex-1 leading-none">
            {value}
          </div>
          <div className="text-white/30 text-[10px] shrink-0 leading-none">
            ●
          </div>
        </div>
      )}
    </div>
  )
}
