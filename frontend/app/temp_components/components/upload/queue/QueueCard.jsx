import QueueStatusBadge from './QueueStatusBadge'


const statusColor = {

  FAILED: 'bg-red-400',

  SCANNING: 'bg-blue-400',

}


export default function QueueCard({ item, isActive }) {

  return (

    <div

      className={`rounded-2xl border p-3 transition-all ${
        isActive
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

            <QueueStatusBadge

              status={item.status}

              colorClass={statusColor[item.status]}

              retry={item.retry}

              eta={item.eta}

            />

          </div>

          <div className="mt-3 h-[4px] bg-white/[0.05] rounded-full overflow-hidden">

            <div

              className="h-full bg-cyan-400 rounded-full"

              style={{ width: `${item.progress}%` }}

            />

          </div>

        </div>

      </div>

    </div>

  )

}
