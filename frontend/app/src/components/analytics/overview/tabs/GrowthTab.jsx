import { TrendingUp, Target, Award, LineChart } from 'lucide-react'
import { useAnalyticsStore } from '../../../../store/analytics/analyticsStore'
import { useMemo, useEffect } from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export default function GrowthTab({ channel }) {
  const { overviewData, fetchCharts, chartsData } = useAnalyticsStore()
  
  const data = overviewData[channel?.id] || {}
  const chartId = `${channel?.id}_28`
  const historyData = chartsData[chartId]?.history || []
  
  useEffect(() => {
    if (channel?.id) {
      fetchCharts(channel.id, 28)
    }
  }, [channel?.id, fetchCharts])
  
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  const stats = useMemo(() => {
    return {
      subscribersRaw: data?.channel?.subscribers || 0,
      viewsRaw: data?.channel?.views || 0,
      subscribers: formatNumber(data?.channel?.subscribers ?? channel?.subscribers),
      views: formatNumber(data?.channel?.views ?? channel?.views),
      videos: formatNumber(data?.channel?.videos ?? channel?.videos),
      growthRate: data?.analytics?.ctr ? `${data.analytics.ctr.toFixed(1)}%` : 'Stable'
    }
  }, [data, channel])
  
  const milestones = useMemo(() => {
    const subs = stats.subscribersRaw
    const views = stats.viewsRaw
    
    const getMilestones = (val) => {
      const thresholds = [1000, 10000, 50000, 100000, 500000, 1000000, 5000000, 10000000, 50000000, 100000000]
      let recent = thresholds[0]
      let next = thresholds[1]
      for (let i = 0; i < thresholds.length; i++) {
        if (val >= thresholds[i]) {
          recent = thresholds[i]
          next = thresholds[i+1] || thresholds[i] * 2
        } else {
          break
        }
      }
      return { recent, next, progress: Math.min(100, Math.round((val / next) * 100)) }
    }
    
    const subM = getMilestones(subs)
    const viewM = getMilestones(views)
    
    return {
      recentSubs: formatNumber(subM.recent),
      nextSubs: formatNumber(subM.next),
      subProgress: subM.progress,
      recentViews: formatNumber(viewM.recent),
      nextViews: formatNumber(viewM.next),
      viewProgress: viewM.progress
    }
  }, [stats])

  const Stat = ({ label, value, trend, positive }) => (
    <div className="flex flex-col gap-1 p-4 bg-[#080e1a]/80 backdrop-blur-md border border-[var(--accent-500)]/15 hover:border-[var(--accent-500)]/40 rounded-[16px] transition-all neon-interactive shadow-sm">
      <span className="text-[12px] font-bold text-white/40 uppercase tracking-widest">{label}</span>
      <span className="text-[24px] font-bold text-white">{value}</span>
      <span className={`text-[11px] font-bold ${positive ? 'text-green-400' : positive === false ? 'text-red-400' : 'text-white/50'}`}>
        {trend}
      </span>
    </div>
  )

  const RealtimeChart = ({ title, dataKey, color }) => (
    <div className="bg-[#080e1a]/60 backdrop-blur-md border border-[var(--accent-500)]/15 hover:border-[var(--accent-500)]/30 transition-all duration-300 neon-interactive rounded-[16px] p-5 flex flex-col h-[220px]">
      <h3 className="text-[14px] font-bold text-white mb-4 flex items-center gap-2"><LineChart size={16} className={color}/> {title}</h3>
      <div className="flex-1 w-full min-h-0">
        {historyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color === "text-[var(--accent-400)]" ? "#22d3ee" : "#a855f7"} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={color === "text-[var(--accent-400)]" ? "#22d3ee" : "#a855f7"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={10} tickMargin={10} minTickGap={30} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickFormatter={formatNumber} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey={dataKey} stroke={color === "text-[var(--accent-400)]" ? "#22d3ee" : "#a855f7"} fillOpacity={1} fill={`url(#color${dataKey})`} />
              </AreaChart>
            </ResponsiveContainer>
        ) : (
            <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-[var(--accent-500)]/15 rounded-[12px] bg-white/[0.01]">
                <span className="px-3 py-1 bg-white/5 rounded-full text-[12px] font-bold text-white/40 uppercase tracking-wider mb-2">Syncing</span>
                <span className="text-[13px] text-white/30 font-medium">Fetching historical data...</span>
            </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6 mt-4 pb-10">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Pelanggan" value={stats.subscribers} trend="▲ Auto-Sync" positive={true} />
        <Stat label="Views" value={stats.views} trend="▲ Auto-Sync" positive={true} />
        <Stat label="Uploads" value={stats.videos} trend="Total Videos" positive={null} />
        <Stat label="Growth Rate" value={stats.growthRate} trend="Stable" positive={null} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RealtimeChart title="Subscriber Growth (28d)" dataKey="subscribers" color="text-[var(--accent-400)]" />
        <RealtimeChart title="Views Velocity (28d)" dataKey="views" color="text-purple-400" />
      </div>

      {/* Milestones & Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#080e1a]/60 backdrop-blur-md border border-[var(--accent-500)]/15 hover:border-[var(--accent-500)]/30 transition-all duration-300 neon-interactive rounded-[16px] p-5">
          <h3 className="text-[14px] font-bold text-white mb-4 flex items-center gap-2"><Award size={16} className="text-amber-400"/> Recent Milestones</h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-[12px] border border-[var(--accent-500)]/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400"><Award size={14}/></div>
                <span className="text-[13px] font-bold text-white">{milestones.recentSubs} Subscribers</span>
              </div>
              <span className="text-[11px] font-medium text-white/40">Achieved</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-[12px] border border-[var(--accent-500)]/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400"><Award size={14}/></div>
                <span className="text-[13px] font-bold text-white">{milestones.recentViews} Total Views</span>
              </div>
              <span className="text-[11px] font-medium text-white/40">Achieved</span>
            </div>
          </div>
        </div>
        
        <div className="bg-[#080e1a]/60 backdrop-blur-md border border-[var(--accent-500)]/15 hover:border-[var(--accent-500)]/30 transition-all duration-300 neon-interactive rounded-[16px] p-5">
          <h3 className="text-[14px] font-bold text-white mb-4 flex items-center gap-2"><Target size={16} className="text-purple-400"/> Upcoming Goals</h3>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 p-4 bg-white/[0.02] rounded-[12px] border border-[var(--accent-500)]/10">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-white">{milestones.nextSubs} Subscribers</span>
                <span className="text-[12px] font-bold text-purple-400">{milestones.subProgress}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full transition-all duration-1000" style={{ width: `${milestones.subProgress}%` }}></div>
              </div>
            </div>
            <div className="flex flex-col gap-2 p-4 bg-white/[0.02] rounded-[12px] border border-[var(--accent-500)]/10">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-white">{milestones.nextViews} Total Views</span>
                <span className="text-[12px] font-bold text-purple-400">{milestones.viewProgress}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full transition-all duration-1000" style={{ width: `${milestones.viewProgress}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
