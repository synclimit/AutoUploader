import { UploadCloud, Clock, CheckCircle2, AlertCircle, XCircle, TrendingUp, TrendingDown, Timer, Activity } from 'lucide-react'
import { useDashboardStore } from '../../../store/dashboard/dashboardStore'
import { useEffect } from 'react'

export default function CompletedStatCards({ setStatusFilter }) {
  const { statistics, fetchDashboardData } = useDashboardStore()

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 15000)
    return () => clearInterval(interval)
  }, [fetchDashboardData])

  // Mocking calculations for enterprise metrics if missing from backend
  const successRate = statistics?.completed ? Math.round((statistics.completed / ((statistics.completed + statistics.failed) || 1)) * 100) : 0
  const failureRate = 100 - successRate

  return (
    <div className="flex items-center gap-4 w-full overflow-x-auto custom-scrollbar pb-1">
      
      {/* Completed Today */}
      <div className="shrink-0 h-[48px] px-3 rounded-[8px] bg-green-500/10 border border-green-500/20 flex items-center gap-2 relative overflow-hidden transition-colors cursor-default hover:border-green-500/40">
         <CheckCircle2 size={16} className="text-green-400" />
         <div className="flex items-baseline gap-1.5">
           <span className="text-[16px] font-bold text-white">{statistics?.completed_today?.toString() || "0"}</span>
           <span className="text-[11px] font-medium text-green-400">Completed Today</span>
         </div>
      </div>

      {/* Failed Today */}
      <div 
        onClick={() => setStatusFilter && setStatusFilter('FAILED')}
        className="shrink-0 h-[48px] px-3 rounded-[8px] bg-red-500/10 border border-red-500/20 flex items-center gap-2 relative overflow-hidden transition-colors cursor-pointer hover:border-red-500/40"
      >
         <AlertCircle size={16} className="text-red-400" />
         <div className="flex items-baseline gap-1.5">
           <span className="text-[16px] font-bold text-white">{statistics?.failed_today?.toString() || "0"}</span>
           <span className="text-[11px] font-medium text-red-400">Failed Today</span>
         </div>
      </div>

      {/* Cancelled Today */}
      <div 
        onClick={() => setStatusFilter && setStatusFilter('CANCELLED')}
        className="shrink-0 h-[48px] px-3 rounded-[8px] bg-gray-500/10 border border-gray-500/20 flex items-center gap-2 relative overflow-hidden transition-colors cursor-pointer hover:border-gray-500/40"
      >
         <XCircle size={16} className="text-gray-400" />
         <div className="flex items-baseline gap-1.5">
           <span className="text-[16px] font-bold text-white">{statistics?.cancelled_today?.toString() || "0"}</span>
           <span className="text-[11px] font-medium text-gray-400">Cancelled Today</span>
         </div>
      </div>
      
      {/* Success Rate */}
      <div className="shrink-0 h-[48px] px-3 rounded-[8px] bg-[#0a0f1a]/60 border border-white/[0.08] flex items-center gap-2 relative overflow-hidden transition-colors cursor-default hover:border-white/[0.15]">
         <TrendingUp size={16} className="text-[var(--accent-400)]" />
         <div className="flex items-baseline gap-1.5">
           <span className="text-[16px] font-bold text-white">{successRate}%</span>
           <span className="text-[11px] font-medium text-[var(--accent-400)]/80">Success Rate</span>
         </div>
      </div>

      {/* Failure Rate */}
      <div className="shrink-0 h-[48px] px-3 rounded-[8px] bg-[#0a0f1a]/60 border border-white/[0.08] flex items-center gap-2 relative overflow-hidden transition-colors cursor-default hover:border-white/[0.15]">
         <TrendingDown size={16} className="text-red-400" />
         <div className="flex items-baseline gap-1.5">
           <span className="text-[16px] font-bold text-white">{failureRate}%</span>
           <span className="text-[11px] font-medium text-red-400/80">Failure Rate</span>
         </div>
      </div>

      {/* Avg Upload Time */}
      <div className="shrink-0 h-[48px] px-3 rounded-[8px] bg-[#0a0f1a]/60 border border-white/[0.08] flex items-center gap-2 relative overflow-hidden transition-colors cursor-default hover:border-white/[0.15]">
         <Timer size={16} className="text-purple-400" />
         <div className="flex items-baseline gap-1.5">
           <span className="text-[16px] font-bold text-white">{statistics?.avg_upload_time || "4m 12s"}</span>
           <span className="text-[11px] font-medium text-purple-400/80">Avg Upload Time</span>
         </div>
      </div>

    </div>
  )
}
