import { useAppStore } from '../store/app/appStore'

export default function Sidebar() {

  const activeModule = useAppStore((s) => s.activeModule)
  const setActiveModule = useAppStore((s) => s.setActiveModule)

  const items = [
    'Dashboard',
    'Upload Queue',
    'History',
    'Accounts',
    'Settings',
  ]


  return (

    <div className="w-[86px] bg-[#0a0e15] border-r border-white/[0.04] flex flex-col items-center py-5">

      <div className="w-[54px] h-[54px] rounded-2xl border border-cyan-500/20 bg-cyan-500/10 flex items-center justify-center text-cyan-300 font-bold text-xl">

        AU

      </div>

      <div className="flex-1 mt-10 flex flex-col gap-6">

        {items.map((item) => {

          const isActive = activeModule === item

          return (

            <div
              key={item}
              onClick={() => setActiveModule(item)}
              className={`w-[54px] h-[54px] rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/15 border border-cyan-500/20 text-cyan-300'
                  : 'bg-white/[0.02] text-white/40 hover:bg-white/[0.05]'
              }`}
            >

              <div className="w-2 h-2 rounded-full bg-current" />

            </div>

          )

        })}

      </div>

    </div>

  )

}