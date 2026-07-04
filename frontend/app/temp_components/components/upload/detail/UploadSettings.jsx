function Section({ title, children }) {

  return (

    <div>

      <div className="text-[10px] uppercase tracking-wide text-white/35 mb-2">

        {title}

      </div>

      {children}

    </div>

  )

}


function Select({ value }) {

  return (

    <div className="h-[46px] rounded-xl bg-white/[0.03] border border-white/[0.05] px-4 flex items-center justify-between text-white/85 text-sm">

      <span>{value}</span>

      <span className="text-white/30 text-xs">

        ▼

      </span>

    </div>

  )

}


export default function UploadSettings() {

  return (

    <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] overflow-hidden">

      <div className="h-[56px] px-4 flex items-center justify-between border-b border-white/[0.05]">

        <div>

          <div className="text-sm font-bold text-cyan-300">

            Advanced Upload Settings

          </div>

          <div className="text-[10px] text-white/35 mt-1">

            YouTube metadata & compliance settings

          </div>

        </div>

        <div className="text-white/30 text-sm">

          ▼

        </div>

      </div>

      <div className="p-4 space-y-4">

        <div className="grid grid-cols-2 gap-3">

          <Section title="Schedule">

            <Select value="Today • 20:00" />

          </Section>

          <Section title="Visibility">

            <Select value="Public" />

          </Section>

        </div>

        <div className="grid grid-cols-2 gap-3">

          <Section title="For Kids">

            <Select value="No, Not Made For Kids" />

          </Section>

          <Section title="Altered Content">

            <Select value="No" />

          </Section>

        </div>

        <div className="grid grid-cols-2 gap-3">

          <Section title="Category">

            <Select value="Music" />

          </Section>

          <Section title="Playlist">

            <Select value="DJ Remix Viral" />

          </Section>

        </div>

      </div>

    </div>

  )

}
