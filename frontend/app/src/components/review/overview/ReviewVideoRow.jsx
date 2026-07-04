import { useState } from 'react'
import { Play, Check, AlertCircle, Image as ImageIcon, Clock } from 'lucide-react'

export default function ReviewVideoRow({ video, isSelected, isActive, onToggleSelect, onClickRow }) {
  const [duration, setDuration] = useState(video.duration === '00:00' ? null : video.duration);

  const handleLoadedMetadata = (e) => {
    const vid = e.target;
    if (vid.duration && !isNaN(vid.duration)) {
      const mins = Math.floor(vid.duration / 60);
      const secs = Math.floor(vid.duration % 60);
      setDuration(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }
  };

  // Status Colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'Needs Review': return 'text-amber-400'
      case 'Ready': return 'text-blue-400'
      case 'Error': return 'text-red-400'
      case 'Approved': return 'text-green-400'
      default: return 'text-white/50'
    }
  }

  return (
    <div 
      onClick={() => onClickRow(video.id)}
      className={`group relative flex items-center gap-3 p-2.5 rounded-[12px] border neon-interactive ${
        isActive 
          ? 'active'
          : 'border-transparent bg-white/[0.01]'
      }`}
    >
      
      {/* Thumbnail */}
      <div className="relative w-[110px] h-[62px] rounded-[8px] overflow-hidden bg-black/40 shrink-0 border border-white/[0.05] group-hover:border-white/[0.15] transition-colors group-hover:brightness-105">
        {video.thumbnail_path ? (
          <>
            <img src={`/api/v1/media/thumbnail/${video.id}`} alt="Thumbnail" className="w-full h-full object-cover" />
            <video src={`/api/v1/media/video/${video.id}`} className="hidden" preload="metadata" onLoadedMetadata={handleLoadedMetadata} />
          </>
        ) : video.video_path ? (
          <video src={`/api/v1/media/video/${video.id}#t=0.1`} className="w-full h-full object-cover" preload="metadata" muted playsInline onLoadedMetadata={handleLoadedMetadata} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/10">
             <ImageIcon size={16} />
          </div>
        )}
        
        {/* Checkbox Overlay */}
        <div 
          className="absolute top-1.5 left-1.5 z-20"
          onClick={(e) => { e.stopPropagation(); onToggleSelect(video.id); }}
        >
          <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all ${
            isSelected 
              ? 'bg-[var(--accent-500)] border-[var(--accent-500)] text-[#05080e]' 
              : 'border-white/40 text-transparent bg-black/40 group-hover:border-white/60'
          }`}>
            <Check size={10} strokeWidth={3} />
          </div>
        </div>

        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 rounded-[4px] text-[9px] font-bold text-white/90 backdrop-blur-md">
          {duration || '00:00'}
        </div>
        
        {/* Hover Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>

      {/* Video Info (Main flex area) */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 py-0.5">
        <div className={`font-bold text-[13px] truncate tracking-wide transition-colors ${isActive ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
          {video.title}
        </div>
        
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40 group-hover:text-white/50 transition-colors">
          {video.channelLogo ? (
            <div className="w-3.5 h-3.5 rounded-full bg-white/10 overflow-hidden">
               <img src={video.channelLogo} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-3.5 h-3.5 rounded-full bg-[var(--accent-500)]/20 text-[var(--accent-400)] flex items-center justify-center font-bold text-[6px]">CH</div>
          )}
          <span className="truncate max-w-[100px]">{video.channelName}</span>
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          <div className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] transition-all ${getStatusColor(video.status)}`}>
             <AlertCircle size={10} className={video.status === 'Needs Review' ? 'animate-pulse' : ''} />
             {video.status}
          </div>
          {video.schedule_time && (
            <div className="text-[9px] font-bold text-[var(--accent-400)]/80 flex items-center gap-1 border border-[var(--accent-500)]/20 rounded-[4px] px-1.5 py-0.5 bg-[var(--accent-500)]/[0.02]">
              <Clock size={9} /> {video.schedule_time} ({video.schedule_mode === 'youtube' ? 'YT' : 'App'})
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
