import { Activity, RefreshCw, UploadCloud, Bot, Server } from 'lucide-react'

export default function RuntimeWidgets({ engine }) {
  const Widget = ({ title, state, icon: Icon, colorClass, borderClass, bgClass, isPulsing = false }) => (
    <div className={`p-3 rounded-[12px] border flex items-center justify-between transition-all ${bgClass} ${borderClass} hover:opacity-90`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center bg-[#020408] border border-white/5`}>
          <Icon size={14} className={`${colorClass} ${isPulsing ? 'animate-pulse' : ''}`} />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 leading-none mb-1">{title}</span>
          <span className={`text-[12px] font-bold ${colorClass} leading-none tracking-wide`}>{state}</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-3 shrink-0">
      <h2 className="text-[14px] font-bold text-white tracking-wide">Live Runtime</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <Widget 
          title="Watch Long" 
          state="Scanning Folder..." 
          icon={Activity} 
          colorClass="text-[var(--accent-400)]" 
          bgClass="bg-[var(--accent-500)]/5" 
          borderClass="border-[var(--accent-500)]/10" 
          isPulsing={true}
        />
        <Widget 
          title="Watch Shorts" 
          state="Idle" 
          icon={Activity} 
          colorClass="text-white/50" 
          bgClass="bg-white/[0.02]" 
          borderClass="border-white/[0.05]" 
        />
        <Widget 
          title="Scheduler" 
          state="Next Run 14:20" 
          icon={RefreshCw} 
          colorClass="text-blue-400" 
          bgClass="bg-blue-500/5" 
          borderClass="border-blue-500/10" 
        />
        <Widget 
          title="Uploader" 
          state="Uploading 2 Tasks" 
          icon={UploadCloud} 
          colorClass="text-purple-400" 
          bgClass="bg-purple-500/5" 
          borderClass="border-purple-500/10" 
          isPulsing={true}
        />
        <Widget 
          title="AI Metadata" 
          state="Waiting" 
          icon={Bot} 
          colorClass="text-amber-400" 
          bgClass="bg-amber-500/5" 
          borderClass="border-amber-500/10" 
        />
        <Widget 
          title="Queue" 
          state="42 Waiting" 
          icon={Server} 
          colorClass="text-green-400" 
          bgClass="bg-green-500/5" 
          borderClass="border-green-500/10" 
        />
      </div>
    </div>
  )
}
