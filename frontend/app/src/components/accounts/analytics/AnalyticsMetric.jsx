import TooltipHelper from '../../common/TooltipHelper'

export default function AnalyticsMetric({ title, value, color }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#141821] px-4 py-1.5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.08em] text-white/35 font-medium">
          {title}
        </div>
        <TooltipHelper label="" tooltip={`Operational metric for ${title}`} />
      </div>

      <div className={`mt-2 text-[22px] font-semibold ${color}`}>

        {value}

      </div>

    </div>

  )

}
