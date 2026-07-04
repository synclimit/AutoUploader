export default function PreferenceToggle({ label, description, checked, onChange }) {
  return (
    <div 
      className="py-3 flex items-center justify-between cursor-pointer transition-all duration-200 group"
      onClick={() => onChange(!checked)}
    >
      <div className="flex flex-col gap-0.5 pr-8">
        <span className="text-[14px] font-bold text-white/90 group-hover:text-white transition-colors tracking-wide">
          {label}
        </span>
        {description && (
          <span className="text-[12px] text-white/40 group-hover:text-white/50 transition-colors leading-snug">
            {description}
          </span>
        )}
      </div>

      {/* Toggle Switch */}
      <div className={`w-[44px] h-[24px] rounded-full p-1 transition-colors duration-300 relative shrink-0 shadow-inner border ${checked ? 'bg-[var(--accent-500)] border-[var(--accent-400)] shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'bg-[#0f1623] border-white/10'}`}>
        <div className={`w-[16px] h-[16px] bg-white rounded-full shadow-sm transition-transform duration-300 ease-out ${checked ? 'translate-x-[20px]' : 'translate-x-0'}`}></div>
      </div>
    </div>
  )
}
