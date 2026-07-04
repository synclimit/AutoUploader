export default function AccountsPanel() {

  return (

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

      Primary upload workspace for DJ remix automation and metadata template processing.

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
    green: "border-green-500/20 bg-green-500/10 text-green-200 text-green-300",
    orange: "border-orange-500/20 bg-orange-500/10 text-orange-200 text-orange-300",
    cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-200 text-cyan-300",
  }


  const current = styles[color].split(" ")


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
