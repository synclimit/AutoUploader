export default function PreferenceSection({ title, description, icon: Icon, children, id }) {
  return (
    <div id={id} className="flex flex-col gap-6 relative group scroll-mt-24">
      {/* Title Area */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-4">
          <h2 className="text-[13px] font-bold text-[var(--accent-400)] uppercase tracking-[0.2em] flex items-center gap-2.5 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
            {Icon && <Icon size={16} strokeWidth={2.5} />}
            {title}
          </h2>
          <div className="flex-1 h-[1px] bg-gradient-to-r from-cyan-500/30 to-transparent"></div>
        </div>
        {description && (
          <p className="text-[13px] text-white/40 max-w-[600px] leading-relaxed mt-1">
            {description}
          </p>
        )}
      </div>

      {/* Configuration Controls Wrapper with soft separators */}
      <div className="flex flex-col divide-y divide-white/[0.04] border-t border-b border-white/[0.04]">
        {children}
      </div>
    </div>
  )
}
