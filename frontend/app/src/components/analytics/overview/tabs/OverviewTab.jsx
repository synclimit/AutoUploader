import { useState } from 'react'
import { Users, Eye, Clock, Video, UploadCloud, Server, Shield, PlayCircle, Activity, CheckCircle2 } from 'lucide-react'
import { useAnalyticsStore } from '../../../../store/analytics/analyticsStore'
import Select from '../../../common/Select'

export default function OverviewTab({ channel }) {
  const { overviewData, operationsData } = useAnalyticsStore()
  const data = overviewData[channel?.id] || {}
  const ops = operationsData[channel?.id] || {
    queue_items: 0,
    upload_success: 100,
    recent_activity: [],
    system_health: { score: 0, automation: 'Unknown', oauth: 'Unknown', watch_folder: 'Unknown', scheduler: 'Unknown', ai_engine: 'Unknown' }
  }
  
  const [timeRange, setTimeRange] = useState('7d')
  const [logFilter, setLogFilter] = useState('ALL')

  const periodOptions = [
    { val: '7d', label: 'Last 7 Days' },
    { val: '28d', label: 'Last 28 Days' },
    { val: '90d', label: 'Last 90 Days' },
    { val: 'all', label: 'All Time' }
  ]

  const logOptions = [
    { val: 'ALL', label: 'All Levels' },
    { val: 'FAIL', label: 'FAIL Only' },
    { val: 'PASS', label: 'PASS Only' },
    { val: 'INFO', label: 'INFO Only' }
  ]
  
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0';
    if (minutes >= 60) return (minutes / 60).toFixed(1) + 'H';
    if (minutes >= 1000) return (minutes / 1000).toFixed(1) + 'K';
    return minutes.toString();
  };

  const StatCard = ({ title, value, icon: Icon, trend, color, bg }) => (
    <div className="bg-[#080e1a]/80 backdrop-blur-md border border-[var(--accent-500)]/15 hover:border-[var(--accent-500)]/40 transition-all duration-300 neon-interactive rounded-[16px] p-4 flex items-center gap-4 hover:bg-[#0d1624] group relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] rounded-full blur-2xl group-hover:bg-[var(--accent-500)]/[0.05] transition-colors pointer-events-none" />
      <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${bg} border border-[var(--accent-500)]/20 shadow-inner group-hover:scale-110 transition-transform`}>
        <Icon size={18} className={color} />
      </div>
      <div className="flex flex-col min-w-0 relative z-10">
        <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider truncate mb-0.5">{title}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-[18px] font-black text-white leading-none drop-shadow-md">{value}</span>
          {trend && <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">{trend}</span>}
        </div>
      </div>
    </div>
  )

  const StatusItem = ({ label, status, healthy }) => (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-[8px] hover:bg-white/[0.02] transition-colors border-b border-[var(--accent-500)]/10 last:border-0 relative z-10">
      <span className="text-[12px] font-bold text-white/60">{label}</span>
      <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${healthy ? 'bg-green-500/10 text-green-400 border border-green-500/20 shadow-sm' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm'}`}>{status}</span>
    </div>
  )

  const LogItem = ({ time, level, module, message }) => {
    let colorClass = 'text-white/40'
    let bgClass = 'bg-white/5'
    if (level === 'PASS') { colorClass = 'text-green-400'; bgClass = 'bg-green-500/10 border-green-500/20' }
    if (level === 'INFO') { colorClass = 'text-blue-400'; bgClass = 'bg-blue-500/10 border-blue-500/20' }
    if (level === 'FAIL') { colorClass = 'text-red-400'; bgClass = 'bg-red-500/10 border-red-500/20' }
    if (level === 'WARNING') { colorClass = 'text-amber-400'; bgClass = 'bg-amber-500/10 border-amber-500/20' }
    
    return (
      <div className="flex items-center gap-3 py-2 px-3 hover:bg-white/5 rounded-[8px] cursor-default border-l-2 border-transparent hover:border-[var(--accent-400)] transition-all">
        <span className="w-[45px] shrink-0 text-[11px] font-bold text-white/40 font-mono">{time}</span>
        <span className={`w-[48px] shrink-0 text-[9px] font-black uppercase flex items-center justify-center rounded py-0.5 border ${colorClass} ${bgClass}`}>{level}</span>
        <span className="w-[95px] shrink-0 text-[11px] font-bold text-white/60 uppercase truncate">{module}</span>
        <span className="text-[12px] font-medium text-white/90 truncate">{message}</span>
      </div>
    )
  }

  const filteredActivity = ops.recent_activity.filter(log => {
    if (logFilter === 'ALL') return true;
    return log.level === logFilter;
  });

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* YouTube Metrics */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[12px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2"><PlayCircle size={14} className="text-red-500"/> YouTube Performance</h2>
          <Select value={timeRange} onChange={setTimeRange} options={periodOptions} className="w-[150px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Subscribers" value={formatNumber(data?.channel?.subscribers ?? channel?.subscribers)} trend="+0" icon={Users} color="text-red-400" bg="bg-red-500/10" />
          <StatCard title="Total Views" value={formatNumber(data?.channel?.views ?? channel?.views)} trend="+0" icon={Eye} color="text-blue-400" bg="bg-blue-500/10" />
          <StatCard title="Watch Time" value={formatDuration(data?.analytics?.watchTime || data?.analytics?.watch_time_minutes)} trend="+0%" icon={Clock} color="text-purple-400" bg="bg-purple-500/10" />
          <StatCard title="Total Videos" value={formatNumber(data?.channel?.videos ?? channel?.videos)} icon={Video} color="text-emerald-400" bg="bg-emerald-500/10" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* AutoUploader Ops */}
        <div className="col-span-2 flex flex-col gap-3">
          <h2 className="text-[12px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2"><Server size={14} className="text-cyan-500"/> Operations</h2>
          <div className="grid grid-cols-2 gap-4 mb-1">
            <StatCard title="Queue Items" value={`${ops.queue_items} Waiting`} icon={UploadCloud} color="text-[var(--accent-400)]" bg="bg-[var(--accent-500)]/10" />
            <StatCard title="Upload Success" value={`${ops.upload_success}%`} icon={CheckCircle2} color="text-green-400" bg="bg-green-500/10" />
          </div>
          <div className="bg-[#080e1a]/60 backdrop-blur-md border border-[var(--accent-500)]/15 hover:border-[var(--accent-500)]/30 transition-all duration-300 neon-interactive rounded-[16px] p-5 flex flex-col flex-1 min-h-[250px] shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden group hover:border-[var(--accent-500)]/30 transition-all">
            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 blur-[20px] rounded-full pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="text-[13px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity size={14} className="text-[var(--accent-400)]"/> Recent Activity
              </h3>
              <Select value={logFilter} onChange={setLogFilter} options={logOptions} className="w-[140px]" />
            </div>
            <div className="flex flex-col bg-[#020408]/90 rounded-[10px] p-2 border border-[var(--accent-500)]/15 overflow-y-auto custom-scrollbar flex-1 relative z-10 shadow-inner">
              {filteredActivity.length > 0 ? filteredActivity.map((log, i) => (
                <LogItem key={i} time={log.time} level={log.level} module={log.module} message={log.message} />
              )) : (
                <div className="text-[12px] text-white/40 italic p-6 text-center">No matching activity logs</div>
              )}
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="flex flex-col gap-3">
          <h2 className="text-[12px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2"><Shield size={14} className="text-green-500"/> System Health</h2>
          <div className="bg-[#080e1a]/60 backdrop-blur-md border border-[var(--accent-500)]/15 hover:border-[var(--accent-500)]/30 transition-all duration-300 neon-interactive rounded-[16px] p-5 flex flex-col flex-1 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden group hover:border-green-500/30 transition-all">
            <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 blur-[30px] rounded-full pointer-events-none group-hover:bg-green-500/10 transition-colors" />
            
            <div className="flex items-center gap-5 mb-5 pb-5 border-b border-[var(--accent-500)]/15 relative z-10">
              <div className={`w-16 h-16 rounded-full border-[4px] flex items-center justify-center relative shadow-lg ${ops.system_health.score > 80 ? 'border-green-500/20 bg-green-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
                <div className={`absolute inset-0 rounded-full border-[4px] border-t-transparent animate-spin duration-3000 ${ops.system_health.score > 80 ? 'border-green-400' : 'border-amber-400'}`}></div>
                <div className="flex flex-col items-center">
                  <span className="text-[18px] font-black text-white leading-none">{ops.system_health.score}<span className="text-[10px] text-white/50">%</span></span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-white flex items-center gap-1.5">
                  {ops.system_health.score > 80 ? 'System Healthy' : 'System Degraded'}
                  {ops.system_health.score > 80 && <CheckCircle2 size={14} className="text-green-400" />}
                </span>
                <span className="text-[11px] font-bold text-white/50 mt-0.5">All services running normally</span>
              </div>
            </div>
            
            <div className="flex flex-col flex-1 gap-1 relative z-10">
              <StatusItem label="Automation Status" status={ops.system_health.automation} healthy={ops.system_health.automation === 'Active'} />
              <StatusItem label="OAuth Token" status={ops.system_health.oauth} healthy={ops.system_health.oauth === 'Valid'} />
              <StatusItem label="Watch Folder" status={ops.system_health.watch_folder} healthy={ops.system_health.watch_folder === 'Connected'} />
              <StatusItem label="Scheduler" status={ops.system_health.scheduler} healthy={ops.system_health.scheduler === 'Ready'} />
              <StatusItem label="AI Engine" status={ops.system_health.ai_engine} healthy={ops.system_health.ai_engine === 'Ready'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

