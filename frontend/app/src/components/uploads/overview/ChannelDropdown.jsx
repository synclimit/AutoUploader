import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, CheckCircle2 } from 'lucide-react'

export default function ChannelDropdown({ channels, selectedId, onSelect }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef(null)

  const selectedChannel = channels.find(c => c.id === selectedId)

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelect = (id) => {
    onSelect(id)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className="relative w-[400px]" ref={dropdownRef}>
      {/* Selector Button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#05080e]/60 backdrop-blur-2xl border border-white/[0.08] rounded-[16px] p-4 flex items-center justify-between cursor-pointer hover:border-[var(--accent-500)]/30 hover:bg-[#0a0f1a]/80 shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-200 group"
      >
        {selectedChannel ? (
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[var(--accent-500)]/20 border border-[var(--accent-500)]/40 flex items-center justify-center text-[var(--accent-400)] font-bold text-[16px] shadow-[inset_0_1px_4px_rgba(255,255,255,0.1),0_0_15px_rgba(34,211,238,0.2)]">
              {selectedChannel.name.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-[15px] tracking-wide">{selectedChannel.name}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 size={12} strokeWidth={3} className="text-green-400" />
                <span className="text-green-400/80 text-[10px] font-bold uppercase tracking-wider">Connected</span>
              </div>
            </div>
          </div>
        ) : (
          <span className="text-white/40 font-medium text-[15px] px-2">Choose a destination channel...</span>
        )}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.03] text-white/50 group-hover:bg-[var(--accent-500)]/10 group-hover:text-[var(--accent-400)] transition-all ${isOpen ? 'rotate-180 bg-[var(--accent-500)]/20 text-[var(--accent-400)]' : ''}`}>
          <ChevronDown size={18} strokeWidth={2.5} />
        </div>
      </div>

      {/* Dropdown Modal */}
      {isOpen && (
        <div className="absolute top-[calc(100%+12px)] left-0 w-[450px] bg-[#0a101a]/95 backdrop-blur-3xl border border-white/[0.08] rounded-[20px] shadow-[0_16px_60px_rgba(0,0,0,0.6),0_0_20px_rgba(34,211,238,0.05)] z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Search Box */}
          <div className="p-4 border-b border-white/[0.05] bg-black/20 shrink-0 relative">
            <div className="absolute left-8 top-1/2 -translate-y-1/2 text-white/30">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#05070a]/60 border border-white/[0.05] rounded-[12px] py-3 pl-12 pr-4 text-[14px] text-white placeholder-white/30 focus:outline-none focus:border-[var(--accent-500)]/40 focus:bg-[#05080e]/80 transition-all"
              autoFocus
            />
          </div>

          {/* List */}
          <div className="max-h-[320px] overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1 min-h-0">
            {filteredChannels.length === 0 ? (
              <div className="py-8 text-center text-white/40 text-[13px]">No channels found matching "{searchQuery}"</div>
            ) : (
              filteredChannels.map(channel => (
                <div 
                  key={channel.id}
                  onClick={() => handleSelect(channel.id)}
                  className={`p-3 rounded-[12px] flex items-center justify-between cursor-pointer transition-all duration-200 group ${
                    selectedId === channel.id 
                      ? 'bg-cyan-900/30 border border-[var(--accent-500)]/30 shadow-[inset_0_1px_4px_rgba(255,255,255,0.05)]' 
                      : 'border border-transparent hover:bg-white/[0.04] hover:border-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold transition-colors ${
                      selectedId === channel.id
                        ? 'bg-[var(--accent-500)]/20 text-[var(--accent-400)] shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                        : 'bg-white/[0.03] border border-white/[0.05] text-white/50 group-hover:bg-[var(--accent-500)]/10 group-hover:text-cyan-200 group-hover:border-[var(--accent-500)]/20'
                    }`}>
                      {channel.name.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className={`font-bold text-[14px] tracking-wide transition-colors ${
                        selectedId === channel.id ? 'text-white' : 'text-white/70 group-hover:text-white'
                      }`}>
                        {channel.name}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <CheckCircle2 size={10} strokeWidth={3} className="text-green-400" />
                        <span className="text-green-400/80 text-[10px] font-bold uppercase tracking-wider">Connected</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
