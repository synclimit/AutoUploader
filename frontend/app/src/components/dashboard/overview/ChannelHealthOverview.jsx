import { Shield, Clock, Video, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

export default function ChannelHealthOverview({ channels = [] }) {
  const getHealthStyle = (score) => {
    if (score >= 95) return { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: CheckCircle2 }
    if (score >= 80) return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: CheckCircle2 }
    if (score >= 60) return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle }
    return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle }
  }

  const rawChannels = channels || []

  // Sort by Health Score (Unhealthy First)
  const sortedChannels = [...rawChannels].sort((a, b) => a.score - b.score)

  return (
    <div className="flex flex-col gap-3 shrink-0">
      <h2 className="text-[14px] font-bold text-white tracking-wide">Channel Health Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {sortedChannels.map((c, i) => {
          const health = getHealthStyle(c.score)
          const StatusIcon = health.icon

          return (
            <div key={i} className="bg-white/5 border border-white/10 rounded-[12px] p-3 flex flex-col relative overflow-hidden group hover:bg-white/10 transition-colors">
              {/* Header */}
              <div className="flex justify-between items-start mb-3 z-10 relative">
                <div className="flex flex-col min-w-0">
                  <div className="text-[13px] font-bold text-white truncate max-w-[140px]">{c.name}</div>
                  <div className="text-[11px] font-medium text-white/50">{c.handle}</div>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-[6px] border ${health.bg} ${health.border}`}>
                  <StatusIcon size={12} className={health.color} />
                  <span className={`text-[12px] font-bold ${health.color}`}>{c.score}</span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 z-10 relative">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-white/40 flex items-center gap-1"><Video size={10} /> Queue</span>
                  <span className="text-[12px] font-bold text-white/90">{c.queue} Waiting</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-white/40 flex items-center gap-1"><Clock size={10} /> Last Upload</span>
                  <span className="text-[12px] font-bold text-white/90">{c.lastUpload}</span>
                </div>
              </div>

              {/* Hover Expansion Area */}
              <div className="absolute inset-0 bg-[#05080e]/95 backdrop-blur-xl border border-white/10 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col z-20 overflow-y-auto custom-scrollbar">
                <h3 className="text-[11px] font-bold text-white/70 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Shield size={12} /> Diagnostics</h3>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold"><span className="text-white/50">OAuth</span><span className="text-green-400">Valid</span></div>
                  <div className="flex justify-between items-center text-[10px] font-bold"><span className="text-white/50">Watch Folder</span><span className="text-green-400">Connected</span></div>
                  <div className="flex justify-between items-center text-[10px] font-bold"><span className="text-white/50">Scheduler</span><span className="text-blue-400">Sleeping</span></div>
                  <div className="flex justify-between items-center text-[10px] font-bold"><span className="text-white/50">AI Engine</span><span className="text-green-400">Healthy</span></div>
                  <div className="flex justify-between items-center text-[10px] font-bold"><span className="text-white/50">Pipeline</span><span className="text-green-400">Ready</span></div>
                  <div className="flex justify-between items-center text-[10px] font-bold"><span className="text-white/50">Upload Success</span><span className="text-amber-400">98%</span></div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
