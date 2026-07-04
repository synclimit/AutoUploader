export default function AccountsLogsPanel({ children }) {

  return (

    <div className="h-[104px] bg-[#12161e] border border-white/5 rounded-2xl overflow-hidden flex flex-col shrink-0">

      <div className="h-[34px] border-b border-white/5 px-4 flex items-center justify-between shrink-0">

        <div className="text-[11px] font-semibold text-orange-300 tracking-wide">

          Account Logs

        </div>

        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />

      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 text-[9px] text-white/60 font-mono scroll-smooth">

        {children}

      </div>

    </div>

  )

}
