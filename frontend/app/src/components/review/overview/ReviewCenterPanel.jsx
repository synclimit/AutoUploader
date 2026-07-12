import { useState, useRef } from 'react'
import { Play, Volume2, Settings, Maximize, Sparkles, Clock, Plus, Check, Loader2 } from 'lucide-react'
import { showToast } from '../../common/NotificationToast'
import apiClient from '../../../api/client'
import { useQueueStore } from '../../../store/upload/uploadStore'

export default function ReviewCenterPanel({ video }) {
  if (!video) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center border border-white/[0.04] rounded-[16px] bg-[#05080e]/40 backdrop-blur-sm">
        <div className="w-20 h-20 rounded-full bg-white/[0.02] flex items-center justify-center border border-[var(--accent-500)]/20 mb-4">
          <Play size={32} className="text-white/10 ml-2" />
        </div>
        <div className="text-[15px] font-bold text-white/40">No Video Selected</div>
        <div className="text-[12px] text-white/20 mt-1">Select a video from the list to preview</div>
      </div>
    )
  }

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Use relative URL so it works in both Vite proxy (dev) and FastAPI static serving (prod)
  const BACKEND_URL = '';
  // Add a cache-buster query param so if we upload a new one, the browser re-fetches
  const [thumbBuster, setThumbBuster] = useState(Date.now());
  const videoUrl = video.id ? `${BACKEND_URL}/api/v1/media/video/${video.id}` : null;
  const thumbnailUrl = video.id ? `${BACKEND_URL}/api/v1/media/thumbnail/${video.id}?t=${thumbBuster}` : null;

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('Maximum thumbnail size is 10MB', 'error');
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      const res = await apiClient.post(`/media/upload-thumbnail/${video.id}`, formData);
      if (res) {
        showToast('Thumbnail updated successfully', 'success');
        setThumbBuster(Date.now()); // Force image refresh
        
        // Update task list and active task to reflect the new thumbnail_path
        const store = useQueueStore.getState();
        if (store.fetchTasks) store.fetchTasks();
        if (store.fetchTask) store.fetchTask(video.id);
      }
    } catch (err) {
      showToast(err.message || 'Failed to upload thumbnail', 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col gap-3 min-w-0 overflow-hidden px-2 pb-2">
      
      {/* Video Player Area */}
      <div className="flex-1 w-full min-h-0 flex items-center justify-center bg-black/40 rounded-[16px] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative group overflow-hidden">
        {/* Actual 16:9 Player Frame */}
        <div className="w-full h-full flex items-center justify-center relative bg-black">
          {videoUrl ? (
            <video src={videoUrl} controls className="w-full h-full object-contain" />
          ) : (
            <div className="absolute inset-0 bg-neutral-900 bg-contain bg-no-repeat bg-center opacity-80 flex items-center justify-center text-white/30 text-sm">No Video Path Found</div>
          )}
          
          {/* Top Channel Badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-[#05080e]/80 backdrop-blur-md rounded-[10px] border border-white/[0.1] shadow-lg pointer-events-none">
             <div className="w-5 h-5 rounded-full bg-white/10 overflow-hidden">
               {video.channelLogo && <img src={video.channelLogo} alt="" className="w-full h-full object-cover" />}
             </div>
             <div className="flex flex-col">
               <span className="text-[10px] font-bold text-white leading-tight">{video.channelName}</span>
               <span className="text-[8px] font-bold text-green-400 uppercase tracking-wider flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> Connected
               </span>
             </div>
          </div>

          {/* Top Right Resolution Badge */}
          <div className="absolute top-4 right-4 px-2 py-1 bg-black/80 backdrop-blur-md rounded-[6px] border border-white/[0.1] text-[10px] font-bold text-white pointer-events-none">
            {video.resolution || '1080p'}
          </div>
        </div>
      </div>

      {/* Expanded Thumbnails Strip */}
      <div className="flex flex-col gap-1.5 shrink-0 pt-1">
        <h4 className="text-[12px] font-bold text-white/90">Thumbnails</h4>
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          {/* Active Thumbnail */}
          <div className="relative h-[80px] aspect-video rounded-[8px] overflow-hidden border-2 border-[var(--accent-500)] cursor-pointer shadow-[0_0_15px_var(--color-primary-cyan)] shrink-0 bg-black">
            {video.thumbnail_path ? (
              <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
            ) : videoUrl ? (
              <video src={`${videoUrl}#t=0.1`} className="w-full h-full object-cover" preload="metadata" muted playsInline />
            ) : (
              <div className="absolute inset-0 bg-cyan-900/40"></div>
            )}
            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--accent-500)] flex items-center justify-center shadow-md">
              <Check size={10} className="text-black stroke-[3]" />
            </div>
          </div>
          {/* Upload Custom */}
          <div 
            onClick={!isUploading ? handleUploadClick : undefined}
            className={`relative h-[80px] aspect-video rounded-[8px] overflow-hidden border border-[var(--accent-500)]/20 border-dashed cursor-pointer hover:border-[var(--accent-500)]/50 hover:bg-[var(--accent-500)]/[0.02] transition-all flex flex-col items-center justify-center shrink-0 neon-interactive group ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {isUploading ? (
              <Loader2 size={16} className="text-[var(--accent-400)] animate-spin mb-0.5" />
            ) : (
              <Plus size={16} className="text-white/40 group-hover:text-[var(--accent-400)] mb-0.5 transition-colors" />
            )}
            <span className="text-[10px] font-bold text-white/40 group-hover:text-[var(--accent-400)] transition-colors">
              {isUploading ? 'Uploading...' : 'Upload Custom'}
            </span>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".jpg,.jpeg,.png,.webp" 
            className="hidden" 
          />
        </div>
      </div>

    </div>
  )
}
