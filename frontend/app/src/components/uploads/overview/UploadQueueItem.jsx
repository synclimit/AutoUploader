import { CheckCircle2, Video } from 'lucide-react'

export default function UploadQueueItem({ file, channelName }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3 bg-[#05080e]/60 backdrop-blur-xl border border-white/[0.06] rounded-[16px] hover:bg-[#0a0f1a]/80 hover:border-[var(--accent-500)]/20 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-200 group shrink-0">
      
      {/* Thumbnail Placeholder */}
      <div className="w-14 h-9 rounded-md bg-gradient-to-br from-[#121a2f] to-[#0b101a] border border-white/[0.05] flex items-center justify-center shrink-0 shadow-[inset_0_1px_4px_rgba(255,255,255,0.05)] group-hover:border-[var(--accent-500)]/30 transition-colors">
        <Video size={14} strokeWidth={2} className="text-white/20 group-hover:text-cyan-500/50" />
      </div>

      <div className="flex-1 min-w-0 flex items-center justify-between gap-6">
        {/* File Info */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-white font-bold text-[13px] truncate tracking-wide group-hover:text-cyan-50 transition-colors">{file.title || 'Untitled Video'}</span>
          <div className="flex items-center gap-2.5 mt-0.5 text-[11px] font-medium text-white/40">
            <span>{file.duration}</span>
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            <span className="truncate max-w-[150px]">{channelName}</span>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5 shrink-0 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(74,222,128,0.05)]">
          <CheckCircle2 size={12} className="text-green-400" strokeWidth={3} />
          <span className="text-green-400 text-[10px] font-bold uppercase tracking-wider">Imported</span>
        </div>
      </div>
    </div>
  )
}
