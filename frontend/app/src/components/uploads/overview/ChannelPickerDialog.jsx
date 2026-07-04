import { useState, useEffect } from 'react'
import { Search, CheckCircle2, FolderDown, X } from 'lucide-react'

export default function ChannelPickerDialog({ channels, selectedId, onSelect, onClose }) {
  const [searchQuery, setSearchQuery] = useState('')

  // Prevent background scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'unset' }
  }, [])

  const filteredChannels = channels.filter(c => 
    c.channel_name && c.channel_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Subtle Blurred Backdrop */}
      <div 
        className="absolute inset-0 bg-[#05080e]/40 backdrop-blur-sm transition-all" 
        onClick={onClose}
      ></div>
      
      {/* Floating Dialog Panel */}
      <div className="relative w-[750px] bg-[#0a101a]/95 backdrop-blur-3xl border border-white/[0.1] rounded-[24px] shadow-[0_32px_80px_rgba(0,0,0,0.8),0_0_40px_rgba(34,211,238,0.1)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Search Header */}
        <div className="p-6 border-b border-white/[0.05] relative flex items-center gap-4 bg-black/20 shrink-0">
           <div className="relative flex-1">
             <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40">
                <Search size={20} />
             </div>
             <input 
                type="text" 
                placeholder="Search destination channel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#05070a]/80 border border-white/[0.08] rounded-[16px] py-4 pl-14 pr-5 text-[15px] text-white placeholder-white/30 focus:outline-none focus:border-[var(--accent-500)]/50 focus:bg-[#05080e] focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all"
                autoFocus
             />
           </div>
           <button onClick={onClose} className="w-12 h-12 rounded-[16px] bg-white/[0.05] border border-white/[0.05] flex items-center justify-center text-white/50 hover:bg-white/[0.1] hover:text-white transition-all shrink-0">
             <X size={24} />
           </button>
        </div>

        {/* Scrollable Channel List */}
        <div className="h-[400px] overflow-y-auto custom-scrollbar p-4 flex flex-col gap-2">
          {filteredChannels.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
               <Search size={40} className="text-white/10 mb-4" />
               <p className="text-white/40 text-[15px] font-medium">No channels found matching "{searchQuery}"</p>
            </div>
          ) : (
            filteredChannels.map(channel => (
              <div 
                key={channel.id}
                onClick={() => onSelect(channel.id)}
                className={`p-4 rounded-[18px] flex items-center justify-between cursor-pointer transition-all duration-300 group ${
                  selectedId === channel.id 
                    ? 'bg-cyan-900/30 border border-[var(--accent-500)]/40 shadow-[inset_0_1px_4px_rgba(255,255,255,0.05),0_0_20px_rgba(34,211,238,0.15)]' 
                    : 'border border-transparent bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.08] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-center gap-5">
                  {/* Large Avatar */}
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-[18px] font-bold transition-all duration-300 shadow-inner ${
                    selectedId === channel.id
                      ? 'bg-[var(--accent-500)]/20 text-[var(--accent-400)] shadow-[0_0_15px_rgba(34,211,238,0.3)] border border-[var(--accent-500)]/50'
                      : 'bg-[#121a2f] text-white/60 border border-white/[0.05] group-hover:bg-[var(--accent-500)]/10 group-hover:text-[var(--accent-400)] group-hover:border-[var(--accent-500)]/30'
                  }`}>
                    {channel.channel_name ? channel.channel_name.charAt(0).toUpperCase() : '?'}
                  </div>
                  
                  {/* Details */}
                  <div className="flex flex-col">
                    <span className={`font-bold text-[16px] tracking-wide transition-colors ${
                      selectedId === channel.id ? 'text-white' : 'text-white/90 group-hover:text-white'
                    }`}>
                      {channel.channel_name}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <CheckCircle2 size={14} strokeWidth={3} className="text-green-400" />
                      <span className="text-green-400/80 text-[11px] font-bold uppercase tracking-wider">Connected</span>
                    </div>
                  </div>
                </div>

                {/* Right Side Info (Folder Path) */}
                <div className="flex flex-col items-end opacity-60 group-hover:opacity-100 transition-opacity">
                   <div className="flex items-center gap-1.5 mb-1">
                     <FolderDown size={14} className={selectedId === channel.id ? 'text-[var(--accent-400)]' : 'text-white/40'} />
                     <span className={`text-[11px] font-bold uppercase tracking-wider ${selectedId === channel.id ? 'text-[var(--accent-400)]/80' : 'text-white/40'}`}>Upload Folder</span>
                   </div>
                   <span className="text-[12px] font-mono text-white/60 max-w-[200px] truncate">
                     {channel.folder || 'Not Configured'}
                   </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
