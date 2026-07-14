import { Terminal } from 'lucide-react'

export default function RecentActivity() {
  const Log = ({ time, level, module, message }) => {
    let colorClass = 'text-white/40'
    let bgClass = 'bg-white/5'
    
    if (level === 'PASS') { colorClass = 'text-green-400'; bgClass = 'bg-green-500/10' }
    if (level === 'INFO') { colorClass = 'text-blue-400'; bgClass = 'bg-blue-500/10' }
    if (level === 'WARNING') { colorClass = 'text-amber-400'; bgClass = 'bg-amber-500/10' }
    if (level === 'FAIL') { colorClass = 'text-red-400'; bgClass = 'bg-red-500/10' }

    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-1.5 px-2 hover:bg-white/5 rounded-[6px] transition-colors border-l-2 border-transparent hover:border-white/10 group cursor-default">
        <div className="w-[45px] text-[11px] font-bold text-white/30 font-mono tracking-wider shrink-0">{time}</div>
        <div className={`w-[50px] shrink-0 text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded flex items-center justify-center ${colorClass} ${bgClass}`}>
          {level}
        </div>
        <div className="w-[100px] shrink-0 text-[11px] font-bold text-white/50 uppercase tracking-widest truncate">{module}</div>
        <div className="flex-1 text-[12px] font-medium text-white/90 truncate group-hover:text-white transition-colors">{message}</div>
      </div>
    )
  }

  return (
    <div className="bg-[#05080e]/60 backdrop-blur-2xl border border-white/[0.08] rounded-[12px] p-4 flex flex-col shrink-0">
      <div className="flex items-center gap-2 mb-4">
        <Terminal size={14} className="text-white/30" />
        <h3 className="text-[14px] font-bold text-white">Recent Activity</h3>
      </div>
      
      <div className="flex flex-col bg-[#020408] rounded-[8px] p-3 border border-white/[0.05] shadow-inner font-mono max-h-[250px] overflow-y-auto custom-scrollbar">
        <Log time="14:22" level="FAIL" module="UPLOAD" message="OAuth Token Expired for Zidny Life" />
        <Log time="14:20" level="WARNING" module="YOUTUBE" message="Quota Near Limit (92%)" />
        <Log time="14:17" level="PASS" module="UPLOAD" message="Video Uploaded Successfully" />
        <Log time="14:15" level="INFO" module="AI" message="Metadata Generation Started" />
        <Log time="14:12" level="PASS" module="WATCH LONG" message="Package Imported: Rain.mp4" />
        <Log time="14:05" level="PASS" module="SCHEDULER" message="Checked upcoming schedule" />
        <Log time="14:00" level="INFO" module="SYSTEM" message="Raynz PitStop Agent Started" />
      </div>
    </div>
  )
}
