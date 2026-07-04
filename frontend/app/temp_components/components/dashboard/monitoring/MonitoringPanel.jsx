export default function MonitoringPanel({ children }) {

  return (

    <div className="h-full bg-[#141821] border border-white/5 rounded-xl overflow-hidden flex flex-col">

      <div className="h-[56px] border-b border-white/5 px-5 flex items-center justify-between shrink-0">

        <div>

          <div className="text-[14px] font-semibold text-cyan-300">

            Upload Queue

          </div>

          <div className="text-[11px] text-white/35 mt-1">

            Realtime automation tasks

          </div>

        </div>

        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />

      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2">

        {children}

      </div>

    </div>

  )

}
