export default function AUHistoryModule() {
  const stats = [
    {
      title: 'Total Upload History',
      value: '12,842',
      change: '+284 Today',
      color: 'text-cyan-300',
    },
    {
      title: 'Success Uploads',
      value: '98.2%',
      change: '+1.2%',
      color: 'text-green-300',
    },
    {
      title: 'Failed Uploads',
      value: '42',
      change: 'Retry Active',
      color: 'text-red-300',
    },
    {
      title: 'Storage Used',
      value: '428 GB',
      change: '72% Used',
      color: 'text-orange-300',
    },
  ]

  const quickFilters = [
    'SUCCESS',
    'FAILED',
    'RETRYING',
    'HIGH VIEWS',
    'LOW CTR',
    'MF MODE 3',
  ]

  const history = [
    {
      title: 'DJ SLOW BASS TIKTOK VIRAL 2026',
      channel: 'DJ Channel A',
      date: 'Friday, 24 May 2026',
      time: '20:12',
      duration: '02:44',
      views: '12.4K',
      source: 'MediaFactory Node A',
      retry: '0 Retry',
      status: 'SUCCESS',
      mode: 'MF MODE 3',
    },
    {
      title: 'DJ GALAU MALAM REMIX SANTAI',
      channel: 'DJ Channel B',
      date: 'Saturday, 25 May 2026',
      time: '22:01',
      duration: '03:18',
      views: '8.1K',
      source: 'MediaFactory Node B',
      retry: '2 Retry',
      status: 'FAILED',
      mode: 'MF MODE 2',
    },
    {
      title: 'DJ TABOLA BALE X CALON MANTU',
      channel: 'DJ Channel A',
      date: 'Sunday, 26 May 2026',
      time: '00:44',
      duration: '04:11',
      views: '4.9K',
      source: 'MediaFactory Node C',
      retry: 'Retry Active',
      status: 'RETRYING',
      mode: 'MF MODE 1',
    },
    {
      title: 'DJ NIGHT DRIVE REMIX 2026',
      channel: 'DJ Channel C',
      date: 'Sunday, 26 May 2026',
      time: '01:21',
      duration: '02:52',
      views: '18.2K',
      source: 'MediaFactory Node A',
      retry: '0 Retry',
      status: 'SUCCESS',
      mode: 'MF MODE 3',
    },
  ]

  const retryAnalytics = [
    {
      title: 'Most Retry Channel',
      value: 'DJ Channel B',
    },
    {
      title: 'Peak Failed Hour',
      value: '22:00 - 01:00',
    },
  ]

  const logs = [
    '[20:01] Upload history synced',
    '[20:03] Retry history updated',
    '[20:04] YouTube analytics fetched',
    '[20:07] MediaFactory archive synced',
    '[20:09] Failed upload moved to retry queue',
    '[20:10] Workspace history cache refreshed',
  ]

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
              i === 2
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
              HISTORY
            </div>

            <div className="text-xs text-white/40 mt-1">
              Upload archive &amp; operational history monitoring
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <HistoryDropdown title="Workspace" value="DJ Remix" width="180px" />
            <HistoryDropdown title="Filter" value="All Uploads" width="160px" />
            <HistoryDropdown title="Range" value="Last 30 Days" width="180px" />
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 overflow-x-auto shrink-0 pb-1">
            {quickFilters.map((item) => (
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
            <div className="bg-[#141821] border border-white/5 rounded-xl overflow-hidden flex flex-col min-h-0">
              <div className="h-[58px] border-b border-white/5 px-5 flex items-center justify-between shrink-0">
                <div>
                  <div className="text-[14px] font-semibold text-cyan-300">
                    Upload History Archive
                  </div>

                  <div className="text-[11px] text-white/35 mt-1">
                    Complete upload activity history
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-[10px] text-white/55">
                    Search title, channel, mode...
                  </div>

                  <div className="px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-[10px] text-cyan-300 font-semibold">
                    Timeline: This Month
                  </div>

                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2 snap-y snap-mandatory scroll-smooth">
                {history.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-white/5 bg-white/[0.025] p-2.5 hover:bg-white/[0.04] transition-all snap-start"
                  >
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

                          <div
                            className={`px-2 py-[5px] rounded-md text-[8px] font-semibold tracking-wide shrink-0 ${
                              item.status === 'SUCCESS'
                                ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                                : item.status === 'FAILED'
                                  ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                                  : 'bg-orange-500/10 border border-orange-500/20 text-orange-300'
                            }`}
                          >
                            {item.status}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 mt-3">
                          <div className="grid grid-cols-3 gap-2">
                            <HistoryInfo label="Duration" value={item.duration} />
                            <HistoryInfo label="Views" value={item.views} />
                            <HistoryInfo label="Mode" value={item.mode} />
                          </div>

                          <div className="grid grid-cols-[1fr_auto] gap-2">
                            <HistoryInfo label="Source" value={item.source} wide />

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
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 overflow-hidden min-h-0">
              <div className="grid grid-cols-2 gap-3 shrink-0">
                {retryAnalytics.map((item) => (
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

              <div className="bg-[#141821] border border-white/5 rounded-xl overflow-hidden flex flex-col h-[42%] min-h-[240px]">
                <div className="h-[52px] border-b border-white/5 px-4 flex items-center justify-between shrink-0">
                  <div>
                    <div className="text-[12px] font-semibold text-purple-300">
                      History Analytics
                    </div>

                    <div className="text-[9px] text-white/35 mt-1">
                      Upload performance summary
                    </div>
                  </div>

                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                </div>

                <div className="flex-1 overflow-y-auto p-2.5 grid grid-cols-2 gap-2 snap-y snap-mandatory scroll-smooth">
                  <AnalyticsCard title="Duplicate Check" value="Enabled" />
                  <AnalyticsCard title="Top Channel" value="DJ Channel A" />
                  <AnalyticsCard title="Top Views" value="18.2K" />
                  <AnalyticsCard title="Retry Count" value="42" />
                  <AnalyticsCard title="Deleted" value="12" />
                  <AnalyticsCard title="Storage Cache" value="72% Used" />
                </div>
              </div>

              <div className="bg-[#141821] border border-white/5 rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="h-[52px] border-b border-white/5 px-4 flex items-center justify-between shrink-0">
                  <div>
                    <div className="text-[12px] font-semibold text-orange-300">
                      History Logs
                    </div>

                    <div className="text-[9px] text-white/35 mt-1">
                      Archive synchronization logs
                    </div>
                  </div>

                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1.5 text-[8px] text-white/65 font-mono snap-y snap-mandatory scroll-smooth overflow-x-hidden">
                  {logs.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-white/[0.03] bg-white/[0.025] px-2 py-1.5 snap-start h-[48px] flex items-center"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function HistoryDropdown({ title, value, width }) {
  return (
    <div
      className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2 cursor-pointer hover:border-cyan-500/20 transition-all"
      style={{ minWidth: width }}
    >
      <div className="flex-1">
        <div className="text-[10px] uppercase tracking-wide text-white/35 mb-1">
          {title}
        </div>

        <div className="text-sm text-white/85 font-medium flex items-center justify-between">
          <span>{value}</span>
          <span className="text-white/30">▼</span>
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

function AnalyticsCard({ title, value }) {
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
