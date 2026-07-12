const scheduledUploads = [
  { title: 'DJ TABOLA BALE X CALON MANTU IDAMAN', channel: 'DJ Channel A', mode: 'MF MODE 3', schedule: 'Today, 21:00', status: 'Ready', statusColor: 'bg-green-400', progress: 100 },
  { title: 'NIGHTCLUB VISUALIZER VOL.3', channel: 'DJ Channel B', mode: 'MF MODE 2', schedule: 'Today, 22:30', status: 'Scheduled', statusColor: 'bg-cyan-400', progress: 0 },
  { title: 'BASS DROP COMPILATION 2025', channel: 'DJ Channel C', mode: 'OCR MODE', schedule: 'Tomorrow, 08:00', status: 'Scheduled', statusColor: 'bg-cyan-400', progress: 0 },
  { title: 'AUDIO VISUALIZATION PACK #12', channel: 'DJ Channel A', mode: 'AI MODE', schedule: 'Tomorrow, 12:00', status: 'Processing', statusColor: 'bg-yellow-400', progress: 45 },
  { title: 'SUMMER MIX 2025 - DJ SET', channel: 'DJ Channel B', mode: 'MF MODE 1', schedule: 'Tomorrow, 18:00', status: 'Scheduled', statusColor: 'bg-cyan-400', progress: 0 },
  { title: 'MIDNIGHT SESSION VOL.5', channel: 'DJ Channel C', mode: 'OCR MODE', schedule: 'Wed, 09:00', status: 'Draft', statusColor: 'bg-white/30', progress: 0 },
]

const criticalIssues = [
  { title: 'YouTube API Quota Exceeded', reason: 'Daily upload limit reached for Channel A', fix: 'Wait until quota resets at 00:00 UTC or switch to Channel B' },
  { title: 'Metadata AI Service Unavailable', reason: 'AI processing server returned 503 errors', fix: 'Restart AI service or fall back to manual metadata entry' },
  { title: 'OCR Engine Timeout', reason: 'Thumbnail text extraction taking >30s', fix: 'Reduce thumbnail complexity or increase OCR timeout in settings' },
]

const systemStatus = [
  { name: 'OCR Engine', status: 'Operational', color: 'text-green-400' },
  { name: 'Metadata AI', status: 'Degraded', color: 'text-yellow-400' },
  { name: 'Scheduler', status: 'Operational', color: 'text-green-400' },
  { name: 'Queue Engine', status: 'Operational', color: 'text-green-400' },
]

const activityFeed = [
  { message: 'Video "Summer Mix 2025" uploaded successfully', time: '2 min ago', type: 'success' },
  { message: 'Channel B quota at 85%', time: '5 min ago', type: 'warning' },
  { message: 'OCR processing completed for 3 thumbnails', time: '8 min ago', type: 'info' },
  { message: 'Scheduler added 5 new upload tasks', time: '12 min ago', type: 'info' },
  { message: 'Retry engine re-queued 2 failed uploads', time: '15 min ago', type: 'warning' },
  { message: 'Metadata AI generated titles for queue items', time: '20 min ago', type: 'info' },
  { message: 'YouTube API quota 70% consumed', time: '25 min ago', type: 'info' },
  { message: 'Upload "Bass Drop Compilation" failed - network timeout', time: '30 min ago', type: 'error' },
]

const activityDotColor = {
  success: 'bg-green-400',
  warning: 'bg-yellow-400',
  error: 'bg-red-400',
  info: 'bg-cyan-400',
}

export default function DashboardOverviewPanel() {

  return (

    <div className="flex-1 h-full overflow-hidden p-4 grid grid-cols-[65fr_35fr] gap-3 min-h-0">

      {/* LEFT COLUMN — 65% — Scheduled Upload Queue, full height */}

      <div className="bg-[#101722] border border-white/[0.05] rounded-2xl flex flex-col overflow-hidden min-h-0">

          <div className="border-b border-white/[0.05] px-4 py-3 shrink-0">
            <h2 className="text-cyan-400 font-bold text-lg">
              Scheduled Upload Queue
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 snap-y snap-mandatory">

            {scheduledUploads.map((item, i) => (

              <div
                key={i}
                className={`rounded-2xl border p-3 snap-start transition-all ${
                  i === 0
                    ? 'border-cyan-500/30 bg-cyan-500/[0.04]'
                    : 'border-white/[0.05] bg-white/[0.02]'
                }`}
              >

                <div className="flex gap-3">

                  {/* Thumbnail placeholder */}
                  <div className="w-[72px] h-[72px] rounded-xl bg-[#232938] border border-white/[0.05] shrink-0 flex items-center justify-center text-white/15 text-2xl">
                    ♪
                  </div>

                  <div className="flex-1 min-w-0">

                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0 flex-1">

                        <div className="text-[18px] leading-tight font-bold text-white break-words">
                          {item.title}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/45">
                          <span>{item.schedule}</span>
                          <span>•</span>
                          <span>{item.channel}</span>
                          <span>•</span>
                          <span className="text-cyan-300 font-semibold">
                            {item.mode}
                          </span>
                        </div>

                      </div>

                      {/* Status badge */}
                      <div className="shrink-0 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className={`w-2 h-2 rounded-full ${item.statusColor}`} />
                          <div className="text-sm font-bold text-white">
                            {item.status}
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 h-[4px] bg-white/[0.05] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 rounded-full transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>

                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>

        {/* RIGHT COLUMN — 35% — Critical Issues (70%) + System Status / Activity Feed (30%) */}

        <div className="flex flex-col min-h-0">

          {/* CRITICAL ISSUES — 70% of right column */}

          <div className="flex-[7] bg-[#101722] border border-white/[0.05] rounded-2xl flex flex-col overflow-hidden min-h-0">

            <div className="border-b border-white/[0.05] px-4 py-3 shrink-0">
              <h2 className="text-red-400 font-bold text-lg">
                Critical Issues
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 snap-y snap-mandatory">

              {criticalIssues.map((issue, i) => (

                <div
                  key={i}
                  className="rounded-2xl border border-red-500/10 bg-red-500/[0.03] p-3 snap-start"
                >

                  <div className="flex items-start gap-2.5">

                    <div className="w-2 h-2 rounded-full bg-red-400 shrink-0 mt-1.5" />

                    <div className="min-w-0 flex-1">

                      <div className="text-sm font-bold text-white">
                        {issue.title}
                      </div>

                      <div className="mt-1.5 text-[11px] text-white/45 leading-relaxed">
                        <span className="text-white/40">Reason:</span> {issue.reason}
                      </div>

                      <div className="mt-1.5 text-[11px] text-cyan-300/70 leading-relaxed">
                        <span className="text-white/40">Fix:</span> {issue.fix}
                      </div>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          </div>


          {/* BOTTOM ROW — 30% of right column — System Status (left) + Activity Feed (right) */}

          <div className="flex-[3] grid grid-cols-2 gap-3 min-h-0">

            {/* SYSTEM STATUS — vertical dot-separated list */}

            <div className="bg-[#101722] border border-white/[0.05] rounded-2xl flex flex-col overflow-hidden">

              <div className="border-b border-white/[0.05] px-3 py-2.5 shrink-0">
                <h2 className="text-cyan-400 font-bold text-[13px]">
                  System Status
                </h2>
              </div>

              <div className="flex-1 flex flex-col justify-center gap-1 px-3 py-2">

                {systemStatus.map((svc, i) => (

                  <div
                    key={i}
                    className="flex items-center justify-between"
                  >

                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        svc.color === 'text-green-400' ? 'bg-green-400' :
                        svc.color === 'text-yellow-400' ? 'bg-yellow-400' :
                        'bg-red-400'
                      }`} />
                      <span className="text-[13px] text-white/80 whitespace-nowrap">
                        {svc.name}
                      </span>
                    </div>

                    <span className={`text-[12px] font-semibold ${svc.color} whitespace-nowrap`}>
                      {svc.status}
                    </span>

                  </div>

                ))}

              </div>

            </div>

            {/* ACTIVITY FEED — compact log layout, no truncation */}

            <div className="bg-[#101722] border border-white/[0.05] rounded-2xl flex flex-col overflow-hidden">

              <div className="border-b border-white/[0.05] px-3 py-2.5 shrink-0">
                <h2 className="text-cyan-400 font-bold text-[13px]">
                  Activity Feed
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto">

                {activityFeed.map((activity, i) => (

                  <div
                    key={i}
                    className="flex items-start justify-between gap-2 px-3 py-2 border-b border-white/[0.02] last:border-0 snap-start"
                  >

                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-0.5 ${activityDotColor[activity.type]}`} />
                      <span className="text-[12px] text-white/80 leading-snug">
                        {activity.message}
                      </span>
                    </div>

                    <span className="text-[10px] text-white/30 shrink-0 whitespace-nowrap mt-0.5">
                      {activity.time}
                    </span>

                  </div>

                ))}

              </div>

            </div>

          </div>

        </div>

    </div>

  )

}
