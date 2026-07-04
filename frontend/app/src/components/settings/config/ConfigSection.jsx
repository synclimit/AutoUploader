export default function ConfigSection({ title, description, children, status, stickyHeader, id }) {
  return (
    <div id={id} className="rounded-xl border border-white/5 bg-[#141821] overflow-hidden snap-start">
      <div className={`h-[58px] border-b border-white/5 px-5 flex items-center justify-between z-20 bg-[#141821] ${stickyHeader ? 'sticky top-0' : ''}`}>
        <div>
          <div className="text-[13px] font-semibold text-[var(--accent-400)]">
            {title}
          </div>

          <div className="text-[10px] text-white/35 mt-1">
            {description}
          </div>
        </div>
      </div>

      <div className="p-4">
        {children}
      </div>
    </div>
  )
}
