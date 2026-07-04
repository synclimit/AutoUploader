import { useAccountsStore } from '../../../store/accounts/accountsStore'
import TooltipHelper from '../../common/TooltipHelper'

function formatLastScanResult(status, count) {
  if (!status || status === 'IDLE') return '—'
  if (status === 'NO_PACKAGES') return 'No Packages Found'
  if (status === 'IMPORTED') return `Imported ${count} Packages`
  if (status === 'DUPLICATE') return 'Duplicate Skipped'
  if (status === 'VALIDATION_FAILED') return 'Validation Failed'
  if (status === 'PATH_UNAVAILABLE') return 'Path Unavailable'
  if (status === 'IMPORT_FAILED') return 'Import Failed'
  return status
}

function timeAgo(isoString) {
  if (!isoString) return '—'
  try {
    const date = new Date(isoString)
    const now = new Date()
    const seconds = Math.floor((now - date) / 1000)

    if (seconds < 60) return 'Just now'
    
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hr ago`
    
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days} days ago`
    
    const months = Math.floor(days / 30)
    if (months < 12) return `${months} mo ago`
    
    const years = Math.floor(months / 12)
    return `${years} yr ago`
  } catch (e) {
    return 'Invalid Date'
  }
}

export default function WatchFolderHealthPanel({ accountId, watchEnabled }) {
  const healthMap = useAccountsStore((s) => s.watchFolderHealth)
  const isScanning = useAccountsStore((s) => s.isScanning)
  const scanWatchFolder = useAccountsStore((s) => s.scanWatchFolder)
  
  const accountHealth = healthMap[accountId]

  if (!watchEnabled) {
    return (
      <div className="py-3 border-b border-white/[0.02]">
        <div className="text-[10px] uppercase tracking-wide text-white/35 mb-3">Watch Folder Status</div>
        <div className="min-h-[82px] flex items-center justify-center bg-white/[0.02] rounded-lg border border-white/5 text-white/40 text-[11px]">
          No Watch Folder Configured
        </div>
      </div>
    )
  }

  if (!accountHealth || !accountHealth.pipelines) {
    return (
      <div className="py-3 border-b border-white/[0.02]">
        <div className="text-[10px] uppercase tracking-wide text-white/35 mb-3">Watch Folder Status</div>
        <div className="min-h-[82px] flex items-center justify-center bg-white/[0.02] rounded-lg border border-white/5 text-white/40 text-[11px]">
          Waiting For Data...
        </div>
      </div>
    )
  }

  const pipelines = Object.entries(accountHealth.pipelines)

  if (pipelines.length === 0) {
    return (
      <div className="py-3 border-b border-white/[0.02]">
        <div className="text-[10px] uppercase tracking-wide text-white/35 mb-3">Watch Folder Status</div>
        <div className="min-h-[82px] flex items-center justify-center bg-white/[0.02] rounded-lg border border-white/5 text-white/40 text-[11px]">
          No active pipelines
        </div>
      </div>
    )
  }

  return (
    <div className="py-3 border-b border-white/[0.02] space-y-4">
      <div className="text-[10px] uppercase tracking-wide text-white/35">
        Watch Folder Status
      </div>

      {pipelines.map(([pKey, pHealth]) => (
        <div key={pKey} className="bg-[#121926]/50 border border-white/[0.05] rounded-xl overflow-hidden">
          <div className="bg-white/[0.02] px-4 py-3 border-b border-white/[0.05] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-[13px] font-bold text-white tracking-wide uppercase">
                WATCH {pKey}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  pHealth.status === 'SCANNING' ? 'bg-[var(--accent-400)] animate-pulse' :
                  pHealth.status === 'ERROR' ? 'bg-red-400' :
                  pHealth.status === 'IDLE' ? 'bg-green-400' : 'bg-gray-400'
                }`} />
                <span className={pHealth.status === 'ERROR' ? 'text-red-400' : 'text-white/70'}>
                  {pHealth.status}
                </span>
              </div>
            </div>
            
            <button
              onClick={() => scanWatchFolder(accountId, pKey)}
              disabled={isScanning}
              className={`h-[24px] px-3 rounded text-[10px] font-medium transition-colors ${
                isScanning
                  ? 'bg-white/5 text-white/30 cursor-not-allowed'
                  : 'bg-[var(--accent-500)]/10 text-[var(--accent-400)] hover:bg-[var(--accent-500)]/20 border border-[var(--accent-500)]/20'
              }`}
            >
              {isScanning ? 'Scanning...' : 'Scan Now'}
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/[0.02] rounded-lg p-2.5 border border-white/5">
                <div className="text-[9px] text-white/40 mb-1 uppercase tracking-wider">Folder</div>
                <div className="text-[11px] text-white/90 truncate font-mono" title={pHealth.watch_folder_path || '—'}>
                  {pHealth.watch_folder_path || '—'}
                </div>
              </div>

              <div className="bg-white/[0.02] rounded-lg p-2.5 border border-white/5">
                <div className="text-[9px] text-white/40 mb-1 uppercase tracking-wider">Last Scan</div>
                <div className="text-[11px] text-white/90 truncate">
                  {timeAgo(pHealth.last_scan)}
                </div>
              </div>

              <div className="bg-white/[0.02] rounded-lg p-2.5 border border-white/5">
                <div className="text-[9px] text-white/40 mb-1 uppercase tracking-wider">Next Scan</div>
                <div className="text-[11px] text-white/90 truncate">
                  {pHealth.status === 'SCANNING' ? 'Scanning...' : 'In 15s'}
                </div>
              </div>

              <div className="bg-white/[0.02] rounded-lg p-2.5 border border-white/5">
                <div className="text-[9px] text-white/40 mb-1 uppercase tracking-wider">Packages Found</div>
                <div className="text-[11px] text-[var(--accent-400)] truncate">
                  {pHealth.packages_found}
                </div>
              </div>

              <div className="bg-white/[0.02] rounded-lg p-2.5 border border-white/5">
                <div className="text-[9px] text-white/40 mb-1 uppercase tracking-wider">Imported Today</div>
                <div className="text-[11px] text-white/90 truncate">
                  {pHealth.today_intake}
                </div>
              </div>

              <div className="bg-white/[0.02] rounded-lg p-2.5 border border-white/5">
                <div className="text-[9px] text-white/40 mb-1 uppercase tracking-wider">Remaining Today</div>
                <div className="text-[11px] text-white/90 truncate">
                  {pHealth.remaining_today}
                </div>
              </div>

              <div className="bg-white/[0.02] rounded-lg p-2.5 border border-white/5">
                <div className="text-[9px] text-white/40 mb-1 uppercase tracking-wider">Daily Limit</div>
                <div className="text-[11px] text-white/90 truncate">
                  {pHealth.daily_limit}
                </div>
              </div>

              <div className="bg-white/[0.02] rounded-lg p-2.5 border border-white/5">
                <div className="text-[9px] text-white/40 mb-1 uppercase tracking-wider">Last Imported</div>
                <div className="text-[11px] text-white/90 truncate">
                  {timeAgo(pHealth.last_import)}
                </div>
              </div>

              <div className="bg-white/[0.02] rounded-lg p-2.5 border border-white/5 md:col-span-4">
                <div className="text-[9px] text-white/40 mb-1 uppercase tracking-wider">Last Error</div>
                <div className="text-[11px] text-red-300 truncate" title={pHealth.last_error || '—'}>
                  {pHealth.last_error || '—'}
                </div>
              </div>
            </div>

            {pHealth.execution_log && pHealth.execution_log.length > 0 && (
              <div className="mt-4">
                <div className="text-[10px] uppercase tracking-wide text-white/35 mb-2">Live Execution Log</div>
                <div className="bg-black/30 rounded-lg border border-white/[0.05] p-3 max-h-[120px] overflow-y-auto space-y-1.5 font-mono text-[10px]">
                  {pHealth.execution_log.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-white/30 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      <span className={`font-bold shrink-0 ${log.status === 'PASS' ? 'text-green-400' : 'text-red-400'}`}>[{log.status}]</span>
                      <span className="text-white/70">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

