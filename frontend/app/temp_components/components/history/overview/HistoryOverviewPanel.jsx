import HistoryArchivePanel from "../archive/HistoryArchivePanel"
import HistoryCard from "../archive/HistoryCard"
import AnalyticsPanel from "../analytics/AnalyticsPanel"
import AnalyticsMetric from "../analytics/AnalyticsMetric"
import HistoryLogsPanel from "../logs/HistoryLogsPanel"
import HistoryLogItem from "../logs/HistoryLogItem"
import { useHistoryStore } from "../../../store/history/historyStore"


const QUICK_FILTERS = [
  "SUCCESS",
  "FAILED",
  "RETRYING",
  "HIGH VIEWS",
  "LOW CTR",
  "MF MODE 3",
]


const RETRY_ANALYTICS = [
  {
    title: "Most Retry Channel",
    value: "DJ Channel B",
  },
  {
    title: "Peak Failed Hour",
    value: "22:00 - 01:00",
  },
]


export default function HistoryOverviewPanel() {

  const historyItems = useHistoryStore((s) => s.historyItems)
  const stats = useHistoryStore((s) => s.stats)
  const logs = useHistoryStore((s) => s.logs)


  return (

    <div className="flex-1 overflow-hidden p-4 flex flex-col gap-4">

      <div className="flex items-center gap-2 overflow-x-auto shrink-0 pb-1">

        {QUICK_FILTERS.map((item) => (

          <div
            key={item}
            className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.03] text-[10px] font-semibold tracking-wide text-white/65 whitespace-nowrap hover:border-cyan-500/20 hover:text-cyan-300 transition-all cursor-pointer"
          >

            {item}

          </div>

        ))}

      </div>

      <div className="grid grid-cols-4 gap-3 shrink-0">

        {stats.map((item) => (

          <div
            key={item.title}
            className="rounded-xl border border-white/5 bg-[#141821] px-4 py-3"
          >

            <div className="flex items-start justify-between gap-3">

              <div>

                <div className="text-[10px] uppercase tracking-[0.08em] text-white/35 font-medium">

                  {item.title}

                </div>

                <div className={`mt-2 text-[21px] font-semibold ${item.color}`}>

                  {item.value}

                </div>

              </div>

              <div className="text-[9px] text-white/45 font-semibold shrink-0 pt-1">

                {item.change}

              </div>

            </div>

          </div>

        ))}

      </div>

      <div className="flex-1 overflow-hidden grid grid-cols-[1.4fr_0.8fr] gap-4 min-h-0">

        <HistoryArchivePanel>

          {historyItems.map((item) => (

            <HistoryCard
              key={item.id}
              item={item}
            />

          ))}

        </HistoryArchivePanel>

        <div className="flex flex-col gap-3 overflow-hidden min-h-0">

          <div className="grid grid-cols-2 gap-3 shrink-0">

            {RETRY_ANALYTICS.map((item) => (

              <div
                key={item.title}
                className="rounded-xl border border-white/5 bg-[#141821] px-3 py-3"
              >

                <div className="text-[9px] uppercase tracking-wide text-white/35">

                  {item.title}

                </div>

                <div className="text-[12px] font-semibold text-orange-300 mt-2 leading-relaxed">

                  {item.value}

                </div>

              </div>

            ))}

          </div>

          <AnalyticsPanel>

            <AnalyticsMetric
              title="Duplicate Check"
              value="Enabled"
            />

            <AnalyticsMetric
              title="Top Channel"
              value="DJ Channel A"
            />

            <AnalyticsMetric
              title="Top Views"
              value="18.2K"
            />

            <AnalyticsMetric
              title="Retry Count"
              value="42"
            />

            <AnalyticsMetric
              title="Deleted"
              value="12"
            />

            <AnalyticsMetric
              title="Storage Cache"
              value="72% Used"
            />

          </AnalyticsPanel>

          <HistoryLogsPanel>

            {logs.map((item, index) => (

              <HistoryLogItem
                key={index}
                message={item}
              />

            ))}

          </HistoryLogsPanel>

        </div>

      </div>

    </div>

  )

}
