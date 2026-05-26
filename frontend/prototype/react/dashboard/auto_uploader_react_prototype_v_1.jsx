import { useEffect, useState } from "react"
import axios from "axios"

export default function AUDashboardModule() {

  const [tasks, setTasks] = useState([])

  useEffect(() => {

    loadTasks()

    const interval = setInterval(() => {

      loadTasks()

    }, 3000)

    return () => clearInterval(interval)

  }, [])


  const loadTasks = async () => {

    try {

      const response = await axios.get(
        "http://127.0.0.1:8000/tasks"
      )

      setTasks(response.data)

    } catch (error) {

      console.error(error)
    }
  }


  return (

    <div className="h-screen w-screen bg-[#0f1115] text-white overflow-hidden flex">

      <div className="w-[72px] hover:w-[220px] transition-all duration-300 bg-[#151922] border-r border-white/5 flex flex-col py-4 px-3 gap-3 group overflow-hidden shrink-0">

        <div className="h-12 flex items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-bold text-sm shrink-0">
          AU
        </div>

        {['Dashboard', 'Upload Queue', 'History', 'Accounts', 'Settings'].map((item, i) => (

          <div
            key={item}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 cursor-pointer transition-all shrink-0 ${
              i === 0
                ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-300'
                : 'hover:bg-white/5 text-white/70'
            }`}
          >

            <div className="w-2 h-2 rounded-full bg-current shrink-0" />

            <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-200 text-sm font-medium">
              {item}
            </span>

          </div>

        ))}

      </div>

      <div className="flex-1 flex flex-col overflow-hidden">

        <div className="h-[72px] border-b border-white/5 bg-[#11141b] px-6 flex items-center justify-between shrink-0">

          <div>

            <div className="text-lg font-semibold tracking-wide text-cyan-300">
              DASHBOARD
            </div>

            <div className="text-xs text-white/40 mt-1">
              Realtime backend automation monitoring
            </div>

          </div>

        </div>

        <div className="flex-1 overflow-hidden p-4">

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

              {tasks.map((item, index) => (

                <div
                  key={index}
                  className="rounded-xl border border-white/5 bg-white/[0.025] p-3 hover:bg-white/[0.04] transition-all"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0 flex-1">

                      <div className="text-[14px] font-semibold leading-[1.4] text-white/92 tracking-[0.01em]">
                        {item.title}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-white/45 font-medium leading-relaxed">

                        <span>VIDEO ID:</span>

                        <span>{item.video_id}</span>

                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-white/45 font-medium leading-relaxed">

                        <span>PLATFORM:</span>

                        <span>{item.platform}</span>

                      </div>

                    </div>

                    <div className="px-2 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/15 text-[9px] font-semibold tracking-wide text-cyan-300 shrink-0">

                      {item.status}

                    </div>

                  </div>

                </div>

              ))}

            </div>

          </div>

        </div>

      </div>

    </div>

  )
}