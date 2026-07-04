const queue = [

  {
    title: 'DJ TABOLA BALE X CALON MANTU IDAMAN',
    status: 'FAILED',
    progress: 0,
    retry: '2/5',
    eta: '2h 14m',
    mode: 'MF MODE 3',
    meta: 'AI',
    channel: 'DJ Channel A',
    schedule: 'Retry in 10m',
    warning: true,
  },

  {
    title: 'DJ TABOLA BALE X CALON MANTU IDAMAN',
    status: 'SCANNING',
    progress: 20,
    retry: '0/5',
    eta: '14m',
    mode: 'MF MODE 1',
    meta: 'TEMPLATE',
    channel: 'DJ Channel A',
    schedule: 'Scanning folder...',
    warning: false,
  },

]


const statusColor = {

  FAILED: 'bg-red-400',

  SCANNING: 'bg-blue-400',

}


export default function QueuePanel() {

  return (

    <div className="flex-1 min-w-0 bg-[#101722] border border-white/[0.05] rounded-2xl overflow-hidden flex flex-col">

      <div className="h-[72px] border-b border-white/[0.04] px-4 flex items-center justify-between shrink-0">

        <div>

          <div className="text-[18px] font-bold text-cyan-300">

            Upload Queue

          </div>

          <div className="text-xs text-white/35 mt-1">

            Active scheduled uploads

          </div>

        </div>

        <div className="flex items-center gap-3">

          <div className="w-[140px] h-[48px] rounded-xl bg-[#121926] border border-white/[0.05] px-3 flex flex-col justify-center">

            <div className="text-[9px] uppercase text-white/30">

              Bulk Auto

            </div>

            <div className="text-lg font-bold leading-none mt-1">

              OFF

            </div>

          </div>

          <button className="h-[48px] px-5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm font-semibold hover:bg-cyan-500/20 transition-all">

            Scan Folder

          </button>

        </div>

      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">

        {queue.map((item, index) => (

          <div

            key={index}

            className={`rounded-2xl border p-3 transition-all ${
              index === 0
                ? 'border-cyan-500/30 bg-cyan-500/[0.04]'
                : 'border-white/[0.05] bg-white/[0.02]'
            }`}

          >

            <div className="flex gap-3">

              <div className="w-[72px] h-[72px] rounded-xl bg-[#232938] border border-white/[0.05] shrink-0 flex items-center justify-center text-white/15 text-2xl">

                ♪

              </div>

              <div className="flex-1 min-w-0">

                <div className="flex items-start justify-between gap-4">

                  <div className="min-w-0 flex-1">

                    <div className="text-[18px] leading-tight font-bold text-white break-words">

                      {item.title}

                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/45">

                      <span>{item.schedule}</span>

                      <span>•</span>

                      <span>{item.channel}</span>

                      <span>•</span>

                      <span className="text-cyan-300 font-semibold">

                        {item.mode}

                      </span>

                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">

                      <div className="flex items-center gap-1 text-cyan-300 font-semibold">

                        <div className="w-2 h-2 rounded-full bg-white/50" />

                        {item.mode}

                      </div>

                      <div className="text-purple-300 font-semibold">

                        {item.meta}

                      </div>

                    </div>

                    {item.warning && (

                      <div className="mt-3 inline-flex items-center px-3 py-1 rounded-lg border border-yellow-500/20 bg-yellow-500/10 text-yellow-300 text-[11px] font-medium">

                        Similar metadata detected

                      </div>

                    )}

                  </div>

                  <div className="shrink-0 text-right min-w-[90px]">

                    <div className="flex items-center justify-end gap-2">

                      <div
                        className={`w-2 h-2 rounded-full ${statusColor[item.status]}`}
                      />

                      <div className="text-sm font-bold">

                        {item.status}

                      </div>

                    </div>

                    <div className="mt-2 text-white/45 text-[11px]">

                      Retry {item.retry}

                    </div>

                    <div className="mt-1 text-cyan-300 font-semibold text-sm">

                      ETA {item.eta}

                    </div>

                  </div>

                </div>

                <div className="mt-3 h-[4px] bg-white/[0.05] rounded-full overflow-hidden">

                  <div

                    className="h-full bg-cyan-400 rounded-full"

                    style={{
                      width: `${item.progress}%`
                    }}

                  />

                </div>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>

  )

}