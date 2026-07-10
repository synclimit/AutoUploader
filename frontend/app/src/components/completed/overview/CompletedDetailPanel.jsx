import { useMemo } from 'react'
import { X, Clock, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useQueueStore } from '../../../store/upload/uploadStore'

export default function CompletedDetailPanel({ video, onClose }) {
  const { logs } = useQueueStore()

  // Build the timeline based on event logs
  const timelineEvents = useMemo(() => {
    if (!logs) return []
    
    // Simulate mapping log messages to [MODULE] [ACTION] [RESULT] based on known patterns
    return logs.map((log, index) => {
      let moduleName = 'SYSTEM'
      let action = log.message
      let result = 'INFO'
      
      if (log.status === 'FAILED') result = 'FAILED'
      else if (log.status === 'COMPLETED') result = 'SUCCESS'
      else if (log.status.includes('QUEUE')) result = 'PASS'
      
      if (log.message.includes('Watch Folder') || log.status === 'WATCHED') moduleName = 'WATCH FOLDER'
      else if (log.message.includes('Metadata')) moduleName = 'AI'
      else if (log.message.includes('Upload')) moduleName = 'UPLOAD'
      else if (log.status === 'QUEUED') moduleName = 'QUEUE'
      else if (log.status === 'REVIEW') moduleName = 'REVIEW'
      
      return {
        id: log.id || index,
        time: new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        module: moduleName,
        action: action,
        duration: '—', // Hard to calculate without next timestamp, mock for now or use diff
        result: result
      }
    })
  }, [logs])

  if (!video) return null

  return (
    <div className="absolute right-0 top-0 bottom-0 w-[450px] bg-[#05080e] border-l border-white/[0.05] shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-40 flex flex-col">
      <div className="h-[64px] shrink-0 border-b border-white/[0.05] flex items-center justify-between px-5">
        <h2 className="text-[16px] font-bold text-white">Detail Panel</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              import('../../../store/app/appStore').then(module => {
                const store = module.useAppStore.getState();
                if (video?.account_id) {
                  store.setJournalContext({ channelId: video.account_id });
                }
                store.setActiveModule('Journal');
              });
            }}
            className="h-8 px-3 rounded-[8px] bg-white/[0.05] hover:bg-white/[0.1] text-white/70 hover:text-white transition-colors text-[12px] font-medium flex items-center gap-2"
          >
            Upload Journal
          </button>
          <button onClick={onClose} className="w-8 h-8 rounded-[8px] flex items-center justify-center hover:bg-white/[0.05] text-white/50 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
        
        {/* Accordion 1: Video */}
        <div className="border border-white/[0.05] rounded-[12px] bg-white/[0.02] overflow-hidden">
          <div className="px-4 py-3 bg-white/[0.02] border-b border-white/[0.05] text-[13px] font-bold text-white">1 Video</div>
          <div className="p-4 flex flex-col gap-3">
            <div className="w-full aspect-video rounded-[8px] bg-black border border-white/[0.1] bg-cover bg-center" style={{backgroundImage: `url(${video.thumbnail_path || video.thumbnail})`}}></div>
            <div className="text-[13px] text-white/80 break-all">{video.title || video.video_path}</div>
          </div>
        </div>

        {/* Accordion 2: Channel */}
        <div className="border border-white/[0.05] rounded-[12px] bg-white/[0.02] overflow-hidden">
          <div className="px-4 py-3 bg-white/[0.02] border-b border-white/[0.05] text-[13px] font-bold text-white">2 Channel</div>
          <div className="p-4">
            <div className="text-[13px] text-[var(--accent-400)] font-bold">{video.channelName || 'Unknown'}</div>
          </div>
        </div>

        {/* Accordion 3: Metadata */}
        <div className="border border-white/[0.05] rounded-[12px] bg-white/[0.02] overflow-hidden">
          <div className="px-4 py-3 bg-white/[0.02] border-b border-white/[0.05] text-[13px] font-bold text-white">3 Metadata</div>
          <div className="p-4 flex flex-col gap-2 text-[12px]">
            <div className="flex justify-between"><span className="text-white/40">Size</span><span className="text-white/90">{video.sizeText}</span></div>
            <div className="flex justify-between"><span className="text-white/40">Duration</span><span className="text-white/90">{video.duration}</span></div>
            <div className="flex justify-between"><span className="text-white/40">Resolution</span><span className="text-white/90">{video.resolutionText}</span></div>
            <div className="flex justify-between"><span className="text-white/40">Bitrate</span><span className="text-white/90">{video.bitrateText}</span></div>
          </div>
        </div>

        {/* Accordion 4: Timeline */}
        <div className="border border-white/[0.05] rounded-[12px] bg-white/[0.02] overflow-hidden">
          <div className="px-4 py-3 bg-white/[0.02] border-b border-white/[0.05] text-[13px] font-bold text-white">4 Timeline</div>
          <div className="p-4 flex flex-col gap-4">
            {timelineEvents.map((evt, idx) => (
              <div key={evt.id} className="flex flex-col relative pl-6">
                {idx !== timelineEvents.length - 1 && (
                  <div className="absolute left-[7px] top-[20px] bottom-[-20px] w-[1px] bg-white/[0.1]"></div>
                )}
                <div className="absolute left-0 top-[2px] w-4 h-4 rounded-full flex items-center justify-center bg-[#05080e] border border-white/[0.2]">
                  {evt.result === 'SUCCESS' || evt.result === 'PASS' ? <CheckCircle size={10} className="text-green-400" /> : 
                   evt.result === 'FAILED' ? <AlertCircle size={10} className="text-red-400" /> : 
                   <Info size={10} className="text-[var(--accent-400)]" />}
                </div>
                
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-mono text-white/50">{evt.time}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] bg-white/[0.05] text-white/80 tracking-wider uppercase">{evt.module}</span>
                </div>
                
                <div className="text-[12px] text-white/90 mb-1">{evt.action}</div>
                
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="text-white/40">{evt.duration}</span>
                  <span className={`font-bold ${evt.result === 'SUCCESS' || evt.result === 'PASS' ? 'text-green-400' : evt.result === 'FAILED' ? 'text-red-400' : 'text-[var(--accent-400)]'}`}>
                    {evt.result}
                  </span>
                </div>
              </div>
            ))}
            {timelineEvents.length === 0 && (
              <div className="text-[12px] text-white/40 text-center py-2">No timeline events available</div>
            )}
          </div>
        </div>

        {/* Accordion 5: Logs */}
        <div className="border border-white/[0.05] rounded-[12px] bg-white/[0.02] overflow-hidden">
          <div className="px-4 py-3 bg-white/[0.02] border-b border-white/[0.05] text-[13px] font-bold text-white">5 Logs</div>
          <div className="p-4 max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col gap-2">
            {logs?.map((log, idx) => (
              <div key={idx} className="flex flex-col gap-1 border-b border-white/[0.02] pb-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className={log.status === 'FAILED' ? 'text-red-400 font-bold' : 'text-[var(--accent-400)] font-bold'}>{log.status}</span>
                  <span className="text-white/30">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <div className="text-[11px] text-white/60">{log.message}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
