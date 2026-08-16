import { useState, useEffect } from 'react'
import { X, ShieldAlert, Download, RefreshCw, Terminal, Cpu, FileText, Folder, CheckCircle, AlertTriangle, AlertCircle, Info, Search, Filter } from 'lucide-react'
import apiClient from '../../api/client'
import { showToast } from './NotificationToast'

import { createPortal } from 'react-dom'

export default function DiagnosticCenterModal({ isOpen, onClose, initialErrorId = null }) {
  const [activeTab, setActiveTab] = useState('logs')
  const [summary, setSummary] = useState(null)
  const [logs, setLogs] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedModule, setSelectedModule] = useState('ALL')
  const [selectedLevel, setSelectedLevel] = useState(initialErrorId ? 'ERROR' : 'ALL')
  const [searchQuery, setSearchQuery] = useState(initialErrorId || '')

  useEffect(() => {
    if (isOpen) {
      fetchDiagnosticData()
    }
  }, [isOpen, selectedModule, selectedLevel])

  const fetchDiagnosticData = async () => {
    setIsLoading(true)
    try {
      const sumRes = await apiClient.get('/system/diagnostic/summary')
      const sumPayload = sumRes?.data || sumRes
      setSummary(sumPayload)

      let url = '/system/diagnostic/logs?limit=300'
      if (selectedModule !== 'ALL') url += `&module=${selectedModule}`
      if (selectedLevel !== 'ALL') url += `&level=${selectedLevel}`
      
      const logRes = await apiClient.get(url)
      const logPayload = logRes?.data || logRes
      setLogs(Array.isArray(logPayload) ? logPayload : [])
    } catch (err) {
      console.error('Failed to fetch diagnostic data', err)
      showToast('Failed to load diagnostic telemetry', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      showToast('Generating redacted diagnostic report ZIP...', 'info', 4000)
      
      // Fetch export blob from backend
      const response = await fetch('/api/v1/system/diagnostic/export', {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Export failed on server')
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      a.download = `RyanPitstop_Diagnostic_${dateStr}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(downloadUrl)

      showToast('Diagnostic Report exported! Attach this ZIP file to Gravity/Developer.', 'success', 6000)
    } catch (err) {
      showToast('Failed to export diagnostic report: ' + err.message, 'error')
    } finally {
      setIsExporting(false)
    }
  }

  const handleOpenLogsFolder = async () => {
    try {
      await apiClient.post('/system/logs/open-folder')
      showToast('Opened logs folder', 'success')
    } catch (err) {
      showToast('Failed to open logs folder', 'error')
    }
  }

  if (!isOpen) return null

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      (log.error_id && log.error_id.toLowerCase().includes(q)) ||
      (log.message && log.message.toLowerCase().includes(q)) ||
      (log.module && log.module.toLowerCase().includes(q)) ||
      (log.action && log.action.toLowerCase().includes(q))
    )
  })

  const getLevelBadge = (level) => {
    switch (level) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1"><AlertCircle size={11}/> CRITICAL</span>
      case 'ERROR':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1"><AlertTriangle size={11}/> ERROR</span>
      case 'WARNING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 flex items-center gap-1"><AlertTriangle size={11}/> WARNING</span>
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1"><Info size={11}/> INFO</span>
    }
  }

  const portalTarget = document.getElementById('portal-root') || document.body

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="w-full max-w-[1000px] h-[85vh] bg-[#070b12] border border-cyan-500/40 rounded-2xl shadow-[0_0_80px_rgba(34,211,238,0.4)] flex flex-col overflow-hidden relative z-[1000000]">
        
        {/* TOP BAR */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                Diagnostic Center
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">Telemetry & Error Logging</span>
              </h2>
              <p className="text-xs text-white/50">System error detection, module events, and Gravity diagnostic exporter</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2 bg-cyan-500 text-[#05080e] font-bold text-xs rounded-xl hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] disabled:opacity-50 flex items-center gap-2"
            >
              <Download size={14} className={isExporting ? "animate-bounce" : ""} />
              {isExporting ? 'Generating ZIP...' : 'Export Diagnostic Report'}
            </button>

            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* METRICS & NAV TABS */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-black/40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'logs' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              <Terminal size={14} /> Diagnostic Logs
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'system' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              <Cpu size={14} /> System & App Information
            </button>
          </div>

          {summary && (
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-white/60">
                <span>Errors:</span>
                <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{summary.metrics?.error_count || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/60">
                <span>Warnings:</span>
                <span className="text-yellow-300 font-bold bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">{summary.metrics?.warning_count || 0}</span>
              </div>
              <button
                onClick={handleOpenLogsFolder}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
              >
                <Folder size={12} /> Open Log Folder
              </button>
            </div>
          )}
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-hidden p-6">
          {activeTab === 'logs' && (
            <div className="h-full flex flex-col gap-4">
              
              {/* FILTERS */}
              <div className="flex items-center justify-between gap-4 bg-white/[0.02] p-3 rounded-xl border border-white/[0.05]">
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative flex-1 max-w-[300px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      placeholder="Search Error ID, message..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder:text-white/30 focus:border-cyan-500 outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40 font-bold flex items-center gap-1"><Filter size={12}/> Module:</span>
                    <select
                      value={selectedModule}
                      onChange={(e) => setSelectedModule(e.target.value)}
                      className="bg-black/40 border border-white/10 text-white text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-cyan-500"
                    >
                      <option value="ALL">All Modules</option>
                      <option value="UPDATE">Update Engine</option>
                      <option value="REVIEW">Review Engine</option>
                      <option value="UPLOAD">Upload Engine</option>
                      <option value="SYSTEM">System & Database</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40 font-bold">Severity:</span>
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="bg-black/40 border border-white/10 text-white text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-cyan-500"
                    >
                      <option value="ALL">All Severities</option>
                      <option value="CRITICAL">Critical</option>
                      <option value="ERROR">Error</option>
                      <option value="WARNING">Warning</option>
                      <option value="INFO">Info</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={fetchDiagnosticData}
                  disabled={isLoading}
                  className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                  title="Refresh logs"
                >
                  <RefreshCw size={14} className={isLoading ? "animate-spin text-cyan-400" : ""} />
                </button>
              </div>

              {/* LOG TABLE */}
              <div className="flex-1 overflow-y-auto custom-scrollbar border border-white/[0.08] rounded-xl bg-black/50 p-2 font-mono text-xs">
                {filteredLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-white/30 italic">
                    {isLoading ? 'Loading diagnostic logs...' : 'No diagnostic log entries match your filter.'}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {filteredLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border transition-all ${log.level === 'CRITICAL' ? 'bg-red-500/10 border-red-500/30' : log.level === 'ERROR' ? 'bg-amber-500/10 border-amber-500/20' : log.level === 'WARNING' ? 'bg-yellow-500/5 border-yellow-500/10' : 'bg-white/[0.02] border-white/[0.05]'}`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            {getLevelBadge(log.level)}
                            <span className="text-cyan-400 font-bold">[{log.module}]</span>
                            <span className="text-white/50">{log.action}</span>
                            {log.error_id && (
                              <span className="bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30 select-all">
                                {log.error_id}
                              </span>
                            )}
                          </div>
                          <span className="text-white/40 text-[11px]">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>

                        <p className="text-white/90 font-sans text-[13px] leading-relaxed mb-1">{log.message}</p>

                        {log.details && (
                          <pre className="text-[11px] bg-black/60 p-2 rounded text-cyan-300 overflow-x-auto border border-white/5 mt-1">
                            {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : String(log.details)}
                          </pre>
                        )}

                        {log.stack_trace && (
                          <details className="mt-2 text-[11px] text-red-300/80">
                            <summary className="cursor-pointer hover:text-red-300 font-sans">View Stack Trace</summary>
                            <pre className="bg-red-950/40 p-2.5 rounded mt-1 overflow-x-auto text-[10px] border border-red-500/20">
                              {log.stack_trace}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {activeTab === 'system' && summary && (
            <div className="h-full overflow-y-auto custom-scrollbar flex flex-col gap-6 text-xs font-mono">
              <div className="bg-white/[0.02] border border-white/[0.08] p-5 rounded-xl flex flex-col gap-3">
                <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                  <Cpu size={16} className="text-cyan-400" /> Application Environment & Runtime
                </h3>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10 text-white/80">
                  <div>
                    <span className="text-white/40 font-bold block mb-0.5">Application Name:</span>
                    <span>{summary.app_info.name}</span>
                  </div>
                  <div>
                    <span className="text-white/40 font-bold block mb-0.5">Current Installed Version:</span>
                    <span className="text-cyan-300 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      {summary.app_info.version} (Build {summary.app_info.build})
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 font-bold block mb-0.5">Operating System:</span>
                    <span>{summary.app_info.os} ({summary.app_info.architecture})</span>
                  </div>
                  <div>
                    <span className="text-white/40 font-bold block mb-0.5">Python Version:</span>
                    <span>{summary.app_info.python_version}</span>
                  </div>
                  <div>
                    <span className="text-white/40 font-bold block mb-0.5">Execution Mode:</span>
                    <span className={summary.app_info.is_frozen ? "text-purple-400 font-bold" : "text-amber-400 font-bold"}>
                      {summary.app_info.is_frozen ? "Production Frozen (.exe)" : "Development Source"}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 font-bold block mb-0.5">Executable Path:</span>
                    <span className="text-white/60 truncate block" title={summary.app_info.executable_path}>
                      {summary.app_info.executable_path}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.08] p-5 rounded-xl flex flex-col gap-3">
                <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                  <Folder size={16} className="text-cyan-400" /> AppData Directory Paths
                </h3>
                <div className="flex flex-col gap-2 pt-2 border-t border-white/10 text-white/80">
                  <div className="flex justify-between items-center bg-black/40 p-2 rounded border border-white/5">
                    <span className="text-white/40">Root AppData:</span>
                    <span className="text-cyan-300">{summary.app_info.appdata_dir}</span>
                  </div>
                  <div className="flex justify-between items-center bg-black/40 p-2 rounded border border-white/5">
                    <span className="text-white/40">Logs Storage:</span>
                    <span className="text-cyan-300">{summary.app_info.logs_dir}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>,
    portalTarget
  )
}
