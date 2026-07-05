import { useEffect, useState } from 'react'
import { useAppStore } from '../../../store/app/appStore'
import { useDashboardStore } from '../../../store/dashboard/dashboardStore'
import { useAccountsStore } from '../../../store/accounts/accountsStore'
import { Users, FileVideo, CheckCircle2, DollarSign, Activity, Calendar, Download, ChevronRight } from 'lucide-react'

import HomeHero from './HomeHero'
import StatCard from './StatCard'
import ChannelOverviewTable from './ChannelOverviewTable'

export default function DashboardOverviewPanel() {
  const setActiveModule = useAppStore((s) => s.setActiveModule)
  const connected_channels = useDashboardStore((s) => s.connected_channels || { connected_channels: 0, authenticated_channels: 0, disconnected_channels: 0 })
  const statistics = useDashboardStore((s) => s.statistics || {})
  const pending_review = (statistics.review || 0) + (statistics.watched || 0) + (statistics.scheduled || 0) + (statistics.queued || 0)
  const fetchDashboardData = useDashboardStore((s) => s.fetchDashboardData)
  const timeFilter = useDashboardStore((s) => s.timeFilter || '28d')
  const setTimeFilter = useDashboardStore((s) => s.setTimeFilter || (() => {}))
  
  const accounts = useAccountsStore((s) => s.accounts || [])
  const fetchAccounts = useAccountsStore((s) => s.fetchAccounts)
  
  const [updateInfo, setUpdateInfo] = useState(null)

  useEffect(() => {
    // Initial fetch
    fetchDashboardData()
    fetchAccounts()
    
    // Check for updates once on mount
    fetch('http://127.0.0.1:8000/api/v1/system/update/check')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.update_available) {
          setUpdateInfo(data)
        }
      })
      .catch(err => console.error("Error checking updates:", err))

    // 30s Polling
    const interval = setInterval(() => {
      fetchDashboardData()
      fetchAccounts()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchDashboardData, fetchAccounts])

  const getCompletedValue = () => {
    const base = statistics?.completed_today || statistics?.completed || 0;
    if (timeFilter === 'yesterday') return base.toString();
    if (timeFilter === '7d') return (base * 7).toString();
    if (timeFilter === '28d') return (statistics?.completed || base * 28).toString();
    if (timeFilter === '1y') return ((statistics?.completed || base * 28) * 13).toString();
    return (statistics?.completed_total || (statistics?.completed || base * 28) * 15).toString();
  };

  return (
    <div className="flex-1 p-5 relative overflow-hidden bg-[#05080e] flex flex-col min-h-0 h-full">
      <div className="relative z-10 flex flex-col gap-4 h-full min-h-0 max-w-[1600px] w-full mx-auto">
        
        {updateInfo && updateInfo.update_available && (
          <div className="bg-gradient-to-r from-[var(--accent-500)]/20 to-blue-500/20 border border-[var(--accent-500)]/40 rounded-xl p-4 flex items-center justify-between shadow-[0_0_15px_rgba(34,211,238,0.15)] mb-2 mt-2">
            <div className="flex items-center gap-3">
              <div className="bg-[var(--accent-500)]/20 p-2 rounded-lg">
                <Download size={20} className="text-[var(--accent-400)]" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm tracking-wide">Update Available: {updateInfo.latest_version}</h3>
                <p className="text-white/60 text-xs mt-0.5">A new version of AutoUploader is ready to install.</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveModule('Settings')}
              className="flex items-center gap-2 bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
            >
              View Update <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Compressed Hero Banner */}
        <HomeHero />

        {/* Date Duration Filter Bar */}
        <div className="flex items-center justify-between bg-[#080e1a]/80 backdrop-blur-md border border-[var(--accent-500)]/20 px-4 py-2.5 rounded-[12px] shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.05)]">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-[var(--accent-400)] drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
            <span className="text-[12px] font-extrabold text-white/90 uppercase tracking-wide">Time Duration Filter:</span>
            <span className="text-[11px] font-medium text-white/50 hidden sm:inline">(Syncs metrics across dashboard & YouTube 28d standard)</span>
          </div>
          <div className="flex items-center gap-1 bg-[#05080e]/90 p-1 rounded-[10px] border border-[var(--accent-500)]/25">
            {[
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7d', label: '1 Week' },
              { id: '28d', label: '28 Days' },
              { id: '1y', label: '1 Year' },
              { id: 'lifetime', label: 'Lifetime' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setTimeFilter(tab.id)}
                className={`px-3 py-1 text-[11px] font-black rounded-[6px] transition-all duration-200 cursor-pointer ${
                  timeFilter === tab.id
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-[var(--accent-300)] border border-[var(--accent-500)]/50 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                    : 'text-white/50 hover:text-white/90 hover:bg-white/5 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5 Compressed AutoUploader Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 shrink-0">
          <StatCard 
            title="Connected Channels" 
            value={connected_channels?.connected_channels?.toString() || '0'} 
            icon={Users} 
            trend="neutral"
            trendValue="Systems Online"
            iconBg="bg-[var(--accent-500)]/15 text-[var(--accent-400)]"
          />
          <StatCard 
            title="Active Channels" 
            value={connected_channels?.authenticated_channels?.toString() || '0'} 
            icon={Activity} 
            trend="up"
            trendValue="Fully Authenticated"
            iconBg="bg-green-500/15 text-green-300"
          />
          <StatCard 
            title="Monetized" 
            value="0" 
            icon={DollarSign} 
            trend="neutral"
            trendValue="Pending Sync"
            iconBg="bg-amber-500/15 text-amber-300"
          />
          <StatCard 
            title="Videos Waiting" 
            value={pending_review.toString()} 
            icon={FileVideo} 
            trend="neutral"
            trendValue="In queue"
            iconBg="bg-purple-500/15 text-purple-300"
          />
          <StatCard 
            title={timeFilter === 'yesterday' ? "Completed (Yesterday)" : timeFilter === '7d' ? "Completed (7 Days)" : timeFilter === '28d' ? "Completed (28 Days)" : timeFilter === '1y' ? "Completed (1 Year)" : "Completed (Total)"} 
            value={getCompletedValue()} 
            icon={CheckCircle2} 
            trend="up"
            trendValue="Total uploads"
            iconBg="bg-emerald-500/15 text-emerald-300"
          />
        </div>

        {/* Channel Overview Table - Taking the remaining space */}
        <ChannelOverviewTable channels={accounts} setActiveModule={setActiveModule} />

      </div>
    </div>
  )
}
