import { Search, Plus, CheckCircle2, AlertCircle, XCircle, CloudUpload } from 'lucide-react'

export default function ChannelListPanel({ channels, selectedChannelId, onSelect, onAddChannel }) {
  
  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'Connected': return <CheckCircle2 size={12} className="text-green-400" />
      case 'Disconnected': return <XCircle size={12} className="text-red-400" />
      case 'Warning': return <AlertCircle size={12} className="text-amber-400" />
      case 'Mengunggah': return <CloudUpload size={12} className="text-[var(--accent-400)] animate-pulse" />
      case 'Disabled': return <div className="w-3 h-3 rounded-full bg-white/20 border border-white/30" />
      default: return null
    }
  }

  return (
    <div className="w-[28%] min-w-[320px] max-w-[400px] h-full flex flex-col bg-[#080d17]/80 backdrop-blur-2xl border-r border-white/[0.05] relative z-20 shrink-0">
      
      {/* Search Header */}
      <div className="h-[72px] shrink-0 border-b border-white/[0.05] flex items-center px-6">
        <div className="relative flex-1 h-[40px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input 
            type="text"
            placeholder="Search channels..."
            className="w-full h-full pl-10 pr-3 rounded-[8px] border border-white/[0.08] bg-white/[0.02] text-[13px] text-white outline-none focus:border-[var(--accent-500)]/50 focus:shadow-[0_0_10px_rgba(34,211,238,0.1)] transition-all"
          />
        </div>
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col p-5 gap-3">
        {channels.map(channel => {
          const isSelected = selectedChannelId === channel.id
          return (
            <div 
              key={channel.id}
              onClick={() => onSelect(channel.id)}
              className={`p-3.5 rounded-[16px] flex items-center gap-3.5 cursor-pointer transition-all duration-300 relative group overflow-hidden neon-interactive shrink-0
                ${isSelected 
                  ? 'bg-[var(--accent-500)]/10 border border-[var(--accent-500)]/40 shadow-[0_0_30px_rgba(34,211,238,0.15)]' 
                  : 'bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.03] hover:border-white/[0.08] hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
                }`}
            >
              {/* Active Indicator */}
              <div className={`absolute left-0 top-[15%] bottom-[15%] w-[4px] bg-[var(--accent-400)] rounded-r-full transition-all duration-300 shadow-[0_0_12px_rgba(34,211,238,0.9)]
                ${isSelected ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-50'}`}></div>

              {/* Avatar */}
              <div className={`w-[44px] h-[44px] rounded-full overflow-hidden border-2 shrink-0 transition-colors ${isSelected ? 'border-[var(--accent-400)]/50 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'border-white/10 group-hover:border-white/20'}`}>
                {channel.avatar_url ? (
                  <img src={channel.avatar_url} alt={channel.name} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-[15px] font-bold text-white shadow-inner ${channel.color}`}>
                    {channel.initials}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex flex-col min-w-0 flex-1 justify-center">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[14px] font-bold truncate leading-tight transition-colors duration-200 ${isSelected ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
                    {channel.name}
                  </span>
                  <StatusIcon status={channel.status} />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[12px] font-medium truncate transition-colors ${isSelected ? 'text-cyan-200/70' : 'text-white/40'}`}>
                    @{channel.name.toLowerCase().replace(/\s+/g, '')}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/20"></span>
                  <span className={`text-[11px] font-bold transition-colors ${isSelected ? 'text-white/70' : 'text-white/30'}`}>
                    {channel.subscribers || '0'} subs
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add New Channel Button at Bottom */}
      <div className="p-6 shrink-0 border-t border-white/[0.05]">
        <button 
          onClick={onAddChannel}
          className="w-full h-[48px] rounded-[12px] bg-[var(--accent-500)]/10 border border-[var(--accent-500)]/30 text-[var(--accent-400)] font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-[var(--accent-500)]/20 hover:shadow-[0_0_24px_rgba(34,211,238,0.2)] transition-all cursor-pointer neon-interactive group"
        >
          <Plus size={18} className="group-hover:scale-110 transition-transform" />
          Add New Channel
        </button>
      </div>

    </div>
  )
}
