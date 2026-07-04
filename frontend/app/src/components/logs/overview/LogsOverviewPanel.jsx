import ActivityLogs from '../../ActivityLogs'

export default function LogsOverviewPanel() {
  return (
    <div className="h-full flex flex-col px-6 pt-2 pb-6">
      <div className="mb-6 relative w-full min-h-[90px] rounded-[24px] overflow-hidden flex items-center bg-[#05080e]/60 backdrop-blur-2xl border border-[var(--accent-500)]/20 shadow-[0_8px_32px_rgba(34,211,238,0.05)] shrink-0 my-2">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f1a]/80 via-[#0d1624]/60 to-[#0a141e]/80 z-0"></div>
        <div className="relative z-10 px-8 flex-1 flex flex-col justify-center h-full">
           <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">Completed Uploads</h1>
           <p className="text-white/60 text-sm mt-1 tracking-wide">Review your completed upload history and activity logs.</p>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {/* We reuse the ActivityLogs but give it full height manually or just render it */}
        <ActivityLogs />
      </div>
    </div>
  )
}
