export default function AnalyticsPanel({ children }) {

  return (

    <div className="bg-[#141821] border border-white/5 rounded-xl overflow-hidden flex flex-col h-[42%] min-h-[240px]">

      <div className="h-[52px] border-b border-white/5 px-4 flex items-center justify-between shrink-0">

        <div>

          <div className="text-[12px] font-semibold text-purple-300">

            History Analytics

          </div>

          <div className="text-[9px] text-white/35 mt-1">

            Upload performance summary

          </div>

        </div>

        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />

      </div>

      <div className="flex-1 overflow-y-auto p-2.5 grid grid-cols-2 gap-2 snap-y snap-mandatory scroll-smooth">

        {children}

      </div>

    </div>

  )

}
