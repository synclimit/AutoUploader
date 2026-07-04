import { Search, ChevronDown } from 'lucide-react'
import { useAccountsStore } from '../../../store/accounts/accountsStore'
import { useState } from 'react'

export default function CompletedFilterBar({ search, setSearch, channelFilter, setChannelFilter, statusFilter, setStatusFilter }) {
  const accounts = useAccountsStore((s) => s.accounts || [])
  const [showChannelMenu, setShowChannelMenu] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  return (
    <div className="flex-1 flex items-center gap-3 text-[13px] h-full" onClick={() => { setShowChannelMenu(false); setShowStatusMenu(false); }}>
      
      {/* Channel Filter */}
      <div className="relative h-[48px]">
        <button 
          onClick={(e) => { e.stopPropagation(); setShowChannelMenu(!showChannelMenu); setShowStatusMenu(false); }}
          className="flex items-center justify-between w-[160px] h-full px-3 rounded-[8px] border border-white/[0.08] bg-[#05080e]/60 text-white/80 hover:bg-white/[0.05] transition-colors neon-interactive"
        >
          <span className="truncate pr-2">{channelFilter === 'ALL' ? 'All Channels' : accounts.find(a => a.id === channelFilter)?.channel_name || 'Channel'}</span>
          <ChevronDown size={14} className="opacity-50 shrink-0" />
        </button>
        {showChannelMenu && (
          <div className="absolute top-[100%] left-0 mt-1 w-[200px] bg-[#0b1d25] border border-[var(--accent-500)]/20 shadow-2xl rounded-[8px] overflow-hidden z-50">
            <div onClick={() => setChannelFilter('ALL')} className={`px-3 py-2 text-[12px] cursor-pointer hover:bg-[var(--accent-500)]/10 ${channelFilter === 'ALL' ? 'text-[var(--accent-400)] font-bold' : 'text-white/70'}`}>All Channels</div>
            {accounts.map(a => (
              <div key={a.id} onClick={() => setChannelFilter(a.id)} className={`px-3 py-2 text-[12px] cursor-pointer hover:bg-[var(--accent-500)]/10 truncate ${channelFilter === a.id ? 'text-[var(--accent-400)] font-bold' : 'text-white/70'}`}>
                {a.channel_name}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Status Filter */}
      <div className="relative h-[48px]">
        <button 
          onClick={(e) => { e.stopPropagation(); setShowStatusMenu(!showStatusMenu); setShowChannelMenu(false); }}
          className="flex items-center justify-between w-[140px] h-full px-3 rounded-[8px] border border-white/[0.08] bg-[#05080e]/60 text-white/80 hover:bg-white/[0.05] transition-colors neon-interactive"
        >
          {statusFilter === 'ALL' ? 'All Status' : statusFilter}
          <ChevronDown size={14} className="opacity-50 shrink-0" />
        </button>
        {showStatusMenu && (
          <div className="absolute top-[100%] left-0 mt-1 w-[140px] bg-[#0b1d25] border border-[var(--accent-500)]/20 shadow-2xl rounded-[8px] overflow-hidden z-50">
            {['ALL', 'COMPLETED', 'FAILED', 'CANCELLED'].map(s => (
              <div key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 text-[12px] cursor-pointer hover:bg-[var(--accent-500)]/10 ${statusFilter === s ? 'text-[var(--accent-400)] font-bold' : 'text-white/70'}`}>
                {s === 'ALL' ? 'All Status' : s}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search (Flex 1) */}
      <div className="relative flex-1 max-w-[420px] h-[48px]">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input 
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search videos..."
          className="w-full h-full pl-10 pr-3 rounded-[8px] border border-white/[0.08] bg-[#05080e]/60 text-[13px] text-white outline-none focus:border-[var(--accent-500)]/50 focus:shadow-[0_0_10px_rgba(34,211,238,0.1)] transition-all"
        />
      </div>

    </div>
  )
}
