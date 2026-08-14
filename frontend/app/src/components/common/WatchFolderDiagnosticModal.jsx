import { useState } from 'react'
import { Search, AlertTriangle, CheckCircle2, XCircle, RefreshCw, Zap, FileVideo, Folder, ArrowRight, ShieldAlert, X } from 'lucide-react'
import apiClient from '../../api/client'
import { showToast } from './NotificationToast'

export default function WatchFolderDiagnosticModal({ channelId, isOpen, onClose, onRefreshQueue }) {
  const [isDiagnosing, setIsDiagnosing] = useState(false)
  const [isForceIngesting, setIsForceIngesting] = useState(false)
  const [diagnosticData, setDiagnosticData] = useState(null)

  if (!isOpen) return null

  const runDiagnosis = async () => {
    setIsDiagnosing(true)
    try {
      const res = await apiClient.post('/watch-folder/diagnose', { channel_id: channelId || null })
      const payload = res?.reports ? res : (res?.data ?? res)
      if (payload && (payload.reports || payload.success)) {
        setDiagnosticData(payload)
        showToast('Diagnostic completed successfully', 'success')
      } else {
        showToast(payload?.message || 'Failed to run diagnosis', 'error')
      }
    } catch (e) {
      console.error('Diagnosis failed:', e)
      showToast('Diagnostic failed: ' + e.message, 'error')
    } finally {
      setIsDiagnosing(false)
    }
  }

  const handleForceIngest = async () => {
    setIsForceIngesting(true)
    try {
      const res = await apiClient.post('/watch-folder/force-ingest', { channel_id: channelId || null })
      const payload = res?.message ? res : (res?.data ?? res)
      if (payload) {
        showToast(payload.message || 'Force ingest completed!', 'success', 6000)
        if (onRefreshQueue) onRefreshQueue()
        runDiagnosis()
      } else {
        showToast('Force ingest failed', 'error')
      }
    } catch (e) {
      console.error('Force ingest failed:', e)
      showToast('Force ingest failed: ' + e.message, 'error')
    } finally {
      setIsForceIngesting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#070b14] border border-cyan-500/30 rounded-[20px] shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Search size={20} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-white tracking-wide">Watch Folder Diagnostic Tool</h2>
              <p className="text-[12px] text-white/50">Analyze folder paths, permissions, video files, and auto-fix ingestion issues.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {!diagnosticData && !isDiagnosing && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Search size={32} />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-[15px] font-bold text-white">No Diagnostic Scan Yet</h3>
                <p className="text-[12px] text-white/60">Run a full system diagnosis to inspect why videos are not appearing in your Review Workspace.</p>
              </div>
              <button
                onClick={runDiagnosis}
                className="px-6 py-2.5 bg-cyan-500 text-[#05080e] font-bold text-[13px] rounded-[10px] hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-2"
              >
                <Search size={16} /> Run Full Diagnosis
              </button>
            </div>
          )}

          {isDiagnosing && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw size={36} className="text-cyan-400 animate-spin" />
              <p className="text-[14px] font-bold text-white">Scanning & Diagnosing Watch Folder...</p>
              <p className="text-[12px] text-white/50">Checking filesystem paths, read stability, DB records, and pipeline states.</p>
            </div>
          )}

          {diagnosticData && (
            <div className="space-y-6">
              
              {/* Force Ingest Action Banner */}
              <div className="p-4 rounded-[14px] bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap size={22} className="text-cyan-400 shrink-0" />
                  <div>
                    <h4 className="text-[13px] font-bold text-white">Auto-Fix & Ingest All Videos</h4>
                    <p className="text-[11px] text-white/60">Enables all pipelines and forces immediate video ingestion into Review Workspace.</p>
                  </div>
                </div>
                <button
                  onClick={handleForceIngest}
                  disabled={isForceIngesting}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-[#05080e] font-bold text-[12px] rounded-[8px] hover:brightness-110 transition-all disabled:opacity-50 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-1.5"
                >
                  <Zap size={14} className={isForceIngesting ? "animate-spin" : ""} />
                  {isForceIngesting ? 'Ingesting...' : '⚡ Force Ingest All Videos'}
                </button>
              </div>

              {/* Reports per Channel */}
              {diagnosticData.reports.map((rep, idx) => (
                <div key={idx} className="p-5 rounded-[16px] bg-white/[0.02] border border-white/[0.06] space-y-4">
                  
                  {/* Channel Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <div>
                      <h3 className="text-[15px] font-bold text-white flex items-center gap-2">
                        <Folder size={16} className="text-cyan-400" />
                        {rep.channel_name}
                      </h3>
                      <p className="text-[11px] font-mono text-white/50 mt-0.5">
                        Watch Folder: <span className="text-cyan-300 font-bold">{rep.watch_folder || 'Not Configured'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white/70">
                        Files Detected: <b className="text-white">{rep.summary.total_files_detected}</b>
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-green-500/10 border border-green-500/30 text-green-400">
                        Ready to Ingest: <b>{rep.summary.ingestible_videos}</b>
                      </span>
                    </div>
                  </div>

                  {/* Pipelines Status Badges */}
                  <div className="grid grid-cols-2 gap-3">
                    {rep.pipelines_status.map((p, pIdx) => (
                      <div key={pIdx} className="p-3 rounded-[10px] bg-black/40 border border-white/[0.05] flex items-center justify-between text-[12px]">
                        <div>
                          <span className="font-bold uppercase tracking-wider text-white/80">{p.pipeline_type} Pipeline</span>
                          <p className="text-[10px] text-white/40 truncate max-w-[250px]">{p.watch_folder || 'No path'}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.status_text === 'OK' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {p.status_text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Detected Items Table */}
                  <div className="space-y-2">
                    <h4 className="text-[12px] font-bold text-white/70 uppercase tracking-wider">Detected Video Items ({rep.items_found.length})</h4>
                    {rep.items_found.length === 0 ? (
                      <div className="p-4 rounded-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[12px] flex items-center gap-2">
                        <AlertTriangle size={16} /> No video files (.mp4, .mov, etc) were found inside the specified watch folder.
                      </div>
                    ) : (
                      <div className="max-h-[220px] overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                        {rep.items_found.map((item, iIdx) => (
                          <div key={iIdx} className="p-2.5 rounded-[8px] bg-black/30 border border-white/[0.04] flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <FileVideo size={14} className="text-cyan-400 shrink-0" />
                              <span className="text-white/90 font-mono truncate">{item.file_name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-white/40 font-mono text-[10px]">{item.reason}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.status === 'READY' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
          <button
            onClick={runDiagnosis}
            disabled={isDiagnosing}
            className="px-3.5 py-1.5 rounded-[8px] border border-white/10 text-white/70 hover:text-white text-[12px] font-bold transition-colors flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={isDiagnosing ? "animate-spin" : ""} /> Re-Run Diagnostic
          </button>
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-white/10 text-white hover:bg-white/20 text-[12px] font-bold rounded-[8px] transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}
