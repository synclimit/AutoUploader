import { useState, useMemo, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useDashboardStore } from '../../../store/dashboard/dashboardStore'
import { useAccountsStore } from '../../../store/accounts/accountsStore'
import { useAnalyticsStore } from '../../../store/analytics/analyticsStore'
import { Search, Filter, Settings2, RefreshCw, Download, Activity, ExternalLink, Copy, Video, ChevronRight, ArrowUpDown } from 'lucide-react'

export default function ChannelOverviewTable({ channels = [], setActiveModule, externalFilter, onFilterChange }) {
  const fetchDashboardData = useDashboardStore(s => s.fetchDashboardData)
  const fetchAccounts = useAccountsStore(s => s.fetchAccounts)
  const fetchDashboard = useAnalyticsStore(s => s.fetchDashboard)
  const dashboardData = useAnalyticsStore(s => s.dashboardData)
  
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [sortBy, setSortBy] = useState('Default')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const storeTimeFilter = useDashboardStore(s => s.timeFilter || '28d')
  const setStoreTimeFilter = useDashboardStore(s => s.setTimeFilter || (() => {}))
  const [localTimeMode, setLocalTimeMode] = useState(storeTimeFilter)
  const timeMode = storeTimeFilter || localTimeMode || '28d'
  const setTimeMode = (val) => {
    setLocalTimeMode(val)
    if (setStoreTimeFilter) setStoreTimeFilter(val)
  }
  const [showTimeMenu, setShowTimeMenu] = useState(false)
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [showColMenu, setShowColMenu] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString())
  const [contextMenu, setContextMenu] = useState(null)
  const [summaryPopover, setSummaryPopover] = useState(null)

  useEffect(() => {
    if (externalFilter) {
      setFilter(externalFilter)
    }
  }, [externalFilter])

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('au_visible_columns')
    if (saved) {
        try {
            const parsed = JSON.parse(saved)
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return parsed
            }
        } catch(e) {}
    }
    return {
      status: true,
      attention: true,
      mode: true,
      coverage: true,
      completed: true,
      subscribers: true,
      views: true,
      ctr: true,
      videos: true,
      monetized: true
    }
  })

  const toggleColumn = (key) => {
    setVisibleColumns(prev => {
      const next = { ...prev, [key]: !prev[key] }
      localStorage.setItem('au_visible_columns', JSON.stringify(next))
      return next
    })
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchAccounts()
    await fetchDashboardData()
    setIsRefreshing(false)
    setLastUpdated(new Date().toLocaleTimeString())
    toast.success('Dashboard refreshed')
  }

  const handleExportCSV = () => {
    if (sortedChannels.length === 0) return;
    
    const headers = []
    if (visibleColumns.status) headers.push('Status')
    headers.push('Channel', 'Attention', 'Mode', 'Coverage', 'Completed', 'Subs', 'Views', 'CTR', 'Videos', 'Monetized')
    
    const rows = sortedChannels.map(c => {
      const r = []
      if (visibleColumns.status) r.push(c.status)
      const modeVal = c.mode || c.automation_strategy || 'Continuous'
      const covVal = c.coverage_text || (c.coverage_days !== undefined ? `${c.coverage_days} Days Left` : (c.coverage || 'Empty'))
      r.push(c.channel_name || c.name || '', c.attention || '', modeVal, covVal, c.completed, c.subs || '0', c.views || '0', c.ctr || '0.00%', c.videos || '0', c.monetized ? 'Yes' : 'No')
      return r.map(val => `"${val}"`).join(',')
    })
    
    const csvContent = headers.join(',') + '\n' + rows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    
    a.download = `channels_export_${yyyy}${mm}${dd}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Merge runtime metrics
  const rawChannels = useMemo(() => {
    return (channels || []).map(c => {
      if (!c.id) return c;
      const rt = dashboardData[c.id];
      if (rt) {
        let val = rt.views;
        if (timeMode === 'yesterday') {
          val = rt.views_yesterday !== undefined ? rt.views_yesterday : Math.max(0, Math.round((rt.views_28d !== undefined ? rt.views_28d : (rt.views || 0)) / 28));
        } else if (timeMode === '7d') {
          val = rt.views_7d !== undefined ? rt.views_7d : Math.max(0, Math.round((rt.views_28d !== undefined ? rt.views_28d : (rt.views || 0)) * 0.25));
        } else if (timeMode === '28d') {
          val = rt.views_28d !== undefined ? rt.views_28d : rt.views;
        } else if (timeMode === '1y') {
          val = rt.views_1y !== undefined ? rt.views_1y : Math.min(rt.views_lifetime !== undefined ? rt.views_lifetime : (rt.views || 0), Math.round((rt.views_28d !== undefined ? rt.views_28d : (rt.views || 0)) * 13));
        } else if (timeMode === 'lifetime') {
          val = rt.views_lifetime !== undefined ? rt.views_lifetime : rt.views;
        }
        return { ...c, subs: rt.subs !== undefined ? rt.subs : c.subscribers, views: val, ctr: rt.ctr, videos: rt.videos }
      }
      return { ...c, subs: c.subscribers };
    })
  }, [channels, dashboardData, timeMode])

  useEffect(() => {
    (channels || []).forEach(c => {
      if (c.id && !dashboardData[c.id]) {
        fetchDashboard(c.id);
      }
    });
  }, [channels, fetchDashboard]);

  // Smart Sorting & Filtering
  const sortedChannels = useMemo(() => {
    let filtered = [...rawChannels]
    
    // Apply Search
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(c => 
        (c?.channel_name || c?.name || '')?.toLowerCase().includes(q) || 
        (c?.handle || '')?.toLowerCase().includes(q) ||
        (c?.channel_id || '')?.toLowerCase().includes(q) ||
        (c?.id || '')?.toLowerCase().includes(q)
      )
    }
    
    // Apply Filter
    if (filter !== 'All') {
      if (filter === 'Healthy') filtered = filtered.filter(c => c?.status === 'healthy')
      if (filter === 'Warning' || filter === 'Low') filtered = filtered.filter(c => c?.status === 'warning')
      if (filter === 'Error' || filter === 'Critical' || filter === 'Failed') filtered = filtered.filter(c => c?.status === 'error')
      if (filter === 'Monetized') filtered = filtered.filter(c => c?.monetized)
      if (filter === 'Non Monetized') filtered = filtered.filter(c => c && !c.monetized)
      if (filter === 'Continuous') filtered = filtered.filter(c => (c.mode || c.automation_strategy || 'Continuous').toLowerCase().includes('continuous'))
      if (filter === 'Campaign') filtered = filtered.filter(c => (c.mode || c.automation_strategy || '').toLowerCase().includes('campaign'))
    }
    
    return filtered.sort((a, b) => {
      if (sortBy === 'Coverage') {
        const order = { error: 1, warning: 2, healthy: 3 }
        return (order[a?.status] || 4) - (order[b?.status] || 4)
      }
      if (sortBy === 'Attention') {
        return (b?.attention || '').localeCompare(a?.attention || '')
      }
      if (sortBy === 'Subscribers') {
        return Number(b?.subs || 0) - Number(a?.subs || 0)
      }
      if (sortBy === 'Views') {
        return Number(b?.views || 0) - Number(a?.views || 0)
      }
      if (sortBy === 'Videos') {
        return Number(b?.videos || 0) - Number(a?.videos || 0)
      }
      const getPriority = (c) => {
        if (c?.status === 'error') return 1
        if (c?.status === 'warning') return 2
        return 3
      }
      return getPriority(a) - getPriority(b)
    })
  }, [rawChannels, search, filter, sortBy])

  const counts = useMemo(() => {
    return {
      healthy: rawChannels.filter(c => c?.status === 'healthy').length,
      warning: rawChannels.filter(c => c?.status === 'warning').length,
      error: rawChannels.filter(c => c?.status === 'error').length
    }
  }, [rawChannels])

  const handleContextMenu = (e, channel) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      channel
    })
  }

  const closePopups = () => {
    setContextMenu(null)
    setSummaryPopover(null)
    setShowFilterMenu(false)
    setShowColMenu(false)
  }

  // Status Badge
  const StatusBadge = ({ status }) => {
    if (status === 'healthy') return <span className="text-[12px] font-bold text-green-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400"></span>Healthy</span>
    if (status === 'warning') return <span className="text-[12px] font-bold text-amber-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span>Warning</span>
    return <span className="text-[12px] font-bold text-red-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400"></span>Error</span>
  }

  // Mode Badge (Backend API value only)
  const ModeBadge = ({ channel }) => {
    const backendMode = channel.mode || channel.automation_strategy || 'Continuous'
    const isCampaign = backendMode.toLowerCase().includes('campaign')
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-[11px] font-bold ${isCampaign ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30' : 'bg-green-500/15 text-green-300 border border-green-500/30'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isCampaign ? 'bg-blue-400' : 'bg-green-400'}`}></span>
        {isCampaign ? 'Campaign' : 'Continuous'}
      </span>
    )
  }

  // Coverage Badge (Backend API value only)
  const CoverageBadge = ({ channel }) => {
    const text = channel.coverage_text || (channel.coverage_days !== undefined ? `${channel.coverage_days} Days Left` : (channel.coverage || 'Optimal'))
    const colorCode = (channel.coverage_color || '').toLowerCase()
    let bgStyle = 'bg-red-500/15 text-red-300 border border-red-500/30'
    let dotStyle = 'bg-red-400'
    if (colorCode === 'green' || text.toLowerCase().includes('optimal') || text.toLowerCase().includes('healthy') || (channel.coverage_days && channel.coverage_days > 14)) {
      bgStyle = 'bg-green-500/15 text-green-300 border border-green-500/30'
      dotStyle = 'bg-green-400'
    } else if (colorCode === 'yellow' || (channel.coverage_days && channel.coverage_days > 5)) {
      bgStyle = 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
      dotStyle = 'bg-amber-400'
    } else if (colorCode === 'orange' || (channel.coverage_days && channel.coverage_days > 0)) {
      bgStyle = 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
      dotStyle = 'bg-orange-400'
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-[11px] font-bold ${bgStyle}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`}></span>
        {text}
      </span>
    )
  }

  // Completed Cell Logic
  const CompletedCell = ({ completed, lastUploadText }) => {
    if (completed > 0) return <span className="text-[12px] font-bold text-[var(--accent-400)]">{completed}</span>
    
    let color = 'text-white/40'
    const lowerText = (lastUploadText || 'Never').toLowerCase()
    if (lowerText.includes('day') && !lowerText.includes('yesterday')) color = 'text-amber-400/80'
    if (lowerText.includes('7 days') || lowerText.includes('9 days') || lowerText.includes('week')) color = 'text-red-400/80'
    
    return <span className={`text-[12px] font-bold ${color}`}>{lastUploadText || 'Never'}</span>
  }

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-[#08181f]/80 backdrop-blur-xl border border-[var(--accent-500)]/20 shadow-[0_4px_30px_rgba(34,211,238,0.05)] rounded-[12px]" onClick={closePopups}>
      
      {/* Interactive Summary Row */}
      <div className="px-4 py-2 border-b border-[var(--accent-500)]/10 flex items-center gap-4 text-[11px] font-bold text-white/50 bg-[#061117]/80 rounded-t-[12px] shrink-0 relative z-40">
        <span>Showing {sortedChannels.length} Channels</span>
        <div className="h-3 w-px bg-white/10"></div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); setSummaryPopover(summaryPopover === 'healthy' ? null : 'healthy') }} 
          className={`flex items-center gap-1.5 transition-colors ${summaryPopover === 'healthy' ? 'text-green-300' : 'text-green-400 hover:text-green-300'}`}
        >
          Healthy {counts.healthy}
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); setSummaryPopover(summaryPopover === 'warning' ? null : 'warning') }} 
          className={`flex items-center gap-1.5 transition-colors ${summaryPopover === 'warning' ? 'text-amber-300' : 'text-amber-400 hover:text-amber-300'}`}
        >
          Warning {counts.warning}
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); setSummaryPopover(summaryPopover === 'error' ? null : 'error') }} 
          className={`flex items-center gap-1.5 transition-colors ${summaryPopover === 'error' ? 'text-red-300' : 'text-red-400 hover:text-red-300'}`}
        >
          Error {counts.error}
        </button>

        {/* Summary Popover Dropdown */}
        {summaryPopover && (
          <div className="absolute top-[100%] left-[160px] mt-1 w-[320px] bg-[#0b1d25] border border-[var(--accent-500)]/20 shadow-2xl rounded-[8px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-2 border-b border-[var(--accent-500)]/10 bg-[#08181f]">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                {summaryPopover === 'healthy' ? 'Healthy Channels' : summaryPopover === 'warning' ? 'Channels with Warnings' : 'Channels with Errors'}
              </span>
            </div>
            <div className="max-h-[250px] overflow-y-auto custom-scrollbar p-1">
              {rawChannels.filter(c => c.status === summaryPopover).map(c => (
                <div key={c.id} className="p-2 hover:bg-[var(--accent-500)]/10 rounded-[6px] flex items-center justify-between cursor-pointer transition-colors" onClick={() => setActiveModule && setActiveModule('analytics')}>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-bold text-white/90">{(c.channel_name || c.name)}</span>
                    <span className={`text-[10px] font-bold ${c.status === 'error' ? 'text-red-400' : c.status === 'warning' ? 'text-amber-400' : 'text-green-400'}`}>{c.attention || ''}</span>
                  </div>
                  <ChevronRight size={14} className="text-white/20" />
                </div>
              ))}
              {rawChannels.filter(c => c.status === summaryPopover).length === 0 && (
                <div className="p-3 text-center text-[11px] text-white/40">No channels in this state.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="px-3 py-2 flex items-center gap-2 border-b border-[var(--accent-500)]/10 shrink-0 relative z-30">
        <div className="flex-1 max-w-[300px] h-[32px] bg-cyan-950/30 border border-[var(--accent-500)]/20 rounded-[6px] px-3 flex items-center gap-2">
          <Search size={14} className="text-[var(--accent-400)]/50" />
          <input 
            type="text" 
            placeholder="Search channel..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-[12px] text-white w-full placeholder-white/30"
          />
        </div>
        
        <div className="relative">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowFilterMenu(!showFilterMenu); setShowTimeMenu(false); setShowColMenu(false); }}
            className={`h-[32px] px-3 bg-cyan-950/30 hover:bg-cyan-900/40 border ${filter !== 'All' ? 'border-[var(--accent-400)] text-cyan-200' : 'border-[var(--accent-500)]/20 text-[var(--accent-400)]'} rounded-[6px] text-[12px] font-bold flex items-center gap-2 transition-colors`}
          >
            <Filter size={14} /> {filter !== 'All' ? filter : 'Filter'}
          </button>
          
          {showFilterMenu && (
            <div className="absolute top-[100%] left-0 mt-1 w-[160px] bg-[#0b1d25] border border-[var(--accent-500)]/20 shadow-2xl rounded-[8px] overflow-hidden z-50">
              {['All', 'Healthy', 'Warning', 'Error', 'Monetized', 'Non Monetized', 'Has Queue', 'No Queue'].map(f => (
                <div 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-2 text-[12px] cursor-pointer hover:bg-[var(--accent-500)]/10 ${filter === f ? 'text-[var(--accent-400)] font-bold bg-[var(--accent-500)]/5' : 'text-white/70'}`}
                >
                  {f}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowSortMenu(!showSortMenu); setShowFilterMenu(false); setShowTimeMenu(false); setShowColMenu(false); }}
            className={`h-[32px] px-3 bg-cyan-950/30 hover:bg-cyan-900/40 border ${sortBy !== 'Default' ? 'border-[var(--accent-400)] text-cyan-200' : 'border-[var(--accent-500)]/20 text-[var(--accent-400)]'} rounded-[6px] text-[12px] font-bold flex items-center gap-2 transition-colors`}
          >
            <ArrowUpDown size={14} /> Sort: {sortBy}
          </button>
          
          {showSortMenu && (
            <div className="absolute top-[100%] left-0 mt-1 w-[160px] bg-[#0b1d25] border border-[var(--accent-500)]/20 shadow-2xl rounded-[8px] overflow-hidden z-50">
              {['Default', 'Coverage', 'Attention', 'Subscribers', 'Views', 'Videos'].map(s => (
                <div 
                  key={s}
                  onClick={() => { setSortBy(s); setShowSortMenu(false); }}
                  className={`px-3 py-2 text-[12px] cursor-pointer hover:bg-[var(--accent-500)]/10 ${sortBy === s ? 'text-[var(--accent-400)] font-bold bg-[var(--accent-500)]/5' : 'text-white/70'}`}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowTimeMenu(!showTimeMenu); setShowFilterMenu(false); setShowColMenu(false); }}
            className="h-[32px] px-3 bg-cyan-950/30 hover:bg-cyan-900/40 border border-[var(--accent-500)]/20 text-[var(--accent-400)] rounded-[6px] text-[12px] font-bold flex items-center gap-2 transition-colors"
          >
            <Activity size={14} /> {timeMode === 'yesterday' ? 'Yesterday (1d)' : timeMode === '7d' ? 'Last 7 Days' : timeMode === '28d' ? 'Last 28 Days' : timeMode === '1y' ? 'Last 1 Year' : 'Lifetime Views'}
          </button>
          
          {showTimeMenu && (
            <div className="absolute top-[100%] left-0 mt-1 w-[160px] bg-[#0b1d25] border border-[var(--accent-500)]/20 shadow-2xl rounded-[8px] overflow-hidden z-50">
              {[
                { id: 'yesterday', label: 'Yesterday (1d)' },
                { id: '7d', label: '1 Week (7d)' },
                { id: '28d', label: '28 Days (Last 28d)' },
                { id: '1y', label: '1 Year (365d)' },
                { id: 'lifetime', label: 'Lifetime Views' }
              ].map(opt => (
                <div 
                  key={opt.id}
                  onClick={() => { setTimeMode(opt.id); setShowTimeMenu(false); }}
                  className={`px-3 py-2 text-[12px] cursor-pointer hover:bg-[var(--accent-500)]/10 ${timeMode === opt.id ? 'text-[var(--accent-400)] font-bold bg-[var(--accent-500)]/5' : 'text-white/70'}`}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowColMenu(!showColMenu); setShowFilterMenu(false); setShowTimeMenu(false); }}
            className="h-[32px] px-3 bg-cyan-950/30 hover:bg-cyan-900/40 border border-[var(--accent-500)]/20 rounded-[6px] text-[12px] font-bold text-[var(--accent-400)] flex items-center gap-2 transition-colors"
          >
            <Settings2 size={14} /> Customize Columns
          </button>
          
          {showColMenu && (
            <div className="absolute top-[100%] left-0 mt-1 w-[180px] bg-[#0b1d25] border border-[var(--accent-500)]/20 shadow-2xl rounded-[8px] overflow-hidden z-50 p-1">
              {Object.keys(visibleColumns).map(key => (
                <label key={key} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[var(--accent-500)]/10 rounded cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={visibleColumns[key]} 
                    onChange={() => toggleColumn(key)}
                    className="accent-cyan-500"
                  />
                  <span className="text-[12px] text-white/70 group-hover:text-white capitalize">{key}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 flex justify-end">
          <span className="text-[10px] text-white/30 font-medium mr-4 flex items-center">Last Updated: {lastUpdated}</span>
        </div>
        
        <button 
          onClick={handleRefresh}
          className={`w-[32px] h-[32px] flex items-center justify-center bg-cyan-950/30 hover:bg-cyan-900/40 border border-[var(--accent-500)]/20 rounded-[6px] text-[var(--accent-400)] transition-colors ${isRefreshing ? 'animate-spin opacity-50' : ''}`}
          title="Refresh Dashboard"
        >
          <RefreshCw size={14} />
        </button>
        
        <button 
          onClick={handleExportCSV}
          className="w-[32px] h-[32px] flex items-center justify-center bg-cyan-950/30 hover:bg-cyan-900/40 border border-[var(--accent-500)]/20 rounded-[6px] text-[var(--accent-400)] transition-colors" 
          title="Export Channel List"
        >
          <Download size={14} />
        </button>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto custom-scrollbar relative z-20">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
          <thead className="sticky top-0 bg-[#0b1d25] border-b border-[var(--accent-500)]/20 z-20 shadow-[0_2px_10px_rgba(34,211,238,0.05)]">
            <tr>
              <th className="px-3 py-2 text-[11px] font-bold text-cyan-200/50 uppercase tracking-wider sticky left-0 bg-[#0b1d25] z-30 shadow-[1px_0_0_rgba(34,211,238,0.2)]">Channel</th>
              {visibleColumns.status && <th className="px-3 py-2 text-[11px] font-bold text-cyan-200/50 uppercase tracking-wider">Status</th>}
              {visibleColumns.attention && <th className="px-3 py-2 text-[11px] font-bold text-cyan-200/50 uppercase tracking-wider">Attention</th>}
              {visibleColumns.mode && <th className="px-3 py-2 text-[11px] font-bold text-cyan-200/50 uppercase tracking-wider">Mode</th>}
              {visibleColumns.coverage && <th className="px-3 py-2 text-[11px] font-bold text-cyan-200/50 uppercase tracking-wider">Coverage</th>}
              {visibleColumns.completed && <th className="px-3 py-2 text-[11px] font-bold text-cyan-200/50 uppercase tracking-wider">Completed</th>}
              {visibleColumns.subscribers && <th className="px-3 py-2 text-[11px] font-bold text-cyan-200/50 uppercase tracking-wider">Subs</th>}
              {visibleColumns.views && <th className="px-3 py-2 text-[11px] font-bold text-cyan-200/50 uppercase tracking-wider">Views ({timeMode === 'yesterday' ? '1d' : timeMode === '7d' ? '7d' : timeMode === '28d' ? '28d' : timeMode === '1y' ? '1y' : 'All'})</th>}
              {visibleColumns.ctr && <th className="px-3 py-2 text-[11px] font-bold text-cyan-200/50 uppercase tracking-wider">CTR</th>}
              {visibleColumns.videos && <th className="px-3 py-2 text-[11px] font-bold text-cyan-200/50 uppercase tracking-wider">Videos</th>}
              {visibleColumns.monetized && <th className="px-3 py-2 text-[11px] font-bold text-cyan-200/50 uppercase tracking-wider">Monetized</th>}
            </tr>
          </thead>
          <tbody>
            {sortedChannels.length === 0 ? (
              <tr>
                <td colSpan="11" className="p-8 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Video size={32} className="text-white/20 mb-3" />
                    <span className="text-[13px] font-bold text-white/70">No channels connected yet.</span>
                    <button onClick={() => setActiveModule && setActiveModule('Channels')} className="mt-4 px-4 py-2 bg-[var(--accent-500)]/10 text-[var(--accent-400)] font-bold text-[12px] rounded-[6px] border border-[var(--accent-500)]/20 hover:bg-[var(--accent-500)]/20 transition-colors">Connect Your First Channel</button>
                  </div>
                </td>
              </tr>
            ) : (
              sortedChannels.map(c => (
                <tr 
                  key={c.id} 
                  onContextMenu={(e) => handleContextMenu(e, c)}
                  onDoubleClick={() => setActiveModule && setActiveModule('analytics')}
                  className="border-b border-[var(--accent-500)]/10 hover:bg-[var(--accent-500)]/10 transition-colors cursor-default group"
                >
                  <td className="px-3 py-2 h-[40px] sticky left-0 bg-[#08181f] group-hover:bg-[#0c242f] z-10 shadow-[1px_0_0_rgba(34,211,238,0.1)] transition-colors">
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-white/90">{(c.channel_name || c.name)}</span>
                      <span className="text-[10px] text-white/40">{c.handle}</span>
                    </div>
                  </td>
                  {visibleColumns.status && (
                    <td className="px-3 py-2 h-[40px]">
                      <StatusBadge status={c.status} />
                    </td>
                  )}
                  {visibleColumns.attention && (
                    <td className="px-3 py-2 h-[40px]">
                      <span className={`text-[12px] font-bold ${(c.attention || '').includes('⚠') ? 'text-amber-400' : 'text-white/50'}`}>{c.attention || ''}</span>
                    </td>
                  )}
                  {visibleColumns.mode && (
                    <td className="px-3 py-2 h-[40px]">
                      <ModeBadge channel={c} />
                    </td>
                  )}
                  {visibleColumns.coverage && (
                    <td className="px-3 py-2 h-[40px]">
                      <CoverageBadge channel={c} />
                    </td>
                  )}
                  {visibleColumns.completed && (
                    <td className="px-3 py-2 h-[40px]">
                      <CompletedCell completed={c.completed} lastUploadText={c.lastUploadText} />
                    </td>
                  )}
                  {visibleColumns.subscribers && (
                    <td className="px-3 py-2 h-[40px]">
                      <span className="text-[12px] font-bold text-white/90">{(c.subs || '0')}</span>
                    </td>
                  )}
                  {visibleColumns.views && (
                    <td className="px-3 py-2 h-[40px]">
                      <span className="text-[12px] font-bold text-white/90">{c.views || '0'}</span>
                    </td>
                  )}
                  {visibleColumns.ctr && (
                    <td className="px-3 py-2 h-[40px]">
                      <span className="text-[12px] font-bold text-white/90">{typeof c.ctr === 'number' ? `${c.ctr.toFixed(2)}%` : (c.ctr || '0.00%')}</span>
                    </td>
                  )}
                  {visibleColumns.videos && (
                    <td className="px-3 py-2 h-[40px]">
                      <span className="text-[12px] font-bold text-white/90">{c.videos || '0'}</span>
                    </td>
                  )}
                  {visibleColumns.monetized && (
                    <td className="px-3 py-2 h-[40px]">
                      <span className={`text-[12px] font-bold ${c.monetized ? 'text-green-400' : 'text-white/30'}`}>{c.monetized ? 'Yes' : 'No'}</span>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed bg-[#0b1d25] border border-[var(--accent-500)]/20 rounded-[8px] shadow-2xl py-1.5 z-50 min-w-[180px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 border-b border-[var(--accent-500)]/10 mb-1">
            <span className="text-[11px] font-bold text-cyan-200/50">{contextMenu.channel.channel_name || contextMenu.channel.name}</span>
          </div>
          <button 
            onClick={() => {
              useAccountsStore.getState().setSelectedAccount(contextMenu.channel);
              if (setActiveModule) setActiveModule('Channels');
              closePopups();
            }}
            className="w-full text-left px-3 py-1.5 text-[12px] font-medium text-cyan-100 hover:bg-[var(--accent-500)]/10 flex items-center gap-2 cursor-pointer"
          >
            <ExternalLink size={14} className="text-[var(--accent-400)]" /> Open Channel
          </button>
          <button 
            onClick={() => {
              useAccountsStore.getState().setSelectedAccount(contextMenu.channel);
              if (setActiveModule) setActiveModule('Queue');
              closePopups();
            }}
            className="w-full text-left px-3 py-1.5 text-[12px] font-medium text-cyan-100 hover:bg-[var(--accent-500)]/10 flex items-center gap-2 cursor-pointer"
          >
            <Activity size={14} className="text-[var(--accent-400)]" /> Open Campaign
          </button>
          <button 
            onClick={() => {
              useAccountsStore.getState().setSelectedAccount(contextMenu.channel);
              if (setActiveModule) setActiveModule('Review');
              closePopups();
            }}
            className="w-full text-left px-3 py-1.5 text-[12px] font-medium text-cyan-100 hover:bg-[var(--accent-500)]/10 flex items-center gap-2 cursor-pointer"
          >
            <Video size={14} className="text-[var(--accent-400)]" /> Open Review
          </button>
          <button 
            onClick={() => {
              useAccountsStore.getState().setSelectedAccount(contextMenu.channel);
              if (setActiveModule) setActiveModule('Upload');
              closePopups();
            }}
            className="w-full text-left px-3 py-1.5 text-[12px] font-medium text-cyan-100 hover:bg-[var(--accent-500)]/10 flex items-center gap-2 cursor-pointer"
          >
            <Copy size={14} className="text-[var(--accent-400)]" /> Open Upload Journal
          </button>
          <div className="h-px bg-[var(--accent-500)]/10 my-1"></div>
          <button onClick={() => { handleRefresh(); closePopups(); }} className="w-full text-left px-3 py-1.5 text-[12px] font-medium text-cyan-100 hover:bg-[var(--accent-500)]/10 flex items-center gap-2 cursor-pointer"><RefreshCw size={14} className="text-[var(--accent-400)]" /> Refresh Data</button>
        </div>
      )}
    </div>
  )
}
