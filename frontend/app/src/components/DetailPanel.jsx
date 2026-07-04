export default function DetailPanel() {

  return (

    <div className="flex-1 min-h-0 bg-[#101722] border border-white/[0.05] rounded-2xl overflow-hidden flex flex-col">

      <div className="h-[64px] border-b border-white/[0.04] px-4 flex items-center shrink-0">

        <div>

          <div className="text-[18px] font-bold text-purple-300">

            Detail Panel

          </div>

          <div className="text-[11px] text-white/35 mt-1">

            Metadata & upload settings

          </div>

        </div>

      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        <Section title="Title">

          <Input value="DJ TABOLA BALE X CALON MANTU IDAMAN" />

        </Section>

        <Section title="Description">

          <TextArea />

        </Section>

        <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] overflow-hidden">

          <div className="h-[56px] px-4 flex items-center justify-between border-b border-white/[0.05]">

            <div>

              <div className="text-sm font-bold text-[var(--accent-400)]">

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

            <Section title="OCR Preview">

              <div className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3 text-[11px] text-white/65 leading-relaxed">

                DJ SANTAI MALAM FULL BASS 2026

              </div>

            </Section>

            <Section title="Thumbnail">

              <div className="h-[110px] rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] flex items-center justify-center text-white/35 text-sm hover:border-[var(--accent-500)]/20 transition-all cursor-pointer">

                Upload Thumbnail

              </div>

            </Section>

          </div>

        </div>

      </div>

      <div className="border-t border-white/[0.05] p-4 flex gap-3 bg-[#0d121b] shrink-0">

        <button className="flex-1 h-[48px] rounded-xl bg-[var(--accent-500)]/10 border border-[var(--accent-500)]/20 text-[var(--accent-400)] text-sm font-bold hover:bg-[var(--accent-500)]/20 transition-all">

          Save Metadata

        </button>

        <button className="flex-1 h-[48px] rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-sm font-bold hover:bg-green-500/20 transition-all">

          Upload To YouTube

        </button>

      </div>

    </div>

  )

}


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


function Input({ value }) {

  return (

    <div className="min-h-[48px] rounded-xl bg-white/[0.03] border border-white/[0.05] px-4 flex items-center text-sm text-white/90">

      {value}

    </div>

  )

}


function TextArea() {

  return (

    <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-4 text-white/60 min-h-[120px] text-[11px] leading-relaxed">

      DJ remix viral terbaru untuk teman santai, kerja, dan perjalanan malam.
      Jangan lupa subscribe untuk update remix terbaru setiap hari.

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