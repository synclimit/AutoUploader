import { useEffect, useState } from 'react'
import CompletedTableRow from './CompletedTableRow'
import { useAccountsStore } from "../../../store/accounts/accountsStore";
import { useQueueStore } from "../../../store/upload/uploadStore";

export default function CompletedTable({ search, channelFilter, statusFilter }) {
  const tasks = useQueueStore((s) => s.tasks)
  const fetchTasks = useQueueStore((s) => s.fetchTasks)
  const loading = useQueueStore((s) => s.loading)
  const retryTask = useQueueStore((s) => s.retryTask)
  const { accounts, fetchAccounts } = useAccountsStore()

  useEffect(() => {
    fetchAccounts()
    useQueueStore.getState().setFilters({ ...useQueueStore.getState().filters, status: ['COMPLETED', 'FAILED', 'CANCELLED'] })
    fetchTasks()
    const interval = setInterval(() => {
      fetchTasks()
    }, 10000)
    return () => clearInterval(interval)
    // eslint-disable-next-line
  }, [])

  let completedVideos = tasks

  if (statusFilter && statusFilter !== 'ALL') {
    completedVideos = completedVideos.filter(v => v.status === (statusFilter === 'COMPLETED' ? 'COMPLETED' : statusFilter === 'FAILED' ? 'FAILED' : 'CANCELLED'))
  }

  if (channelFilter && channelFilter !== 'ALL') {
    completedVideos = completedVideos.filter(v => v.account_id === channelFilter)
  }

  if (search && search.trim() !== '') {
    const q = search.toLowerCase()
    completedVideos = completedVideos.filter(v => (v.title || '').toLowerCase().includes(q))
  }

  const mappedVideos = completedVideos.map(v => {
    const account = accounts.find(a => a.id === v.account_id)
    return {
      ...v,
      channelName: account?.channel_name || 'Unknown Channel',
      channelAvatar: account?.avatar_url || null,
      channelInitials: account?.channel_name?.substring(0,2)?.toUpperCase() || 'UN',
      channelBg: v.status === 'COMPLETED' ? 'bg-green-700' : v.status === 'FAILED' ? 'bg-red-700' : 'bg-gray-700',
      thumbnail: v.thumbnail_path && v.id ? `/api/v1/media/thumbnail/${v.id}` : null,
      videoUrl: v.id ? `/api/v1/media/video/${v.id}` : null,
      hasVideo: !!v.video_path,
      duration: '-',
      sizeText: '-',
      resolutionText: '-',
      bitrateText: '-',
      timeText: v.completed_at ? new Date(v.completed_at).toLocaleString() : (v.created_at ? new Date(v.created_at).toLocaleString() : 'Unknown'),
      errorText: v.failure_reason || 'Upload failed'
    }
  })

  return (
    <div className="flex-1 flex flex-col min-h-0 border border-[var(--accent-500)]/10 rounded-[18px] bg-[#080e1a]/55 overflow-hidden relative shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-sm">
      
      {/* Sticky Table Header */}
      <div className="bg-[#080e1a]/80 border-b border-white/[0.05] flex items-center px-4 shrink-0 sticky top-0 z-10 text-[11px] font-[600] text-white/70 uppercase tracking-[0.08em] py-[10px]">
        <div className="w-[40%] shrink-0 pl-2">Video</div>
        <div className="w-[30%] shrink-0 pl-2">Upload Details</div>
        <div className="w-[15%] shrink-0 pl-2">Status</div>
        <div className="w-[15%] shrink-0 pr-4 text-right ml-auto">Progress</div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-2">
        {loading ? (
           <div className="text-white/50 text-sm text-center py-4">Loading completed tasks...</div>
        ) : mappedVideos.length === 0 ? (
           <div className="text-white/50 text-sm text-center py-4">No completed tasks found.</div>
        ) : (
          mappedVideos.map((video) => (
            <CompletedTableRow key={video.id} video={video} onRetry={retryTask} />
          ))
        )}
      </div>
      
    </div>
  )
}
