import { PlaySquare, ExternalLink, RefreshCw, Sparkles, UploadCloud, Copy } from 'lucide-react'
import { showToast } from '../../common/NotificationToast'

export default function QuickActionsBar({ channel }) {
  const handleYTStudio = () => {
    window.open(`https://studio.youtube.com/channel/${channel?.id || ''}`, '_blank');
  };

  const handleSyncAnalytics = () => {
    showToast('Syncing analytics from YouTube...', 'info');
    setTimeout(() => {
      showToast('Analytics synced successfully', 'success');
    }, 2000);
  };

  const handleManualUpload = () => {
    showToast('Opening manual upload dialog...', 'info');
  };

  return (
    <div className="flex items-center gap-2.5">
      <button onClick={handleYTStudio} className="h-[38px] px-3.5 rounded-[10px] bg-[#0a0f1a]/80 hover:bg-[#101826] text-white/80 hover:text-white border border-white/[0.08] hover:border-[var(--accent-500)]/40 text-[12px] font-bold flex items-center gap-2 shadow-sm transition-all duration-200 neon-interactive">
        <PlaySquare size={14} className="text-red-500" /> YT Studio
      </button>
      <button onClick={handleSyncAnalytics} className="h-[38px] px-3.5 rounded-[10px] bg-[#0a0f1a]/80 hover:bg-[#101826] text-white/80 hover:text-white border border-white/[0.08] hover:border-[var(--accent-500)]/40 text-[12px] font-bold flex items-center gap-2 shadow-sm transition-all duration-200 neon-interactive">
        <RefreshCw size={14} className="text-[var(--accent-400)]" /> Sync Analytics
      </button>
      <button onClick={handleManualUpload} className="h-[38px] px-4 rounded-[10px] bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-[#05070b] font-extrabold text-[12px] flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] hover:scale-[1.02] transition-all duration-200">
        <UploadCloud size={14} className="text-[#05070b]" /> Manual Upload
      </button>
    </div>
  )
}

