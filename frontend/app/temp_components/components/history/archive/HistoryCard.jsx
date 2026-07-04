import HistoryStatusBadge from './HistoryStatusBadge'


export default function HistoryCard({ item }) {

  return (

    <div className="rounded-xl border border-white/5 bg-white/[0.025] p-2.5 hover:bg-white/[0.04] transition-all snap-start">

      <div className="flex items-start gap-3">

        <div className="w-[74px] h-[74px] rounded-lg overflow-hidden border border-white/5 bg-[#202635] shrink-0">

          <div className="w-full h-full bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-transparent relative">

            <div className="absolute inset-0 bg-black/10" />

          </div>

        </div>

        <div className="flex-1 min-w-0">

          <div className="flex items-start justify-between gap-3">

            <div className="min-w-0">

              <div className="text-[12px] font-semibold text-white/92 leading-[1.45] tracking-[0.01em]">

                {item.title}

              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-white/45 font-medium">

                <div className="w-4 h-4 rounded-full bg-[#202635] border border-white/5" />

                <span>{item.channel}</span>

                <span>•</span>

                <span>{item.date}</span>

                <span>•</span>

                <span>{item.time}</span>

              </div>

            </div>

            <HistoryStatusBadge status={item.status} />

          </div>

          <div className="flex flex-col gap-2 mt-3">

            <div className="grid grid-cols-3 gap-2">

              <HistoryInfo
                label="Duration"
                value={item.duration}
              />

              <HistoryInfo
                label="Views"
                value={item.views}
              />

              <HistoryInfo
                label="Mode"
                value={item.mode}
              />

            </div>

            <div className="grid grid-cols-[1fr_auto] gap-2">

              <HistoryInfo
                label="Source"
                value={item.source}
                wide
              />

              <div className="rounded-lg border border-white/[0.03] bg-white/[0.02] px-3 py-2 flex flex-col justify-center min-w-[92px]">

                <div className="text-[9px] uppercase tracking-wide text-white/35">

                  Retry

                </div>

                <div className="text-[11px] text-orange-300 font-semibold mt-1 truncate">

                  {item.retry}

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

  )

}


function HistoryInfo({ label, value, wide }) {

  return (

    <div
      className={`rounded-lg border border-white/[0.03] bg-white/[0.02] px-2.5 py-2 ${wide ? 'min-w-0' : ''}`}
    >

      <div className="text-[9px] uppercase tracking-wide text-white/35">

        {label}

      </div>

      <div className="text-[10px] text-white/85 font-semibold mt-1 leading-relaxed truncate">

        {value}

      </div>

    </div>

  )

}
