export default function AnalyticsShell({ children }) {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-primary)] relative">
      <div className="flex-1 overflow-hidden min-h-0 flex flex-col relative z-10">
        {children}
      </div>
    </div>
  )
}
