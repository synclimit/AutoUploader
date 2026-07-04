import { useState } from 'react'
import CompletedFilterBar from './CompletedFilterBar'
import CompletedStatCards from './CompletedStatCards'
import CompletedTable from './CompletedTable'
import { Filter, RefreshCw } from 'lucide-react'
import { useQueueStore } from '../../../store/upload/uploadStore'

export default function CompletedWorkspace() {
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  
  const fetchTasks = useQueueStore((s) => s.fetchTasks)

  return (
    <div className="flex-1 h-full overflow-hidden px-6 pt-4 pb-3 flex flex-col relative bg-[#05080e]">
      
      {/* Top Stats Area */}
      <div className="shrink-0 w-full mb-3">
        <CompletedStatCards setStatusFilter={setStatusFilter} />
      </div>

      {/* Filter Bar */}
      <div className="shrink-0 flex items-center w-full h-[48px] gap-4 mb-3">
        <CompletedFilterBar 
          search={search} setSearch={setSearch}
          channelFilter={channelFilter} setChannelFilter={setChannelFilter}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        />
        <button className="h-full px-4 rounded-[8px] border border-[var(--accent-500)]/30 text-[var(--accent-400)] bg-[var(--accent-500)]/5 hover:bg-[var(--accent-500)]/10 transition-colors flex items-center gap-2 font-bold text-[13px] neon-interactive shrink-0 ml-auto">
          <Filter size={14} /> Filter
        </button>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 min-h-0 flex flex-col w-full">
        <CompletedTable search={search} channelFilter={channelFilter} statusFilter={statusFilter} />
      </div>

      {/* Pagination Footer (Margin-top 12px) */}
      <div className="h-[48px] shrink-0 border-t border-white/[0.05] flex items-center justify-end px-2 text-[12px] text-white/50 mt-3 mb-1">
        <div className="flex items-center gap-4">
          <button onClick={() => fetchTasks()} className="w-8 h-8 rounded-[6px] border border-white/[0.08] hover:bg-white/[0.05] hover:text-[var(--accent-400)] flex items-center justify-center transition-colors neon-interactive group">
            <RefreshCw size={14} className="group-hover:animate-spin" />
          </button>
        </div>
      </div>

    </div>
  )
}
