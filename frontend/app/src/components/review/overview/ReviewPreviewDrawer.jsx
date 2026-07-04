import { X, Play, Edit3, Save, EyeOff, Hash, AlignLeft, Info } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function ReviewPreviewDrawer({ video, onClose }) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})

  // Update local form data when video changes
  useEffect(() => {
    if (video) {
      setFormData({
        title: video.title || '',
        description: video.description || '',
        tags: video.tags || '',
        category: video.category || 'Entertainment',
        visibility: video.visibility || 'Public'
      })
      setIsEditing(false) // Reset edit mode on new selection
    }
  }, [video])

  if (!video) return null

  return (
    <div className="w-full h-full flex flex-col bg-[#05080e]/80 backdrop-blur-3xl border-l border-white/[0.05] shadow-[-20px_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-right-8 duration-300">
      
      {/* Header */}
      <div className="p-5 border-b border-white/[0.05] flex items-center justify-between shrink-0 bg-black/20">
         <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-full bg-[var(--accent-500)]/20 text-[var(--accent-400)] flex items-center justify-center border border-[var(--accent-500)]/30 shadow-[0_0_15px_var(--color-primary-cyan)]">
             <Edit3 size={14} />
           </div>
           <span className="font-bold text-[15px] tracking-wide text-white">Quick Edit</span>
         </div>
         <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[10px] text-white/40 hover:text-white hover:bg-white/[0.1] transition-all">
           <X size={18} />
         </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-6">
        
        {/* Large Thumbnail Preview */}
        <div className="relative w-full aspect-video rounded-[16px] bg-black/60 overflow-hidden border border-white/[0.1] group shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
           {/* Placeholder for video thumbnail */}
           <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-cyan-900/20 to-blue-900/20">
              <Play size={40} className="text-white/20 group-hover:text-white/80 group-hover:scale-110 transition-all duration-300" />
           </div>
           <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded-[6px] text-[11px] font-bold text-white backdrop-blur-md border border-white/[0.1]">
             {video.duration}
           </div>
        </div>

        {/* Video Tech Info */}
        <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border border-white/[0.05] rounded-[12px]">
           <div className="flex flex-col">
             <span className="text-[10px] uppercase font-bold tracking-wider text-white/40">Resolution</span>
             <span className="text-[13px] font-mono font-medium text-white/80">{video.resolution}</span>
           </div>
           <div className="flex flex-col items-end">
             <span className="text-[10px] uppercase font-bold tracking-wider text-white/40">File Size</span>
             <span className="text-[13px] font-mono font-medium text-white/80">{video.size}</span>
           </div>
        </div>

        {/* Metadata Editor Form */}
        <div className="flex flex-col gap-4">
           
           <div className="flex flex-col gap-2">
             <label className="text-[11px] uppercase font-bold tracking-wider text-white/50 flex items-center gap-1.5">
               <Info size={12} /> Title
             </label>
             <input 
               type="text" 
               value={formData.title}
               onChange={(e) => setFormData({...formData, title: e.target.value})}
               onFocus={() => setIsEditing(true)}
               className="w-full bg-[#05070a] border border-white/[0.1] rounded-[12px] px-4 py-3 text-[14px] font-medium text-white focus:border-[var(--accent-500)]/50 focus:outline-none focus:shadow-[0_0_15px_rgba(34,211,238,0.1)] transition-all"
               placeholder="Video Title"
             />
           </div>

           <div className="flex flex-col gap-2">
             <label className="text-[11px] uppercase font-bold tracking-wider text-white/50 flex items-center gap-1.5">
               <AlignLeft size={12} /> Description
             </label>
             <textarea 
               value={formData.description}
               onChange={(e) => setFormData({...formData, description: e.target.value})}
               onFocus={() => setIsEditing(true)}
               rows={4}
               className="w-full bg-[#05070a] border border-white/[0.1] rounded-[12px] px-4 py-3 text-[13px] text-white/80 focus:border-[var(--accent-500)]/50 focus:outline-none focus:shadow-[0_0_15px_rgba(34,211,238,0.1)] transition-all resize-none custom-scrollbar"
               placeholder="Video Description..."
             />
           </div>

           <div className="flex flex-col gap-2">
             <label className="text-[11px] uppercase font-bold tracking-wider text-white/50 flex items-center gap-1.5">
               <Hash size={12} /> Tags
             </label>
             <input 
               type="text" 
               value={formData.tags}
               onChange={(e) => setFormData({...formData, tags: e.target.value})}
               onFocus={() => setIsEditing(true)}
               className="w-full bg-[#05070a] border border-white/[0.1] rounded-[12px] px-4 py-3 text-[13px] text-white/80 focus:border-[var(--accent-500)]/50 focus:outline-none focus:shadow-[0_0_15px_rgba(34,211,238,0.1)] transition-all"
               placeholder="tag1, tag2, tag3"
             />
           </div>
           
           <div className="grid grid-cols-2 gap-3">
             <div className="flex flex-col gap-2">
               <label className="text-[11px] uppercase font-bold tracking-wider text-white/50">Category</label>
               <select 
                 value={formData.category}
                 onChange={(e) => { setFormData({...formData, category: e.target.value}); setIsEditing(true); }}
                 className="w-full bg-[#05070a] border border-white/[0.1] rounded-[12px] px-3 py-2.5 text-[13px] text-white/80 focus:border-[var(--accent-500)]/50 focus:outline-none"
               >
                 <option>Entertainment</option>
                 <option>Music</option>
                 <option>Gaming</option>
                 <option>Education</option>
               </select>
             </div>
             <div className="flex flex-col gap-2">
               <label className="text-[11px] uppercase font-bold tracking-wider text-white/50 flex items-center gap-1.5">
                 <EyeOff size={12} /> Visibility
               </label>
               <select 
                 value={formData.visibility}
                 onChange={(e) => { setFormData({...formData, visibility: e.target.value}); setIsEditing(true); }}
                 className="w-full bg-[#05070a] border border-white/[0.1] rounded-[12px] px-3 py-2.5 text-[13px] text-white/80 focus:border-[var(--accent-500)]/50 focus:outline-none"
               >
                 <option>Public</option>
                 <option>Unlisted</option>
                 <option>Private</option>
               </select>
             </div>
           </div>

        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-5 border-t border-white/[0.05] bg-black/20 shrink-0 flex items-center justify-end gap-3">
         {isEditing ? (
           <>
             <button 
               onClick={() => setIsEditing(false)}
               className="px-4 py-2 rounded-[10px] text-[12px] font-bold text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors"
             >
               Cancel
             </button>
             <button 
               onClick={() => setIsEditing(false)}
               className="flex items-center gap-2 px-5 py-2 rounded-[10px] bg-[var(--accent-500)] text-black font-bold text-[12px] shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:scale-105 transition-all"
             >
               <Save size={14} /> Save Changes
             </button>
           </>
         ) : (
           <div className="text-[11px] font-medium text-white/30 flex items-center gap-2 w-full justify-center">
              All changes are synced locally
           </div>
         )}
      </div>

    </div>
  )
}
