export default function MonitoringMetric({ item }) {

  return (

    <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3 hover:bg-white/[0.04] transition-all">

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

        <div className="px-2 py-1 rounded-md bg-[var(--accent-500)]/10 border border-[var(--accent-500)]/15 text-[9px] font-semibold tracking-wide text-[var(--accent-400)] shrink-0">

          {item.status}

        </div>

      </div>

    </div>

  )

}
