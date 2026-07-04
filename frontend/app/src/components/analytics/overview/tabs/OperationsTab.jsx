import { Activity, PlayCircle, RefreshCw, AlertCircle, FileWarning, Zap, Server, Settings2, Loader2, CheckCircle2, Filter } from 'lucide-react'
import { useState, useEffect } from 'react'
import Select from '../../../common/Select'

export default function OperationsTab({ channel }) {
  const [data, setData] = useState({
    queue: 0,
    review: 0,
    today: 0,
    errors: 0,
    retry: 0,
    duplicates: 0,
    importing: 0,
    uploaderStatus: 'Idle',
    currentOpTitle: 'System Idle',
    currentOpDetail: 'Waiting for new packages...',
    pipelineWatch: 'Idle',
    pipelineAI: 'Idle',
    pipelineSched: 'Idle',
    events: []
  });
  
  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL')

  const eventOptions = [
    { val: 'ALL', label: 'All Event Types' },
    { val: 'error', label: 'Errors Only' },
    { val: 'warning', label: 'Warnings Only' },
    { val: 'success', label: 'Success Only' },
    { val: 'info', label: 'Info Only' }
  ]

  useEffect(() => {
    if (!channel || !channel.id) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [opsRes, queueRes, logsRes] = await Promise.all([
          fetch(`/api/v1/analytics/operations/${channel.id}`).catch(()=>null),
          fetch(`/api/v1/queue?account_id=${channel.id}`).catch(()=>null),
          fetch(`/api/v1/system/logs?limit=15`).catch(()=>null)
        ]);

        const ops = opsRes?.ok ? await opsRes.json() : null;
        const queueTasks = queueRes?.ok ? await queueRes.json() : [];
        const logs = logsRes?.ok ? await logsRes.json() : null;

        if (isMounted) {
          const sysHealth = ops?.data?.system_health || {};
          const tasks = Array.isArray(queueTasks) ? queueTasks : [];
          
          let queueCount = 0;
          let reviewCount = 0;
          let errorCount = 0;
          let retryCount = 0;

          tasks.forEach(t => {
            if (t.status === 'QUEUED' || t.status === 'WATCHED' || t.status === 'PROCESSING') queueCount++;
            if (t.upload_mode === 'Waiting For Approval') reviewCount++;
            if (t.status === 'FAILED' || t.status === 'ERROR') errorCount++;
            if (t.retry_count > 0) retryCount++;
          });

          const logEvents = (logs?.data || []).map(log => {
            const statusUpper = (log.status || '').toUpperCase();
            let type = 'info';
            if (statusUpper.includes('FAIL') || statusUpper.includes('ERROR')) type = 'error';
            else if (statusUpper.includes('SUCCESS') || statusUpper.includes('COMPLETED')) type = 'success';
            else if (statusUpper.includes('WARN')) type = 'warning';

            return {
              id: log.id || Math.random().toString(),
              time: new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              title: log.status || 'SYSTEM EVENT',
              detail: log.message,
              type
            };
          });

          setData({
            queue: queueCount || ops?.data?.queue_items || 0,
            review: reviewCount,
            today: Math.floor((ops?.data?.upload_success || 0) / 10),
            errors: errorCount,
            retry: retryCount,
            duplicates: 0,
            importing: 0,
            uploaderStatus: sysHealth.automation === 'Active' ? 'Running' : 'Idle',
            currentOpTitle: sysHealth.automation === 'Active' ? 'Automated Processing' : 'System Standby',
            currentOpDetail: sysHealth.automation === 'Active' ? 'Watch folder scanning and uploader active' : 'All queues processed. Waiting for triggers.',
            pipelineWatch: sysHealth.watch_folder === 'Connected' ? 'Running' : 'Offline',
            pipelineAI: sysHealth.ai_engine === 'Ready' ? 'Running' : 'Offline',
            pipelineSched: sysHealth.scheduler === 'Ready' ? 'Running' : 'Offline',
            events: logEvents,
            isRunning: sysHealth.automation === 'Active'
          });
        }
      } catch (error) {
        console.error("Failed to fetch operations data:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10s

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [channel]);

  const filteredEvents = data.events.filter(ev => {
    if (eventTypeFilter === 'ALL') return true;
    return ev.type === eventTypeFilter;
  });

  const Stat = ({ label, value, color }) => (
    <div className="flex flex-col gap-1.5 p-3 rounded-xl hover:bg-white/[0.04] transition-all duration-300 border border-transparent hover:border-white/[0.08] group">
      <span className="text-[10px] uppercase font-extrabold tracking-wider text-white/50 group-hover:text-white/80 transition-colors">{label}</span>
      <span className={`text-2xl font-black transition-all duration-300 ${color || 'text-white'} drop-shadow-sm`}>{value}</span>
    </div>
  )

  const Log = ({ time, title, detail, type }) => (
    <div className="flex items-start gap-4 p-3.5 hover:bg-white/[0.04] transition-all rounded-[10px] cursor-pointer border border-transparent hover:border-[var(--accent-400)]/40 group">
      <div className="w-[60px] text-[11px] font-bold text-white/50 pt-0.5 shrink-0 font-mono">{time}</div>
      <div className="flex-1 flex flex-col">
        <span className={`text-[13px] font-extrabold flex items-center gap-2 ${
          type === 'error' ? 'text-red-400' :
          type === 'warning' ? 'text-amber-400' :
          type === 'success' ? 'text-green-400' : 'text-white/90'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            type === 'error' ? 'bg-red-500 shadow-sm' :
            type === 'warning' ? 'bg-amber-500 shadow-sm' :
            type === 'success' ? 'bg-green-500 shadow-sm' : 'bg-blue-500'
          }`} />
          {title}
        </span>
        <span className="text-[12px] text-white/60 mt-0.5 group-hover:text-white/90 transition-colors">{detail}</span>
      </div>
    </div>
  )

  if (loading && data.events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 mt-4">
        <Loader2 className="w-8 h-8 text-white/30 animate-spin mb-4" />
        <span className="text-white/50 font-medium">Loading operations data...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 mt-4 h-[calc(100vh-200px)] min-h-0 pb-10">
      
      {/* Top Bar Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 bg-[#080e1a]/60 backdrop-blur-md border border-white/[0.08] hover:border-[var(--accent-500)]/30 transition-all duration-300 neon-interactive rounded-[16px] p-5 shrink-0">
        <Stat label="Queue" value={data.queue} color="text-amber-400" />
        <Stat label="Review" value={data.review} color="text-blue-400" />
        <Stat label="Today" value={data.today} color="text-green-400" />
        <Stat label="Errors" value={data.errors} color={data.errors > 0 ? "text-red-400" : "text-white/20"} />
        <Stat label="Retry" value={data.retry} color={data.retry > 0 ? "text-amber-400" : "text-white/20"} />
        <Stat label="Duplicates" value={data.duplicates} color="text-white/20" />
        <Stat label="Importing" value={data.importing} color="text-white/20" />
        <Stat label="Uploader" value={data.uploaderStatus} color={data.uploaderStatus === 'Running' ? "text-[var(--accent-400)]" : "text-white/40"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        
        {/* Pipeline & Live Status */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-[#080e1a]/60 backdrop-blur-md border border-white/[0.08] hover:border-[var(--accent-500)]/30 transition-all duration-300 neon-interactive rounded-[16px] p-5 flex flex-col gap-4 h-1/2">
            <h3 className="text-[13px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2"><Activity size={14} className="text-[var(--accent-400)]"/> Current Operation</h3>
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                data.isRunning ? 'bg-[var(--accent-500)]/10 border border-[var(--accent-500)]/20' : 'bg-white/5 border border-white/10'
              }`}>
                {data.isRunning ? (
                  <RefreshCw size={24} className="text-[var(--accent-400)] animate-spin" />
                ) : (
                  <CheckCircle2 size={24} className="text-white/40" />
                )}
              </div>
              <span className="text-[16px] font-bold text-white mb-1">{data.currentOpTitle}</span>
              <span className="text-[12px] text-white/50">{data.currentOpDetail}</span>
            </div>
          </div>
          
          <div className="bg-[#080e1a]/60 backdrop-blur-md border border-white/[0.08] hover:border-[var(--accent-500)]/30 transition-all duration-300 neon-interactive rounded-[16px] p-5 flex flex-col gap-4 h-1/2">
            <h3 className="text-[13px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2"><Settings2 size={14} className="text-purple-400"/> Pipeline Status</h3>
            <div className="flex-1 flex flex-col justify-center gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-white/70">Watch Folder Engine</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  data.pipelineWatch === 'Running' ? 'bg-green-500/10 text-green-400' : 'bg-white/10 text-white/40'
                }`}>{data.pipelineWatch}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-white/70">AI Context Builder</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  data.pipelineAI === 'Running' ? 'bg-blue-500/10 text-blue-400' : 'bg-white/10 text-white/40'
                }`}>{data.pipelineAI}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-white/70">Scheduler Engine</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  data.pipelineSched === 'Running' ? 'bg-green-500/10 text-green-400' : 'bg-white/10 text-white/40'
                }`}>{data.pipelineSched}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Event Stream */}
        <div className="lg:col-span-2 bg-[#080e1a]/60 backdrop-blur-md border border-white/[0.08] hover:border-[var(--accent-500)]/30 transition-all duration-300 neon-interactive rounded-[16px] p-5 flex flex-col h-full overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-[30px] rounded-full pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-4 shrink-0 relative z-10">
            <h3 className="text-[13px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Server size={14} className="text-[var(--accent-400)]"/> Live Event Stream
            </h3>
            <div className="flex items-center gap-3">
              <Select value={eventTypeFilter} onChange={setEventTypeFilter} options={eventOptions} className="w-[150px]" />
              <div className="flex items-center gap-2 text-[10px] font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20 uppercase tracking-wider">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Live
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative z-10 bg-[#020408]/90 rounded-[10px] p-2 border border-white/[0.05] shadow-inner">
            {filteredEvents.length > 0 ? filteredEvents.map(event => (
              <Log key={event.id} time={event.time} title={event.title} detail={event.detail} type={event.type} />
            )) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/40 text-xs italic">
                No recent execution events match the selected filter.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

