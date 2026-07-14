import { useState, useEffect } from 'react'
import { Activity, Shield, Settings2, BarChart2, CheckCircle2, TrendingUp, Zap, Server, Globe } from 'lucide-react'
import { useAccountsStore } from '../../../store/accounts/accountsStore'
import { useAnalyticsStore } from '../../../store/analytics/analyticsStore'
import Select from '../../common/Select'

import OverviewTab from './tabs/OverviewTab'
import GrowthTab from './tabs/GrowthTab'
import ContentTab from './tabs/ContentTab'
import AutomationTab from './tabs/AutomationTab'
import AITab from './tabs/AITab'
import DiagnosisTab from './tabs/DiagnosisTab'
import OperationsTab from './tabs/OperationsTab'
import HistoryTab from './tabs/HistoryTab'
import QuickActionsBar from './QuickActionsBar'

export default function AnalyticsWorkspace() {
  const { accounts, fetchAccounts, selectedAccount, setSelectedAccount } = useAccountsStore()
  const { fetchOverview, overviewData, fetchOperations } = useAnalyticsStore()
  const selectedChannel = selectedAccount
  const setSelectedChannel = setSelectedAccount
  const [activeTab, setActiveTab] = useState('overview')

  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchAccounts()
  }, [])

  useEffect(() => {
    let interval = null
    if (selectedChannel && selectedChannel.id) {
        if (!overviewData[selectedChannel.id]) {
            fetchOverview(selectedChannel.id)
        }
        
        // Poll overview data (YouTube metrics for Growth, Content, Diagnosis) every 30s
        interval = setInterval(() => {
            fetchOverview(selectedChannel.id, true) // Force refresh
        }, 30000)
    }
    return () => {
        if (interval) clearInterval(interval)
    }
  }, [selectedChannel?.id, fetchOverview])

  useEffect(() => {
    let interval = null
    if (selectedChannel && selectedChannel.id) {
        fetchOperations(selectedChannel.id)
        interval = setInterval(() => {
            fetchOperations(selectedChannel.id)
        }, 5000)
    }
    return () => {
        if (interval) clearInterval(interval)
    }
  }, [selectedChannel?.id, fetchOperations])

  // Filter accounts
  const filteredAccounts = accounts.filter(acc => {
    if (searchQuery && !acc.channel_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // If no channel is selected, show the Channel Selection Grid
  // (Forcing rebuild to fix cache issue)
  if (!selectedChannel) {
    return (
      <div className="flex-1 h-full flex flex-col bg-gradient-to-br from-[var(--bg-sidebar-from)] via-[var(--bg-sidebar-via)] to-[var(--bg-sidebar-to)] p-8 relative overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto w-full flex flex-col gap-8 relative z-10">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <Activity className="text-[var(--accent-400)]" size={28} />
              Channel Analytics Hub
            </h1>
            <p className="text-sm text-white/50">Select an active channel below to view detailed performance telemetries, growth charts, and AI diagnostics.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAccounts.map(acc => (
              <div
                key={acc.id}
                onClick={() => setSelectedChannel(acc)}
                className="bg-[#080e1a]/60 backdrop-blur-md border border-white/[0.08] hover:border-[var(--accent-500)]/40 transition-all duration-300 neon-interactive rounded-[20px] p-6 flex flex-col gap-5 cursor-pointer group shadow-lg hover:scale-[1.02]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-[var(--accent-500)]/30 flex items-center justify-center font-black text-white text-lg overflow-hidden shrink-0 shadow-inner group-hover:border-[var(--accent-400)] transition-colors">
                    {acc.avatar_url ? (
                      <img src={acc.avatar_url} alt={acc.channel_name} className="w-full h-full object-cover" />
                    ) : (
                      acc.channel_name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[16px] font-extrabold text-white truncate group-hover:text-[var(--accent-400)] transition-colors">{acc.channel_name}</span>
                    <span className="text-[12px] font-medium text-white/40 truncate">{acc.niche || 'YouTube Channel'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/[0.06]">
                  <div className="flex flex-col bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
                    <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Pelanggan</span>
                    <span className="text-sm font-black text-white">{acc.subscribers || acc.subs || '0'}</span>
                  </div>
                  <div className="flex flex-col bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
                    <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Total Tayangan</span>
                    <span className="text-sm font-black text-cyan-400">{acc.views || acc.total_views || '0'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Active
                  </span>
                  <span className="text-[12px] font-extrabold text-white/40 group-hover:text-white transition-colors flex items-center gap-1">
                    View Analytics →
                  </span>
                </div>
              </div>
            ))}
          </div>

          {filteredAccounts.length === 0 && (
            <div className="text-center py-20 bg-[#080e1a]/40 backdrop-blur-md rounded-[20px] border border-white/[0.05]">
              <span className="text-white/40 text-sm">No connected channels found. Please add a channel first.</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'growth', label: 'Growth' },
    { id: 'content', label: 'Content' },
    { id: 'automation', label: 'Automation' },
    { id: 'ai', label: 'AI' },
    { id: 'diagnosis', label: 'Diagnosis' },
    { id: 'history', label: 'History' },
    { id: 'operations', label: 'Operations' }
  ]

  return (
    <div className="flex-1 h-full flex flex-col bg-gradient-to-br from-[var(--bg-sidebar-from)] via-[var(--bg-sidebar-via)] to-[var(--bg-sidebar-to)] relative overflow-hidden">
      {/* Sticky Header Toolbar */}
      <div className="shrink-0 bg-[#060a12]/80 backdrop-blur-xl border-b border-white/[0.08] z-20 flex flex-col shadow-sm">
        {/* Top Toolbar */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedChannel(null)} className="text-white/60 hover:text-white transition-all duration-200 text-[11px] font-bold flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-[8px] border border-white/10 hover:border-white/20">
              ← Back
            </button>
            <div className="h-4 w-px bg-white/10"></div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-white/10 flex items-center justify-center font-bold text-white text-[11px] overflow-hidden border border-white/15 shadow-sm">
                {selectedChannel.avatar_url ? (
                  <img src={selectedChannel.avatar_url} alt={selectedChannel.channel_name} className="w-full h-full object-cover" />
                ) : (
                  selectedChannel.channel_name.substring(0,2).toUpperCase()
                )}
              </div>
              <h1 className="text-[16px] font-extrabold text-white leading-none tracking-tight">{selectedChannel.channel_name}</h1>
            </div>
            <div className="h-4 w-px bg-white/10"></div>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-green-500/10 px-2.5 py-1 rounded-[8px] border border-green-500/20 shadow-sm">
                <span className="text-[10px] uppercase font-extrabold text-green-400">Health</span>
                <span className="text-[12px] font-black text-green-400">98%</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-[8px] border border-white/10 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-white/50">Subs</span>
                <span className="text-[12px] font-extrabold text-white/90">
                  {(() => {
                    const subs = overviewData[selectedChannel.id]?.channel?.subscribers != null ? overviewData[selectedChannel.id].channel.subscribers : (selectedChannel.subscribers || selectedChannel.subs || '0');
                    if (!subs) return '0';
                    const num = parseInt(subs);
                    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
                    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
                    return num.toString();
                  })()}
                </span>
              </div>
            </div>
          </div>
          
          <QuickActionsBar channel={selectedChannel} />
        </div>

        {/* Tabs Navigation */}
        <div className="px-4 pb-3 pt-1 flex items-center gap-2 overflow-x-auto custom-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-[12px] font-extrabold rounded-[10px] transition-all duration-300 relative flex items-center whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-[var(--accent-300)] border border-[var(--accent-500)]/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                  : 'bg-[#080e1a]/40 text-white/50 hover:text-white border border-white/[0.05] hover:border-white/15 hover:bg-[#080e1a]/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 relative z-10">
        {activeTab === 'overview' && <OverviewTab channel={selectedChannel} />}
        {activeTab === 'growth' && <GrowthTab channel={selectedChannel} />}
        {activeTab === 'content' && <ContentTab channel={selectedChannel} />}
        {activeTab === 'automation' && <AutomationTab channel={selectedChannel} />}
        {activeTab === 'ai' && <AITab channel={selectedChannel} />}
        {activeTab === 'diagnosis' && <DiagnosisTab channel={selectedChannel} />}
        {activeTab === 'history' && <HistoryTab channel={selectedChannel} />}
        {activeTab === 'operations' && <OperationsTab channel={selectedChannel} />}
      </div>
    </div>
  )
}
