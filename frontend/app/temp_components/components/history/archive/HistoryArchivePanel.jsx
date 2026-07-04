export default function HistoryArchivePanel({ children }) {

  return (

    <div className="bg-[#141821] border border-white/5 rounded-xl overflow-hidden flex flex-col min-h-0">

      <div className="h-[58px] border-b border-white/5 px-5 flex items-center justify-between shrink-0">

        <div>

          <div className="text-[14px] font-semibold text-cyan-300">

            Upload History Archive

          </div>

          <div className="text-[11px] text-white/35 mt-1">

            Complete upload activity history

          </div>

        </div>

        <div className="flex items-center gap-2">

          <div className="px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-[10px] text-white/55">

            Search title, channel, mode...

          </div>

          <div className="px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-[10px] text-cyan-300 font-semibold">

            Timeline: This Month

          </div>

          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />

        </div>

      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 snap-y snap-mandatory scroll-smooth">

        {children}

      </div>

    </div>

  )

}
