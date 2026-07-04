export default function WorkspacePanel({ children }) {

  return (

    <div className="bg-[#141821] border border-white/5 rounded-2xl overflow-hidden flex flex-col min-h-0">

      <div className="h-[64px] border-b border-white/5 px-5 flex items-center justify-between shrink-0">

        <div>

          <div className="text-sm font-semibold text-cyan-300">

            Channel Accounts

          </div>

          <div className="text-[11px] text-white/40 mt-1">

            Connected upload channels & workspace profiles

          </div>

        </div>

        <button className="h-[38px] px-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm font-medium hover:bg-cyan-500/20 transition-all">

          Add Account

        </button>

      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 snap-y snap-mandatory scroll-smooth">

        {children}

      </div>

    </div>

  )

}
