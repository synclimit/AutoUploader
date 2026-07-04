export default function HistoryLogsPanel({ children }) {

  return (

    <div className="bg-[#141821] border border-white/5 rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">

      <div className="h-[52px] border-b border-white/5 px-4 flex items-center justify-between shrink-0">

        <div>

          <div className="text-[12px] font-semibold text-orange-300">

            History Logs

          </div>

          <div className="text-[9px] text-white/35 mt-1">

            Archive synchronization logs

          </div>

        </div>

        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />

      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 text-[8px] text-white/65 font-mono snap-y snap-mandatory scroll-smooth overflow-x-hidden">

        {children}

      </div>

    </div>

  )

}
