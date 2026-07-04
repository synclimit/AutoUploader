export default function AnalyticsMetric({ title, value }) {

  return (

    <div className="rounded-xl border border-white/[0.03] bg-white/[0.02] px-3 py-2.5 flex flex-col justify-between min-h-[74px] snap-start">

      <div className="text-[9px] uppercase tracking-wide text-white/35">

        {title}

      </div>

      <div className="text-[12px] font-semibold text-cyan-300 mt-1.5 leading-relaxed tracking-[0.01em]">

        {value}

      </div>

    </div>

  )

}
