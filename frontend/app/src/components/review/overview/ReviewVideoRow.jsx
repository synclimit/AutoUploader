import { useState } from 'react'
import { Check, Image as ImageIcon, Clock } from 'lucide-react'

export default function ReviewVideoRow({ index, video, isSelected, isActive, onToggleSelect, onClickRow }) {
  const [duration, setDuration] = useState(video.duration === '00:00' ? null : video.duration);

  const handleLoadedMetadata = (e) => {
    const vid = e.target;
    if (vid.duration && !isNaN(vid.duration)) {
      const mins = Math.floor(vid.duration / 60);
      const secs = Math.floor(vid.duration % 60);
      setDuration(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }
  };

  const isCampaign = video.execution_source === 'CAMPAIGN' || video.automation_strategy === 'campaign';

  // Format schedule date cleanly: "22 Agu, 12:00" or "Besok, 12:00"
  const getScheduleLabel = () => {
    if (!video.scheduled_at && !video.schedule_time) return null;
    let dateStr = '';
    if (video.scheduled_at) {
      try {
        const d = new Date(video.scheduled_at);
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        if (d.toDateString() === today.toDateString()) {
          dateStr = 'Hari ini';
        } else if (d.toDateString() === tomorrow.toDateString()) {
          dateStr = 'Besok';
        } else {
          dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        }
      } catch (e) {
        dateStr = '';
      }
    }
    const timeStr = video.schedule_time || (video.scheduled_at ? new Date(video.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '12:00');
    return dateStr ? `${dateStr}, ${timeStr}` : timeStr;
  };

  const scheduleText = getScheduleLabel();

  return (
    <div 
      onClick={() => onClickRow(video.id)}
      className={`group relative flex items-center gap-3 p-2 rounded-[10px] border transition-all cursor-pointer ${
        isActive 
          ? 'bg-cyan-950/25 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
          : 'border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.04] hover:border-white/[0.08]'
      }`}
    >
      
      {/* Thumbnail */}
      <div className="relative w-[100px] h-[58px] rounded-[6px] overflow-hidden bg-black/50 shrink-0 border border-white/[0.06]">
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
        
        {/* Index Pill on Thumbnail (Top-Left) */}
        {index !== undefined && (
          <div className="absolute top-1 left-1 z-20 px-1.5 py-0.5 rounded-[4px] bg-black/85 backdrop-blur-md text-[10px] font-mono font-bold text-cyan-300 border border-cyan-500/20">
            #{index}
          </div>
        )}

        {/* Checkbox (Hover or Selected) */}
        <div 
          className={`absolute top-1 right-1 z-20 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          onClick={(e) => { e.stopPropagation(); onToggleSelect(video.id); }}
        >
          <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all ${
            isSelected 
              ? 'bg-cyan-500 border-cyan-500 text-black' 
              : 'border-white/40 text-transparent bg-black/60 hover:border-white'
          }`}>
            <Check size={10} strokeWidth={3} />
          </div>
        </div>

        {/* Duration */}
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 rounded-[3px] text-[9px] font-mono font-semibold text-white/90">
          {duration || '00:00'}
        </div>
      </div>

      {/* Video Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        {/* Title */}
        <div className={`font-semibold text-[13px] truncate leading-snug transition-colors ${isActive ? 'text-cyan-300' : 'text-white/90 group-hover:text-white'}`}>
          {video.title}
        </div>
        
        {/* Line 2: Channel & Pipeline & Mode */}
        <div className="flex items-center gap-2 text-[11px] text-white/50">
          <span className="truncate max-w-[100px] text-white/70 font-medium">{video.channelName}</span>
          <span className="text-white/20">•</span>
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${video.pipeline_type === 'shorts' ? 'text-amber-400' : 'text-blue-400'}`}>
            {video.pipeline_type === 'shorts' ? 'Shorts' : 'Long'}
          </span>
          <span className="text-white/20">•</span>
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${isCampaign ? 'text-purple-400' : 'text-cyan-400'}`}>
            {isCampaign ? 'Campaign' : 'Continuous'}
          </span>
        </div>

        {/* Line 3: Schedule Date & Status */}
        <div className="flex items-center gap-2 text-[11px]">
          {scheduleText && (
            <div className="flex items-center gap-1 text-[11px] text-white/60 font-mono">
              <Clock size={11} className="text-white/40" />
              <span>{scheduleText}</span>
              <span className="text-[9px] text-white/30 font-sans">({video.schedule_mode === 'youtube' ? 'YT' : 'App'})</span>
            </div>
          )}
          {scheduleText && <span className="text-white/20">•</span>}
          <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400/90">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Needs Review</span>
          </div>
        </div>
      </div>

    </div>
  )
}
