export default function AUSettingsModule() {
  const categories = [
    'General',
    'Upload Engine',
    'AI Metadata',
    'Scheduler',
    'MediaFactory',
    'Storage',
    'Workspace',
    'Security',
  ]

  const systemCards = [
    {
      title: 'Upload Engine',
      value: 'ACTIVE',
      color: 'text-green-300',
    },
    {
      title: 'AI Metadata',
      value: 'CONNECTED',
      color: 'text-cyan-300',
    },
    {
      title: 'Scheduler',
      value: 'RUNNING',
      color: 'text-orange-300',
    },
    {
      title: 'Storage Usage',
      value: '72%',
      color: 'text-purple-300',
    },
  ]

  const logs = [
    '[20:01] Scheduler config updated',
    '[20:02] Workspace metadata synced',
    '[20:03] Retry engine restarted',
    '[20:05] Gemini API reconnected',
    '[20:06] Upload cooldown changed',
    '[20:07] MediaFactory node refreshed',
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
              i === 4
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
              SETTINGS
            </div>

            <div className="text-xs text-white/40 mt-1">
              System configuration &amp; automation controls
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <SettingsDropdown title="Workspace" value="DJ Remix Factory" width="220px" />
            <SettingsDropdown title="Language" value="English" width="150px" />
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-4 flex flex-col gap-4 min-h-0">
          <div className="grid grid-cols-4 gap-3 shrink-0">
            {systemCards.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/5 bg-[#141821] px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.08em] text-white/35 font-medium">
                      {item.title}
                    </div>

                    <div className={`mt-2 text-[20px] font-semibold ${item.color}`}>
                      {item.value}
                    </div>
                  </div>

                  <div className="w-2 h-2 rounded-full bg-green-400 mt-1 shrink-0" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-hidden grid grid-cols-[220px_1fr] gap-4 min-h-0">
            <div className="bg-[#141821] border border-white/5 rounded-2xl overflow-hidden flex flex-col min-h-0">
              <div className="h-[58px] border-b border-white/5 px-4 flex items-center shrink-0">
                <div>
                  <div className="text-[13px] font-semibold text-cyan-300">
                    Settings Categories
                  </div>

                  <div className="text-[10px] text-white/35 mt-1">
                    System configuration modules
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2 snap-y snap-mandatory scroll-smooth">
                {categories.map((item, index) => (
                  <div
                    key={item}
                    className={`rounded-xl px-3 py-3 border cursor-pointer transition-all snap-start ${
                      index === 0
                        ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300'
                        : 'bg-white/[0.02] border-white/[0.03] hover:border-white/10 text-white/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-semibold tracking-wide">
                          {item}
                        </div>

                        <div className="text-[9px] text-white/35 mt-1 leading-relaxed">
                          Click to open settings section
                        </div>
                      </div>

                      <div className="w-2 h-2 rounded-full bg-current opacity-70 shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden grid grid-cols-[1fr_300px] gap-4 min-h-0">
              <div className="overflow-y-auto pr-1 space-y-4 snap-y snap-mandatory scroll-smooth min-h-0" id="settings-scroll-container">
                <SettingsSection
                  title="MediaFactory Configuration"
                  status="Connected"
                  stickyHeader
                  id="mediafactory-config"
                  description="Render pipeline & output automation"
                >
                  <div className="space-y-2">
                    <SettingRow
                      label="Render Mode"
                      description="Current MediaFactory render profile"
                      type="select"
                      value="MF MODE 3"
                    />

                    <SettingRow
                      label="Output Folder"
                      description="Default MediaFactory export path"
                      type="input"
                      value="/mediafactory/output"
                    />

                    <SettingRow
                      label="Auto Render Queue"
                      description="Automatically process render queue"
                      type="toggle"
                      value="Enabled"
                    />

                    <SettingRow
                      label="Realtime Render Sync"
                      description="Realtime output synchronization"
                      type="toggle"
                      value="Enabled"
                    />
                  </div>
                </SettingsSection>

                <SettingsSection
                  title="Storage & Cache"
                  status="Healthy"
                  stickyHeader
                  id="storage-config"
                  description="Storage optimization & cleanup automation"
                >
                  <div className="space-y-2">
                    <SettingRow
                      label="Storage Limit"
                      description="Maximum local storage usage"
                      type="input"
                      value="1 TB"
                    />

                    <SettingRow
                      label="Cache Cleanup"
                      description="Auto cleanup interval"
                      type="select"
                      value="30 Days"
                    />

                    <SettingRow
                      label="Auto Cache Cleanup"
                      description="Automatically remove old cache"
                      type="toggle"
                      value="Enabled"
                    />

                    <SettingRow
                      label="Thumbnail Compression"
                      description="Compress generated thumbnails"
                      type="toggle"
                      value="Enabled"
                    />
                  </div>
                </SettingsSection>

                <SettingsSection
                  title="Workspace & Security"
                  status="Protected"
                  stickyHeader
                  id="workspace-config"
                  description="Workspace isolation & session security"
                >
                  <div className="space-y-2">
                    <SettingRow
                      label="Workspace Mode"
                      description="Current active workspace profile"
                      type="select"
                      value="DJ Remix"
                    />

                    <SettingRow
                      label="Session Timeout"
                      description="Automatic session expiration"
                      type="select"
                      value="12 Hours"
                    />

                    <SettingRow
                      label="Workspace Isolation"
                      description="Separate metadata per workspace"
                      type="toggle"
                      value="Enabled"
                    />

                    <SettingRow
                      label="Login Verification"
                      description="Protect account configuration access"
                      type="toggle"
                      value="Enabled"
                    />
                  </div>
                </SettingsSection>

                <SettingsSection
                  title="General Configuration"
                  status="Ready"
                  stickyHeader
                  id="general-config"
                  description="Main system behavior & upload preferences"
                >
                  <div className="space-y-2">
                    <SettingRow
                      label="Default Upload Visibility"
                      description="Default visibility for uploaded videos"
                      type="select"
                      value="Public"
                    />

                    <SettingRow
                      label="Default Upload Delay"
                      description="Delay before upload starts"
                      type="select"
                      value="15 Minutes"
                    />

                    <SettingRow
                      label="Auto Retry Upload"
                      description="Automatically retry failed uploads"
                      type="toggle"
                      value="Enabled"
                    />

                    <SettingRow
                      label="Bulk Auto Mode"
                      description="Enable automatic metadata processing"
                      type="toggle"
                      value="ON"
                    />
                  </div>
                </SettingsSection>

                <SettingsSection
                  title="AI Metadata Engine"
                  status="Connected"
                  stickyHeader
                  id="ai-config"
                  description="AI generation & duplicate prevention"
                >
                  <div className="space-y-2">
                    <SettingRow
                      label="Gemini API Mode"
                      description="Current AI generation profile"
                      type="select"
                      value="Balanced"
                    />

                    <SettingRow
                      label="Duplicate Detection"
                      description="Prevent similar titles & descriptions"
                      type="select"
                      value="Strict"
                    />

                    <SettingRow
                      label="OCR Thumbnail Reader"
                      description="Detect thumbnail text automatically"
                      type="toggle"
                      value="Enabled"
                    />

                    <SettingRow
                      label="Auto Hashtag Generate"
                      description="Generate hashtags automatically"
                      type="toggle"
                      value="Enabled"
                    />
                  </div>
                </SettingsSection>

                <SettingsSection
                  title="Scheduler & Retry Engine"
                  status="Running"
                  stickyHeader
                  id="scheduler-config"
                  description="Upload timing & retry automation"
                >
                  <div className="space-y-2">
                    <SettingRow
                      label="Max Retry"
                      description="Maximum retry attempt per upload"
                      type="select"
                      value="5 Retry"
                    />

                    <SettingRow
                      label="Retry Cooldown"
                      description="Cooldown before retry process"
                      type="select"
                      value="15 Minutes"
                    />

                    <SettingRow
                      label="Auto Restart Failed Queue"
                      description="Restart failed queue automatically"
                      type="toggle"
                      value="Enabled"
                    />

                    <SettingRow
                      label="Realtime Scheduler Sync"
                      description="Realtime schedule synchronization"
                      type="toggle"
                      value="Enabled"
                    />
                  </div>
                </SettingsSection>
              </div>

              <div className="overflow-hidden flex flex-col gap-4 min-h-0">
                <div className="bg-[#141821] border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[44%] min-h-[260px]">
                  <div className="h-[54px] border-b border-white/5 px-4 flex items-center justify-between shrink-0">
                    <div>
                      <div className="text-[12px] font-semibold text-orange-300">
                        System Monitor
                      </div>

                      <div className="text-[9px] text-white/35 mt-1">
                        Current automation health
                      </div>
                    </div>

                    
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 snap-y snap-mandatory scroll-smooth">
                    <StatusMonitorCard title="Queue Health" value="Stable" />
                    <StatusMonitorCard title="API Status" value="Online" />
                    <StatusMonitorCard title="Retry Engine" value="Running" />
                    <StatusMonitorCard title="OCR Service" value="Connected" />
                    <StatusMonitorCard title="Cache Usage" value="72%" />
                    <StatusMonitorCard title="Storage" value="428 GB" />
                  </div>
                </div>

                <div className="bg-[#141821] border border-white/5 rounded-2xl overflow-hidden flex flex-col flex-1 min-h-0">
                  <div className="h-[52px] border-b border-white/5 px-4 flex items-center justify-between shrink-0">
                    <div>
                      <div className="text-[12px] font-semibold text-cyan-300">
                        Configuration Logs
                      </div>

                      <div className="text-[9px] text-white/35 mt-1">
                        Realtime settings activity logs
                      </div>
                    </div>

                    
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 space-y-2 text-[8px] text-white/65 font-mono snap-y snap-mandatory scroll-smooth overflow-x-hidden">
                    {logs.map((item, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-white/[0.03] bg-white/[0.025] px-3 py-2 snap-start min-h-[54px] flex items-center leading-relaxed"
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
    </div>
  )
}

function SettingsDropdown({ title, value, width }) {
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

function SettingsSection({ title, description, children, status, stickyHeader, id }) {
  return (
    <div id={id} className="rounded-xl border border-white/5 bg-[#141821] overflow-hidden snap-start">
      <div className={`h-[58px] border-b border-white/5 px-5 flex items-center justify-between z-20 bg-[#141821] ${stickyHeader ? 'sticky top-0' : ''}`}>
        <div>
          <div className="text-[13px] font-semibold text-cyan-300">
            {title}
          </div>

          <div className="text-[10px] text-white/35 mt-1">
            {description}
          </div>
        </div>

        
      </div>

      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

function SettingRow({ label, description, type, value }) {
  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 min-h-[92px] flex flex-col justify-between gap-3">
      <div>
        <div className="text-[12px] font-semibold text-white/90 leading-relaxed tracking-[0.01em]">
          {label}
        </div>

        <div className="text-[9px] text-white/38 mt-1.5 leading-[1.6] pr-2 break-words">
          {description}
        </div>
      </div>

      {type === 'toggle' ? (
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="text-[11px] font-semibold text-green-300 leading-none">
            {value}
          </div>

          <div className="w-[42px] h-[22px] rounded-full bg-cyan-500/20 border border-cyan-500/20 relative shrink-0">
            <div className="absolute top-[2px] right-[2px] w-[16px] h-[16px] rounded-full bg-cyan-300" />
          </div>
        </div>
      ) : (
        <div className="h-[38px] rounded-lg border border-white/[0.05] bg-[#10141c] px-3 flex items-center justify-between gap-3 overflow-hidden">
          <div className="text-[11px] text-white/90 font-medium truncate flex-1 leading-none">
            {value}
          </div>

          <div className="text-white/30 text-[10px] shrink-0 leading-none">
            {type === 'select' ? '▼' : '●'}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusMonitorCard({ title, value }) {
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
