export default function AUAccountsModule() {
  const accounts = [
    {
      name: 'DJ Remix Factory',
      channel: '@djremixfactory',
      status: 'ACTIVE',
      uploads: '482 Uploads',
      quota: '78%',
      workspace: 'DJ Workspace',
      schedule: 'Daily • 20:00',
      avatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop',
    },
    {
      name: 'Slow Bass Nation',
      channel: '@slowbassnation',
      status: 'WARNING',
      uploads: '216 Uploads',
      quota: '91%',
      workspace: 'Bass Workspace',
      schedule: 'Daily • 22:30',
      avatar:
        'https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Night Drive Remix',
      channel: '@nightdriveremix',
      status: 'LIMITED',
      uploads: '104 Uploads',
      quota: '98%',
      workspace: 'Night Drive',
      schedule: 'Weekend • 19:00',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
    },
  ]

  const logs = [
    '[20:01] Account synchronization completed',
    '[20:04] Upload quota updated',
    '[20:05] Workspace metadata refreshed',
    '[20:08] Cookie validation success',
    '[20:10] Scheduler profile synced',
  ]

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
              className={`flex items-center gap-3 rounded-xl px-3 py-1.5 cursor-pointer transition-all ${
                i === 3
                  ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-300'
                  : 'hover:bg-white/5 text-white/70'
              }`}
            >
              <div className="w-2 h-1.5 rounded-full bg-current shrink-0" />

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
              ACCOUNTS
            </div>

            <div className="text-xs text-white/40 mt-1">
              Workspace channel management & automation orchestration
            </div>
          </div>

          <div className="flex items-center gap-3">
            <HeaderDropdown
              title="Workspace"
              value="DJ Remix Factory"
              width="220px"
            />

            <HeaderDropdown
              title="Mode"
              value="Multi Channel"
              width="180px"
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-4 flex flex-col gap-4 min-h-0">
          <div className="grid grid-cols-4 gap-3 shrink-0">
            <StatCard
              title="Connected Accounts"
              value="12"
              color="text-cyan-300"
            />

            <StatCard
              title="Healthy Channels"
              value="9"
              color="text-green-300"
            />

            <StatCard
              title="Warning Accounts"
              value="2"
              color="text-orange-300"
            />

            <StatCard
              title="Quota Usage"
              value="78%"
              color="text-purple-300"
            />
          </div>

          <div className="flex-1 overflow-hidden grid grid-cols-[1fr_420px] gap-4 min-h-0">
            <div className="bg-[#141821] border border-white/5 rounded-2xl overflow-hidden flex flex-col min-h-0">
              <div className="h-[64px] border-b border-white/5 px-5 flex items-center justify-between shrink-0">
                <div>
                  <div className="text-sm font-semibold text-cyan-300">
                    Channel Accounts
                  </div>

                  <div className="text-[11px] text-white/40 mt-1">
                    Connected upload channels & workspace profiles
                  </div>
                </div>

                <button className="h-[38px] px-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm font-medium hover:bg-cyan-500/20 transition-all">
                  Add Account
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3 snap-y snap-mandatory scroll-smooth">
                {accounts.map((item, index) => (
                  <AccountCard key={index} item={item} />
                ))}
              </div>
            </div>

            <div className="overflow-hidden flex flex-col gap-4 min-h-0">
              <div className="flex-1 min-h-0 bg-[#141821] border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                <div className="h-[64px] border-b border-white/5 px-5 flex items-center shrink-0">
                  <div>
                    <div className="text-sm font-semibold text-purple-300">
                      Account Detail
                    </div>

                    <div className="text-[11px] text-white/40 mt-1">
                      Upload identity & automation profile
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-1 snap-y snap-mandatory scroll-smooth overscroll-contain">
                  <div className="snap-start min-h-[72px] flex flex-col justify-center border-b border-white/[0.02] py-1.5">
                    <Section title="Channel Name">
                      <Input value="DJ Remix Factory" />
                    </Section>
                  </div>

                  <div className="snap-start min-h-[72px] flex flex-col justify-center border-b border-white/[0.02] py-1.5">
                    <Section title="Workspace Profile">
                      <Select value="DJ Workspace" />
                    </Section>
                  </div>

                  <div className="grid grid-cols-2 gap-3 snap-start min-h-[82px] items-center border-b border-white/[0.02] py-1.5">
                    <Section title="Upload Schedule">
                      <Select value="Daily • 20:00" />
                    </Section>

                    <Section title="Cooldown Status">
                      <StatusBox
                        value="02h 14m"
                        label="Cooldown"
                        color="orange"
                      />
                    </Section>
                  </div>

                  <div className="grid grid-cols-2 gap-3 snap-start min-h-[82px] items-center border-b border-white/[0.02] py-1.5">
                    <Section title="Cookie Status">
                      <StatusBox
                        value="Connected"
                        label="Healthy"
                        color="green"
                      />
                    </Section>

                    <Section title="Session Expiry">
                      <StatusBox
                        value="3d 12h"
                        label="Remaining"
                        color="cyan"
                      />
                    </Section>
                  </div>

                  <div className="grid grid-cols-2 gap-3 snap-start min-h-[82px] items-center border-b border-white/[0.02] py-1.5">
                    <Section title="Upload Quota">
                      <ProgressBox
                        value="78% upload quota usage detected"
                        width="78%"
                        color="bg-cyan-400"
                      />
                    </Section>

                    <Section title="Queue Capacity">
                      <ProgressBox
                        value="Current queue capacity 24/40"
                        width="60%"
                        color="bg-purple-400"
                      />
                    </Section>
                  </div>

                  <div className="grid grid-cols-2 gap-3 snap-start min-h-[82px] items-center border-b border-white/[0.02] py-1.5">
                    <Section title="Risk Score">
                      <StatusBox
                        value="Low Risk"
                        label="Safe"
                        color="green"
                      />
                    </Section>

                    <Section title="Priority Mode">
                      <Select value="High Priority" />
                    </Section>
                  </div>

                  <div className="snap-start min-h-[110px] flex flex-col justify-center py-1.5">
                    <Section title="Workspace Notes">
                      <TextArea />
                    </Section>
                  </div>
                </div>

                <div className="border-t border-white/5 p-4 flex gap-3 bg-[#11141b] shrink-0">
                  <button className="flex-1 bg-cyan-500/15 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 rounded-xl py-1.5 text-sm font-medium transition-all">
                    Save Changes
                  </button>

                  <button className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl py-1.5 text-sm text-red-200 font-medium transition-all">
                    Disconnect
                  </button>
                </div>
              </div>

              <div className="h-[104px] bg-[#12161e] border border-white/5 rounded-2xl overflow-hidden flex flex-col shrink-0">
                <div className="h-[34px] border-b border-white/5 px-4 flex items-center justify-between shrink-0">
                  <div className="text-[11px] font-semibold text-orange-300 tracking-wide">
                    Account Logs
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
    </div>
  )
}

function HeaderDropdown({ title, value, width }) {
  return (
    <div
      className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2 cursor-pointer hover:border-cyan-500/20 transition-all"
      style={{ minWidth: width }}
    >
      <div className="flex-1">
        <div className="text-[9px] uppercase tracking-wide text-white/30 mb-0.5">
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

function StatCard({ title, value, color }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#141821] px-4 py-1.5">
      <div className="text-[10px] uppercase tracking-[0.08em] text-white/35 font-medium">
        {title}
      </div>

      <div className={`mt-2 text-[22px] font-semibold ${color}`}>
        {value}
      </div>
    </div>
  )
}

function AccountCard({ item }) {
  const statusStyle = {
    ACTIVE: 'text-green-300 border-green-500/20 bg-green-500/10',
    WARNING: 'text-orange-300 border-orange-500/20 bg-orange-500/10',
    LIMITED: 'text-red-300 border-red-500/20 bg-red-500/10',
  }

  return (
    <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 snap-start">
      <div className="flex items-start gap-4">
        <div className="w-[56px] h-[56px] rounded-full overflow-hidden border border-white/10 shrink-0">
          <img
            src={item.avatar}
            className="w-full h-full object-cover"
            alt="avatar"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[15px] font-semibold text-white/95 leading-relaxed break-words">
                {item.name}
              </div>

              <div className="text-[11px] text-white/40 mt-1">
                {item.channel}
              </div>
            </div>

            <div
              className={`h-[28px] px-3 rounded-lg border text-[10px] font-semibold flex items-center shrink-0 ${statusStyle[item.status]}`}
            >
              {item.status}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <MiniMeta label="Uploads" value={item.uploads} />
            <MiniMeta label="Quota" value={item.quota} />
            <MiniMeta label="Schedule" value={item.schedule} />
          </div>

          <div className="mt-3 rounded-xl border border-white/[0.04] bg-[#10141c] px-3 py-2">
            <div className="text-[9px] uppercase tracking-wide text-white/30">
              Workspace
            </div>

            <div className="text-[11px] text-cyan-300 font-medium mt-1">
              {item.workspace}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniMeta({ label, value }) {
  return (
    <div className="rounded-xl border border-white/[0.03] bg-[#10141c] px-3 py-2">
      <div className="text-[8px] uppercase tracking-[0.08em] text-white/30">
        {label}
      </div>

      <div className="text-[11px] text-white/90 font-semibold mt-1 leading-relaxed break-words">
        {value}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-white/35 mb-1">
        {title}
      </div>

      {children}
    </div>
  )
}

function Input({ value }) {
  return (
    <div className="min-h-[34px] rounded-lg bg-white/[0.03] border border-white/5 px-2.5 py-1.5 flex items-center text-[11px] text-white/85">
      {value}
    </div>
  )
}

function TextArea() {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/5 p-2.5 text-[10px] text-white/45 min-h-[60px] leading-snug">
      Primary upload workspace for DJ remix automation and metadata template
      processing.
    </div>
  )
}

function Select({ value }) {
  return (
    <div className="h-[34px] rounded-lg bg-white/[0.03] border border-white/5 px-2.5 flex items-center justify-between text-[11px] text-white/85 cursor-pointer hover:border-cyan-500/20 transition-all">
      <span>{value}</span>
      <span className="text-white/30">▼</span>
    </div>
  )
}

function StatusBox({ value, label, color }) {
  const styles = {
    green: 'border-green-500/20 bg-green-500/10 text-green-200 text-green-300',
    orange: 'border-orange-500/20 bg-orange-500/10 text-orange-200 text-orange-300',
    cyan: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-200 text-cyan-300',
  }

  const current = styles[color].split(' ')

  return (
    <div className={`h-[34px] rounded-lg border ${current[0]} ${current[1]} px-4 flex items-center justify-between text-sm`}>
      <span className={current[2]}>{value}</span>
      <span className={`text-[10px] uppercase ${current[3]}`}>
        {label}
      </span>
    </div>
  )
}

function ProgressBox({ value, width, color }) {
  return (
    <div className="space-y-1">
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width }}
        />
      </div>

      <div className="text-[9px] text-white/35 leading-tight">
        {value}
      </div>
    </div>
  )
}
