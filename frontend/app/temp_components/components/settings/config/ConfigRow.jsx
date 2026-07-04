export default function ConfigRow({ label, description, type, value }) {
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

          <div className="w-[42px] h-[22px] rounded-full bg-cyan-500/20 border border-cyan-500/20 relative shrink-0">
            <div className="absolute top-[2px] right-[2px] w-[16px] h-[16px] rounded-full bg-cyan-300" />
          </div>
        </div>
      ) : (
        <div className="h-[38px] rounded-lg border border-white/[0.05] bg-[#10141c] px-3 flex items-center justify-between gap-3 overflow-hidden">
          <div className="text-[11px] text-white/90 font-medium truncate flex-1 leading-none">
            {value}
          </div>

          <div className="text-white/30 text-[10px] shrink-0 leading-none">
            {type === 'select' ? '▼' : '●'}
          </div>
        </div>
      )}
    </div>
  )
}
