export default function PreferenceSlider({ label, description, min, max, step = 1, value, onChange, unit = '' }) {
  return (
    <div className="py-3 flex flex-col gap-3 group">
      
      <div className="flex items-start justify-between">
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
        
        <div className="px-3 py-1 bg-white/[0.03] border border-white/[0.08] rounded-[6px] text-[13px] font-mono text-[var(--accent-400)] font-bold shadow-inner">
          {value}{unit}
        </div>
      </div>

      <div className="relative h-[24px] flex items-center group/slider mt-1">
        {/* Track Base */}
        <div className="absolute w-full h-[4px] bg-white/[0.08] rounded-full overflow-hidden">
          {/* Active Track */}
          <div 
            className="h-full bg-[var(--accent-500)] shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-100 ease-linear"
            style={{ width: `${((value - min) / (max - min)) * 100}%` }}
          ></div>
        </div>
        
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer"
        />
        
        {/* Custom Thumb (Visual Only) */}
        <div 
          className="absolute w-[16px] h-[16px] bg-white rounded-full border-2 border-[var(--accent-400)] shadow-[0_0_10px_rgba(34,211,238,0.6)] pointer-events-none transition-transform duration-100 group-hover/slider:scale-125"
          style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 8px)` }}
        ></div>
      </div>
      
      <div className="flex justify-between text-[11px] text-white/30 font-medium mt-[-4px]">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>

    </div>
  )
}
