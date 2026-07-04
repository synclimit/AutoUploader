function SettingsDropdown({ title, value, width }) {
  return (
    <div
      className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2 cursor-pointer hover:border-[var(--accent-500)]/20 transition-all"
      style={{ minWidth: width }}
    >
      <div className="flex-1">
        <div className="text-[10px] uppercase tracking-wide text-white/35 mb-1">
          {title}
        </div>

        <div className="text-sm text-white/85 font-medium flex items-center justify-between">
          <span>{value}</span>
          <span className="text-white/30">▼</span>
        </div>
      </div>
    </div>
  )
}

export default function SettingsHeader() {
  return (
    <div className="h-[72px] border-b border-white/5 bg-[#11141b] px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-lg font-semibold tracking-wide text-[var(--accent-400)]">
          PREFERENCES
        </h1>

        <div className="text-xs text-white/40 mt-1">
          System configuration &amp; automation controls
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <SettingsDropdown title="Workspace" value="DJ Remix Factory" width="220px" />
      </div>
    </div>
  )
}
