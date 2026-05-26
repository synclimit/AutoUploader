export default function AutoUploaderPrototype() {
  const queue = [
    {
      title: 'DJ TABOLA BALE X CALON MANTU IDAMAN',
      status: 'FAILED',
      progress: 0,
      schedule: 'Retry in 10m',
      channel: 'DJ Channel A',
      mode: 'MF MODE 3',
      metadata: 'AI',
      retry: '2/5',
      eta: '2h 14m',
      warning: true,
    },
    {
      title: 'DJ TABOLA BALE X CALON MANTU IDAMAN',
      status: 'SCANNING',
      progress: 12,
      schedule: 'Scanning folder...',
      channel: 'DJ Channel A',
      mode: 'MF MODE 1',
      metadata: 'TEMPLATE',
      retry: '0/5',
      eta: '14m',
      warning: false,
    },
    {
      title: 'DJ FULL BASS VIRAL TIKTOK 2026',
      status: 'GENERATING',
      progress: 24,
      schedule: 'H+2 • 19:10',
      channel: 'DJ Channel B',
      mode: 'MF MODE 3',
      metadata: 'OCR',
      retry: '1/5',
      eta: '38m',
      warning: false,
    },
  ]

  const logs = [
    '[20:01] Queue initialized',
    '[20:03] 12 videos detected',
    '[20:05] Metadata generated',
    '[20:06] Upload started',
    '[20:08] Schedule synced',
    '[20:10] Upload completed',
  ]

  const statusColor = {
    SCANNING: 'bg-blue-400',
    QUEUED: 'bg-white/60',
    EDITING: 'bg-orange-300',
    UPLOADING: 'bg-cyan-400',
    READY: 'bg-purple-400',
    GENERATING: 'bg-yellow-400',
    SUCCESS: 'bg-green-400',
    FAILED: 'bg-red-400',
  }

  return (
    <div className="h-screen w-screen bg-[#0f1115] text-white overflow-hidden flex">
      <div className="w-[72px] hover:w-[220px] transition-all duration-300 bg-[#151922] border-r border-white/5 flex flex-col py-4 px-3 gap-3 group overflow-hidden shrink-0">
        <div className="h-12 flex items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-bold text-sm">
          AU
        </div>

        {['Dashboard', 'Upload Queue', 'History', 'Accounts', 'Settings'].map(
          (item, i) => (
            <div
              key={item}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 cursor-pointer transition-all ${
                i === 1
                  ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-300'
                  : 'hover:bg-white/5 text-white/70'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-current shrink-0" />

              <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-200 text-sm font-medium">
                {item}
              </span>
            </div>
          )
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-[72px] border-b border-white/5 bg-[#11141b] px-6 flex items-center justify-between shrink-0">
          <div>
            <div className="text-lg font-semibold tracking-wide text-cyan-300">
              AUTO UPLOADER
            </div>

            <div className="text-xs text-white/40 mt-1">
              Compact Operational Upload Workflow
            </div>
          </div>

          <div className="flex items-center gap-4">
            <DropdownWithHelper
              title="Language"
              value="EN"
              helper="Controls uploader interface language for metadata and operational labels."
              width="120px"
            />

            <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl px-4 py-2">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-cyan-500/20">
                <img
                  src="https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=400&auto=format&fit=crop"
                  className="w-full h-full object-cover"
                  alt="profile"
                />
              </div>

              <div>
                <div className="text-sm font-medium leading-none">
                  DJ Remix Factory
                </div>

                <div className="text-[11px] text-white/40 mt-1">
                  Profile: DJ Remix Template
                </div>
              </div>
            </div>

            <DropdownWithHelper
              title="Upload Mode"
              value="DJ Mode"
              helper="Controls metadata behavior and automation rules for DJ or Music workflows."
              width="220px"
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-4 flex gap-4">
          <div className="flex-1 min-w-0 bg-[#141821] border border-white/5 rounded-2xl overflow-hidden flex flex-col">
            <div className="h-[92px] border-b border-white/5 px-5 flex items-center justify-between shrink-0">
              <div>
                <div className="text-sm font-semibold text-cyan-300">
                  Upload Queue
                </div>

                <div className="text-[11px] text-white/40 mt-2">
                  Active scheduled uploads
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DropdownWithHelper
                  title="Bulk Auto"
                  value="OFF"
                  helper="Enables continuous automated pipeline processing without manual upload triggering."
                  width="180px"
                />

                <button className="bg-cyan-500/15 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 text-sm px-4 py-2 rounded-xl transition-all">
                  Scan Folder
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 snap-y snap-mandatory scroll-smooth">
              {queue.map((item, index) => (
                <div
                  key={index}
                  className={`rounded-xl border p-3 cursor-pointer snap-start transition-all ${
                    index === 0
                      ? 'border-cyan-500/30 bg-cyan-500/5'
                      : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="w-[78px] h-[46px] rounded-lg bg-[#222734] shrink-0 border border-white/5" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-[14px] font-semibold leading-[1.45] tracking-[0.01em] text-white/95 break-words max-w-[240px]">
                            {item.title}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10.5px] font-medium text-white/50 leading-none">
                            <div className="w-4 h-4 rounded-full overflow-hidden border border-white/10">
                              <img
                                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop"
                                className="w-full h-full object-cover"
                                alt="channel"
                              />
                            </div>

                            <TooltipText
                              text={item.schedule}
                              helper="Current upload schedule or active queue processing state."
                            />

                            <span>•</span>
                            <span>{item.channel}</span>
                            <span>•</span>

                            <TooltipText
                              text={item.mode}
                              helper="Media Factory render source identifier used for metadata workflow routing."
                              color="text-cyan-300"
                            />

                            <span>•</span>

                            <TooltipText
                              text={item.metadata}
                              helper="Indicates whether metadata was generated from AI, OCR, or template systems."
                              color="text-purple-300"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                          <div
                            className={`w-2 h-2 rounded-full ${statusColor[item.status]}`}
                          />

                          <div className="flex flex-col items-end gap-1 leading-none">
                            <TooltipText
                              text={item.status}
                              helper="Current operational state inside the upload automation pipeline."
                            />

                            <TooltipText
                              text={`Retry ${item.retry}`}
                              helper="Number of upload retry attempts used versus maximum retry limit."
                              color="text-white/35"
                            />

                            <TooltipText
                              text={`ETA ${item.eta}`}
                              helper="Estimated remaining time before queue processing or upload completion."
                              color="text-cyan-300"
                            />
                          </div>
                        </div>
                      </div>

                      {item.warning && (
                        <div className="mt-2.5 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-1.5 text-[10px] font-medium tracking-[0.01em] text-yellow-200">
                          Similar metadata detected
                        </div>
                      )}

                      {item.progress > 0 && item.progress < 100 && (
                        <div className="mt-2.5">
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-400 rounded-full"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-[390px] shrink-0 flex flex-col gap-4 overflow-hidden">
            <div className="flex-1 min-h-0 bg-[#141821] border border-white/5 rounded-2xl overflow-hidden flex flex-col">
              <div className="h-[64px] border-b border-white/5 px-5 flex items-center shrink-0">
                <div>
                  <div className="text-sm font-semibold text-purple-300">
                    Detail Panel
                  </div>

                  <div className="text-[11px] text-white/40 mt-1">
                    Metadata & upload settings
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 snap-y snap-mandatory scroll-smooth">
                <Section
                  title="Title"
                  helper="Main video title used for YouTube uploads and metadata indexing."
                >
                  <Input value="DJ TABOLA BALE X CALON MANTU IDAMAN" />
                </Section>

                <Section
                  title="Description"
                  helper="Video description template, SEO metadata, hashtags, and upload information."
                >
                  <TextArea />
                </Section>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden snap-start">
                  <div className="h-[52px] px-4 flex items-center justify-between border-b border-white/5 cursor-pointer">
                    <div>
                      <div className="text-sm font-medium text-cyan-300">
                        Advanced Upload Settings
                      </div>

                      <div className="text-[11px] text-white/35 mt-1">
                        YouTube metadata & compliance settings
                      </div>
                    </div>

                    <div className="text-white/35 text-xs">▼</div>
                  </div>

                  <div className="p-4 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <Section
                        title="Schedule"
                        helper="Controls automatic publish time and upload scheduling behavior."
                      >
                        <Select value="Today • 20:00" />
                      </Section>

                      <Section
                        title="Visibility"
                        helper="Controls public, private, or scheduled visibility state after upload."
                      >
                        <Select value="Public" />
                      </Section>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Section
                        title="For Kids"
                        helper="YouTube COPPA compliance setting for child-directed content."
                      >
                        <Select value="No, Not Made For Kids" />
                      </Section>

                      <Section
                        title="Altered Content"
                        helper="Disclosure setting for edited or AI-assisted media content."
                      >
                        <Select value="No" />
                      </Section>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Section
                        title="Category"
                        helper="YouTube category classification used for metadata organization."
                      >
                        <Select value="Music" />
                      </Section>

                      <Section
                        title="Playlist"
                        helper="Automatically assigns uploaded content into selected playlists."
                      >
                        <Select value="DJ Remix Viral" />
                      </Section>
                    </div>

                    <Section
                      title="OCR Preview"
                      helper="Detected thumbnail text extracted using OCR processing."
                    >
                      <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-sm text-white/65 leading-relaxed">
                        DJ SANTAI MALAM FULL BASS 2026
                      </div>
                    </Section>

                    <Section
                      title="Thumbnail"
                      helper="Custom thumbnail image used during YouTube upload publishing."
                    >
                      <div className="h-[120px] rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center text-sm text-white/35 hover:border-cyan-500/20 transition-all cursor-pointer">
                        Upload Thumbnail
                      </div>
                    </Section>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/5 p-4 flex gap-3 bg-[#11141b] shrink-0">
                <button className="flex-1 bg-cyan-500/15 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 rounded-xl py-3 text-sm font-medium transition-all active:scale-[0.99]">
                  Save Metadata
                </button>

                <button className="flex-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-xl py-3 text-sm text-green-200 font-medium transition-all active:scale-[0.99]">
                  Upload To YouTube
                </button>
              </div>
            </div>

            <div className="h-[105px] bg-[#12161e] border border-white/5 rounded-2xl overflow-hidden flex flex-col shrink-0">
              <div className="h-[34px] border-b border-white/5 px-4 flex items-center justify-between shrink-0">
                <div className="text-[11px] font-semibold text-orange-300 tracking-wide">
                  Activity Logs
                </div>

                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1 text-[9px] text-white/60 font-mono snap-y snap-mandatory scroll-smooth">
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className="rounded-md bg-white/[0.03] px-2 py-1 snap-start leading-none"
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DropdownWithHelper({ title, value, helper, width }) {
  return (
    <div
      className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2 cursor-pointer hover:border-cyan-500/20 transition-all"
      style={{ minWidth: width }}
    >
      <div className="flex-1">
        <div className="group relative w-fit">
          <div className="text-[10px] uppercase tracking-wide text-white/35 mb-1 cursor-help hover:text-cyan-300 transition-all">
            {title}
          </div>

          <div className="absolute left-0 -top-[58px] opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50">
            <div className="max-w-[220px] rounded-lg border border-cyan-500/20 bg-[#10141c] px-3 py-2 shadow-2xl shadow-cyan-500/5">
              <div className="text-[10px] text-white/65 leading-relaxed">
                {helper}
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-white/85 font-medium flex items-center justify-between">
          <span>{value}</span>
          <span className="text-white/30">▼</span>
        </div>
      </div>
    </div>
  )
}

function TooltipText({ text, helper, color = 'text-white/70' }) {
  return (
    <div className="group relative">
      <span className={`${color} cursor-help hover:text-cyan-300 transition-all font-medium tracking-[0.01em] text-[11px] leading-none`}>
        {text}
      </span>

      <div className="absolute left-0 -top-[58px] opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50">
        <div className="max-w-[220px] rounded-lg border border-cyan-500/20 bg-[#10141c] px-3 py-2">
          <div className="text-[10px] text-white/65 leading-relaxed">
            {helper}
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children, helper }) {
  return (
    <div className="snap-start group relative">
      <div className="relative w-fit mb-2">
        <div className="text-xs uppercase tracking-wide text-white/40 cursor-help hover:text-cyan-300 transition-all">
          {title}
        </div>

        {helper && (
          <div className="absolute left-0 -top-[70px] opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50">
            <div className="max-w-[220px] rounded-lg border border-cyan-500/20 bg-[#10141c] px-3 py-2 shadow-2xl shadow-cyan-500/5">
              <div className="text-[10px] text-white/65 leading-relaxed normal-case tracking-normal">
                {helper}
              </div>
            </div>
          </div>
        )}
      </div>

      {children}
    </div>
  )
}

function Input({ value }) {
  return (
    <div className="min-h-[46px] rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3 flex items-center text-sm text-white/85 leading-relaxed break-words">
      {value}
    </div>
  )
}

function TextArea() {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 text-sm text-white/50 min-h-[160px] leading-loose">
      DJ remix viral terbaru untuk teman santai, kerja, dan perjalanan malam.
      Jangan lupa subscribe untuk update remix terbaru setiap hari.
    </div>
  )
}

function Select({ value }) {
  return (
    <div className="h-[46px] rounded-xl bg-white/[0.03] border border-white/5 px-4 flex items-center justify-between text-sm text-white/85 cursor-pointer hover:border-cyan-500/20 transition-all">
      <span>{value}</span>
      <span className="text-white/30">▼</span>
    </div>
  )
}
