import { useState, useEffect, useRef } from 'react'
import apiClient from '../api/client'
import { Download, Copy, Search, Filter, RefreshCw } from 'lucide-react'
import { showToast } from './common/NotificationToast'

export default function ActivityLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [autoScroll, setAutoScroll] = useState(true)
  
  const logsEndRef = useRef(null)
  const scrollContainerRef = useRef(null)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      
      const [sysRes, healthRes] = await Promise.all([
        apiClient.get('/system/logs?limit=300'),
        apiClient.get('/watch-folder/health')
      ]);
      
      let combined = [];

      // sysRes is already the data array because apiClient unwraps { success: true, data: [...] }
      if (Array.isArray(sysRes)) {
        const sysParsed = sysRes.map(log => {
          let module = 'SYSTEM'
          let level = 'INFO'
          let message = log.message

          const match = log.message.match(/^\[(.*?)\]\s*\[(.*?)\]\s*(.*)$/s)
          if (match) {
            module = match[1]
            level = match[2]
            message = match[3]
          } else {
            // Check status or legacy string matching
            if (log.status?.toUpperCase() === 'FAILED' || log.status === 'ERROR') level = 'FAIL'
            else if (log.status?.toUpperCase() === 'COMPLETED' || log.status === 'SUCCESS') level = 'PASS'
            else level = 'INFO'
            
            // Try to guess module from legacy
            if (log.status === 'QUEUED' || log.status === 'SCHEDULED') module = 'SCHEDULER'
            else if (log.status === 'UPLOADING') module = 'UPLOAD'
          }

          return {
            id: log.id,
            timestamp: new Date(log.created_at),
            module: module.toUpperCase(),
            level: level.toUpperCase(),
            message,
            raw: log.message
          }
        })
        combined.push(...sysParsed)
      }

      if (healthRes.success && healthRes.data) {
        healthRes.data.forEach(acc => {
          if (acc.pipelines) {
            Object.entries(acc.pipelines).forEach(([pKey, pHealth]) => {
              if (pHealth.execution_log) {
                const logs = pHealth.execution_log.map((log, idx) => ({
                  id: `health-${acc.account_id}-${pKey}-${idx}-${log.timestamp}`,
                  timestamp: new Date(log.timestamp),
                  module: `WATCH ${pKey.toUpperCase()}`,
                  level: log.status.toUpperCase(),
                  message: log.message,
                  raw: `[WATCH ${pKey.toUpperCase()}] [${log.status.toUpperCase()}] ${log.message}`
                }))
                combined.push(...logs)
              }
            })
          }
        })
      }

      // Sort chronological (oldest first)
      combined.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      // Deduplicate if any issues (optional, but sorting handles most logic)
      setLogs(combined)
      
    } catch (err) {
      console.error('Failed to fetch logs', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 10000) // Poll every 10s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
    setAutoScroll(isAtBottom)
  }

  const getLevelColor = (level) => {
    switch(level.toUpperCase()) {
      case 'PASS': return 'text-green-400'
      case 'FAIL': return 'text-red-400'
      case 'WARNING': return 'text-yellow-400'
      default: return 'text-blue-400' // INFO
    }
  }

  const filteredLogs = logs.filter(log => {
    if (activeFilter !== 'All') {
      if (activeFilter === 'Error Only' && log.level !== 'FAIL') return false
      if (activeFilter !== 'Error Only' && !log.module.toUpperCase().includes(activeFilter.toUpperCase())) return false
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      if (!log.message.toLowerCase().includes(term) && 
          !log.module.toLowerCase().includes(term)) {
        return false
      }
    }
    return true
  })

  const copyLogs = () => {
    const text = filteredLogs.map(l => 
      `${l.timestamp.toLocaleTimeString()} [${l.module}] [${l.level}] ${l.message}`
    ).join('\n')
    navigator.clipboard.writeText(text)
    showToast('Logs copied to clipboard', 'success')
  }

  const downloadLogs = () => {
    const text = filteredLogs.map(l => 
      `${l.timestamp.toISOString()} [${l.module}] [${l.level}] ${l.message}`
    ).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `autouploader_logs_${new Date().getTime()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filters = ['All', 'Long', 'Shorts', 'Scheduler', 'Upload', 'AI', 'Error Only']

  return (
    <div className="h-full bg-[#101722] border border-white/[0.05] rounded-[24px] overflow-hidden flex flex-col shrink-0 relative">
      
      {/* HEADER */}
      <div className="h-[60px] border-b border-white/[0.05] px-5 flex items-center justify-between shrink-0 bg-[#0a0f1a]">
        <div className="flex items-center gap-4">
          <div className="text-sm font-bold text-[var(--accent-400)] tracking-wide uppercase flex items-center gap-2">
            Runtime Logs
            {loading && <RefreshCw size={12} className="animate-spin text-white/40" />}
          </div>
          <div className="h-4 w-[1px] bg-white/10"></div>
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1 max-w-[400px]">
            {filters.map(f => (
              <button 
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1 rounded-[6px] text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${activeFilter === f ? 'bg-[var(--accent-500)]/20 text-[var(--accent-400)] border border-[var(--accent-500)]/30' : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[160px] h-[28px] bg-[#05080e] border border-white/[0.08] rounded-[6px] pl-8 pr-3 text-[11px] text-white outline-none focus:border-[var(--accent-500)]/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1">
            <button onClick={copyLogs} title="Copy Logs" className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-white/10 text-white/40 hover:text-white transition-colors">
              <Copy size={14} />
            </button>
            <button onClick={downloadLogs} title="Download Logs" className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-white/10 text-white/40 hover:text-white transition-colors">
              <Download size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* LOGS CONTAINER */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[11px] custom-scrollbar bg-[#05080e] relative"
      >
        {filteredLogs.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-white/20">No logs found</div>
        ) : (
          filteredLogs.map((log, index) => (
            <div key={log.id || index} className="flex flex-col gap-1 pb-3 border-b border-white/[0.02] last:border-0 group hover:bg-white/[0.01] p-1 -mx-1 rounded">
              <div className="flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                <span className="text-white/40">{log.timestamp.toLocaleTimeString()}</span>
                <span className="text-white/80 font-bold bg-white/5 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">{log.module}</span>
                <span className={`font-bold uppercase tracking-wider ${getLevelColor(log.level)}`}>{log.level}</span>
              </div>
              <div className="text-white/80 pl-[100px] leading-relaxed break-words whitespace-pre-wrap">
                {log.message}
              </div>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Auto-scroll toggle hint */}
      {!autoScroll && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <button 
            onClick={() => { setAutoScroll(true); logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
            className="px-4 py-1.5 rounded-full bg-[var(--accent-500)]/20 border border-[var(--accent-500)]/40 text-[var(--accent-400)] text-[10px] font-bold shadow-lg backdrop-blur-md flex items-center gap-2 hover:bg-[var(--accent-500)]/30 transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--accent-400)] animate-pulse"></span>
            Resume Auto-Scroll
          </button>
        </div>
      )}
    </div>
  )
}