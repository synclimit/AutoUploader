import { CheckCircle2, FolderDown, AlertTriangle } from 'lucide-react'

export default function ChannelSelectorCard({ channel, selected, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`p-5 rounded-[20px] border flex flex-col gap-4 cursor-pointer transition-all duration-200 group relative overflow-hidden ${
        selected 
          ? 'bg-gradient-to-br from-cyan-900/20 to-[#05080e]/60 backdrop-blur-2xl border-[var(--accent-500)]/40 shadow-[0_8px_32px_rgba(34,211,238,0.1)] -translate-y-[2px]' 
          : 'bg-[#05080e]/40 backdrop-blur-xl border-white/[0.06] hover:bg-[#080d16]/60 hover:border-[var(--accent-500)]/20 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:-translate-y-[2px]'
      }`}
    >
      {selected && (
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-transparent opacity-100 pointer-events-none"></div>
      )}

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)] ${
            selected 
              ? 'bg-[var(--accent-500)]/20 border border-[var(--accent-500)]/40 text-[var(--accent-400)] shadow-[0_0_20px_rgba(34,211,238,0.2)]'
              : 'bg-white/[0.03] border border-white/[0.05] text-white/50 group-hover:bg-[var(--accent-500)]/10 group-hover:text-cyan-200 group-hover:border-[var(--accent-500)]/20'
          }`}>
            {channel.name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <div className={`font-bold text-[16px] tracking-wide transition-colors duration-200 ${selected ? 'text-white drop-shadow-md' : 'text-white/80 group-hover:text-white'}`}>
              {channel.name}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 size={12} strokeWidth={3} className="text-green-400" />
              <span className="text-green-400/80 text-[11px] font-bold uppercase tracking-wider">Connected</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Import Folder Section */}
      <div className={`mt-2 pt-4 border-t transition-colors duration-200 ${selected ? 'border-[var(--accent-500)]/20' : 'border-white/[0.04] group-hover:border-white/[0.08]'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] font-medium">
            <FolderDown size={14} strokeWidth={2.5} className={selected ? 'text-[var(--accent-400)]' : 'text-white/40 group-hover:text-cyan-200/50'} />
            <span className={selected ? 'text-cyan-100' : 'text-white/40'}>Import Folder</span>
          </div>
          {channel.folder ? (
             <span className="text-[11px] font-mono text-white/60 truncate max-w-[150px]">{channel.folder}</span>
          ) : (
             <div className="flex items-center gap-1">
               <AlertTriangle size={10} className="text-amber-400" />
               <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Not Configured</span>
             </div>
          )}
        </div>
      </div>
    </div>
  )
}
