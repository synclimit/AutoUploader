import { memo } from 'react'
import { MoreVertical, Pause, Play, Clock, Check, RefreshCw } from 'lucide-react'
import { useQueueStore } from '../../../store/upload/uploadStore'

const CompletedTableRow = memo(function CompletedTableRow({ video, onRetry }) {
  // Status Colors
  const statusColors = {
    'Mengunggah': 'text-[var(--accent-400)]',
    'Dijadwalkan': 'text-amber-400',
    'Selesai': 'text-green-400',
    'Gagal': 'text-red-400'
  }

  const getStatusAction = () => {
    switch(video.status) {
      case 'Mengunggah':
        return (
          <button className="w-8 h-8 rounded-[6px] border border-white/[0.08] hover:border-[var(--accent-500)]/50 hover:bg-[var(--accent-500)]/10 flex items-center justify-center transition-all neon-interactive text-white/70">
            <Pause size={14} />
          </button>
        )
      case 'Dijadwalkan':
        return (
          <button className="w-8 h-8 rounded-[6px] border border-white/[0.08] hover:border-amber-500/50 hover:bg-amber-500/10 flex items-center justify-center transition-all neon-interactive text-white/70">
            <Clock size={14} />
          </button>
        )
      case 'Selesai':
        return (
          <button className="w-8 h-8 rounded-[6px] border border-white/[0.08] hover:border-green-500/50 hover:bg-green-500/10 flex items-center justify-center transition-all neon-interactive text-green-400">
            <Check size={14} />
          </button>
        )
      case 'Gagal':
        return (
          <button 
            onClick={() => onRetry && onRetry(video.id)}
            className="h-8 px-3 rounded-[6px] border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 hover:shadow-[0_0_10px_rgba(248,113,113,0.2)] flex items-center gap-1.5 transition-all neon-interactive text-red-400 text-[11px] font-bold">
             Retry
          </button>
        )
      default:
        return null
    }
  }

  const getProgressDisplay = () => {
    switch(video.status) {
      case 'Mengunggah':
        return (
          <div className="flex items-center gap-3 w-full pr-4">
             <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
               <div className="h-full bg-[var(--accent-400)] relative" style={{ width: `${video.progress}%` }}>
                 <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-r from-transparent to-white/50 animate-[shimmer_1.5s_infinite]"></div>
               </div>
             </div>
             <span className="text-[12px] font-mono text-white/80 w-10 text-right">{video.progress}%</span>
          </div>
        )
      case 'Dijadwalkan':
      case 'Selesai':
        return (
          <span className="text-[13px] font-bold text-green-400">Done</span>
        )
      case 'Gagal':
        return (
          <div className="flex flex-col">
            <span className="text-[13px] text-white/70">{video.timeText}</span>
            <span className="text-[11px] font-bold text-red-400">{video.errorText}</span>
          </div>
        )
    }
  }

  return (
    <div className="shrink-0 h-[62px] w-full rounded-[12px] bg-[#0a0f1a]/60 hover:bg-[#0c1322] border border-white/[0.02] hover:border-[var(--accent-500)]/20 flex items-center px-4 transition-all cursor-default group relative overflow-hidden hover:shadow-[0_0_15px_rgba(34,211,238,0.05)]">
      
      {/* Global Neon Line */}
      <div className="absolute left-0 top-[15%] bottom-[15%] w-[4px] bg-[var(--accent-400)] rounded-r-full opacity-0 group-hover:opacity-100 scale-y-50 group-hover:scale-y-100 transition-all duration-200 shadow-[0_0_12px_rgba(34,211,238,0.8)]"></div>

      {/* Video Info (Col 1) */}
      <div className="flex items-center gap-4 w-[40%] shrink-0 pl-2">
        <div className="h-[44px] aspect-video rounded-[6px] overflow-hidden relative border border-white/[0.05] shrink-0 shadow-md bg-black/40">
          {video.thumbnail ? (
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${video.thumbnail})` }}></div>
          ) : video.hasVideo ? (
            <video src={`${video.videoUrl}#t=0.1`} className="w-full h-full object-cover" preload="metadata" muted playsInline />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/20">
              <span className="text-[8px] font-medium tracking-wider">NO MEDIA</span>
            </div>
          )}
        </div>
        <div className="flex flex-col min-w-0 pr-2 flex-1">
          <span className="text-[13px] font-bold text-white truncate leading-tight group-hover:text-cyan-100 transition-colors">{video.title || 'Untitled Video'}</span>
          <div className="flex items-center gap-1.5 mt-1">
            {video.channelAvatar ? (
              <div className="w-[14px] h-[14px] rounded-full overflow-hidden bg-white/10 shrink-0">
                <img src={video.channelAvatar} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className={`w-[14px] h-[14px] rounded-full flex items-center justify-center text-[6px] font-bold text-white shrink-0 ${video.channelBg || 'bg-cyan-600'}`}>
                {video.channelInitials}
              </div>
            )}
            <span className="text-[11px] font-medium text-[var(--accent-400)]/80 truncate">{video.channelName}</span>
          </div>
        </div>
      </div>

      {/* Upload Details (Col 2) */}
      <div className="w-[30%] shrink-0 pl-2 pr-4 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Via:</span>
          <span className="text-[12px] font-medium text-cyan-200/80">{(video.schedule_mode === 'api' || video.schedule_mode === 'manual' || !video.schedule_mode) ? 'Raynz PitStop' : 'YT Scheduler'}</span>
          <span className="text-[11px] text-white/20 px-1">•</span>
          <span className="text-[12px] font-medium text-white/70">{(video.pipeline_type || '').toLowerCase().includes('short') ? 'Shorts' : 'Long Video'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Date:</span>
          <span className="text-[12px] font-medium text-white/80">{video.completed_at ? new Date(video.completed_at + (video.completed_at.includes('Z') ? '' : 'Z')).toLocaleDateString() : (video.created_at ? new Date(video.created_at + (video.created_at.includes('Z') ? '' : 'Z')).toLocaleDateString() : 'Unknown')}</span>
          <span className="text-[11px] text-white/20 px-1">•</span>
          <span className="text-[12px] font-medium text-white/60">{video.completed_at ? new Date(video.completed_at + (video.completed_at.includes('Z') ? '' : 'Z')).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : (video.created_at ? new Date(video.created_at + (video.created_at.includes('Z') ? '' : 'Z')).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '')}</span>
        </div>
      </div>

      {/* Status (Col 3) */}
      <div className="w-[15%] shrink-0 pl-2">
        <span className={`text-[13px] font-bold ${statusColors[video.status] || 'text-white/50'}`}>{video.status}</span>
      </div>

      {/* Progress & Action (Col 4) */}
      <div className="w-[15%] shrink-0 pr-4 flex items-center justify-end">
        {video.status === 'Gagal' ? (
          <div className="flex flex-col items-end">
            <button 
              onClick={(e) => { e.stopPropagation(); onRetry && onRetry(video.id); }}
              className="px-3 py-1 rounded-[6px] border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 hover:shadow-[0_0_10px_rgba(248,113,113,0.2)] flex items-center gap-1.5 transition-all neon-interactive text-red-400 text-[11px] font-bold">
               <RefreshCw size={12} /> Retry
            </button>
          </div>
        ) : getProgressDisplay()}
      </div>

    </div>
  )
})

export default CompletedTableRow
