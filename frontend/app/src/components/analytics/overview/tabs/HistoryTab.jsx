import { Terminal, Loader2, Filter } from 'lucide-react'
import { useState, useEffect } from 'react'
import Select from '../../../common/Select'

export default function HistoryTab({ channel }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [moduleFilter, setModuleFilter] = useState('ALL')
  const [levelFilter, setLevelFilter] = useState('ALL')

  const moduleOptions = [
    { val: 'ALL', label: 'All Modules' },
    { val: 'UPLOAD', label: 'UPLOAD Engine' },
    { val: 'AI', label: 'AI & Metadata' },
    { val: 'WATCH FOLDER', label: 'Watch Folder' },
    { val: 'QUEUE', label: 'Queue System' },
    { val: 'YOUTUBE', label: 'YouTube API' },
    { val: 'SYSTEM', label: 'System Core' }
  ]

  const levelOptions = [
    { val: 'ALL', label: 'All Levels' },
    { val: 'PASS', label: 'PASS Only' },
    { val: 'FAIL', label: 'FAIL Only' },
    { val: 'WARNING', label: 'WARN Only' },
    { val: 'INFO', label: 'INFO Only' }
  ]

  useEffect(() => {
    let isMounted = true;

    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/v1/system/logs?limit=100');
        if (!res.ok) throw new Error('Failed to fetch logs');
        const json = await res.json();
        
        if (isMounted && json.data) {
          const formattedLogs = json.data.map(log => {
            const statusUpper = (log.status || '').toUpperCase();
            let level = 'INFO';
            if (statusUpper.includes('FAIL') || statusUpper.includes('ERROR')) level = 'FAIL';
            else if (statusUpper.includes('SUCCESS') || statusUpper.includes('COMPLETED') || statusUpper.includes('PASS')) level = 'PASS';
            else if (statusUpper.includes('WARN')) level = 'WARNING';
            
            let moduleName = 'SYSTEM';
            if (statusUpper.includes('UPLOAD')) moduleName = 'UPLOAD';
            else if (statusUpper.includes('AI') || statusUpper.includes('METADATA')) moduleName = 'AI';
            else if (statusUpper.includes('WATCH') || statusUpper.includes('IMPORT')) moduleName = 'WATCH FOLDER';
            else if (statusUpper.includes('QUEUE')) moduleName = 'QUEUE';
            else if (statusUpper.includes('YOUTUBE') || statusUpper.includes('OAUTH')) moduleName = 'YOUTUBE';

            return {
              id: log.id || Math.random().toString(),
              time: new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              level,
              module: moduleName,
              message: log.message
            };
          });

          setLogs(formattedLogs);
        }
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const filteredLogs = logs.filter(log => {
    if (moduleFilter !== 'ALL' && log.module !== moduleFilter) return false;
    if (levelFilter !== 'ALL' && log.level !== levelFilter) return false;
    return true;
  });

  const Log = ({ time, level, module, message }) => {
    let colorClass = 'text-white/40'
    let bgClass = 'bg-white/5 border-white/10'
    
    if (level === 'PASS') { colorClass = 'text-green-400'; bgClass = 'bg-green-500/10 border-green-500/20 shadow-sm' }
    if (level === 'INFO') { colorClass = 'text-blue-400'; bgClass = 'bg-blue-500/10 border-blue-500/20' }
    if (level === 'WARNING') { colorClass = 'text-amber-400'; bgClass = 'bg-amber-500/10 border-amber-500/20 shadow-sm' }
    if (level === 'FAIL') { colorClass = 'text-red-400'; bgClass = 'bg-red-500/10 border-red-500/20 shadow-sm' }

    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-2 px-3.5 hover:bg-white/[0.04] rounded-[8px] transition-all border-l-[3px] border-transparent hover:border-[var(--accent-400)] group cursor-default">
        <div className="w-[65px] text-[11px] font-bold text-white/40 font-mono tracking-wider shrink-0">{time}</div>
        <div className={`w-[56px] shrink-0 text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded border flex items-center justify-center ${colorClass} ${bgClass}`}>
          {level}
        </div>
        <div className="w-[110px] shrink-0 text-[11px] font-bold text-white/60 uppercase tracking-widest truncate">{module}</div>
        <div className="flex-1 text-[13px] font-medium text-white/90 truncate group-hover:text-white transition-colors">{message}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-8 mt-2">
      <div className="bg-[#080e1a]/60 backdrop-blur-md border border-white/[0.08] hover:border-[var(--accent-500)]/30 transition-all duration-300 neon-interactive rounded-[16px] p-5 flex flex-col w-full h-full min-h-[550px] shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden group hover:border-white/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-500)]/5 blur-[30px] rounded-full pointer-events-none group-hover:bg-[var(--accent-500)]/10 transition-colors" />
        
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-white/[0.08] relative z-10">
          <h3 className="text-[14px] font-extrabold text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-500)]/10 border border-[var(--accent-500)]/20 flex items-center justify-center shadow-inner">
              <Terminal size={15} className="text-[var(--accent-400)]"/>
            </div>
            Operations & System Execution Log
          </h3>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-white/40 text-[11px] font-bold mr-1">
              <Filter size={12} /> Filter Logs:
            </div>
            <Select value={moduleFilter} onChange={setModuleFilter} options={moduleOptions} className="w-[160px]" />
            <Select value={levelFilter} onChange={setLevelFilter} options={levelOptions} className="w-[140px]" />
          </div>
        </div>
        
        <div className="flex flex-col bg-[#020408]/90 rounded-[10px] p-3 border border-white/[0.05] shadow-inner font-mono overflow-y-auto custom-scrollbar flex-1 relative z-10">
          
          {loading && logs.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#020408]/80 backdrop-blur-sm z-10">
              <Loader2 className="w-8 h-8 text-[var(--accent-400)] animate-spin mb-3" />
              <span className="text-white/60 text-xs font-medium">Synchronizing system logs...</span>
            </div>
          ) : null}

          {filteredLogs.length > 0 ? filteredLogs.map(log => (
            <Log key={log.id} time={log.time} level={log.level} module={log.module} message={log.message} />
          )) : (
            !loading && <div className="text-white/40 text-xs py-10 text-center italic">No system execution logs match the selected filter.</div>
          )}

        </div>
      </div>
    </div>
  )
}

