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


export default function MetadataEditor() {

  return (

    <>

      <Section title="Title">

        <Input value="DJ TABOLA BALE X CALON MANTU IDAMAN" />

      </Section>

      <Section title="Description">

        <TextArea />

      </Section>

      <Section title="OCR Preview">

        <div className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3 text-[11px] text-white/65 leading-relaxed">

          DJ SANTAI MALAM FULL BASS 2026

        </div>

      </Section>

      <Section title="Thumbnail">

        <div className="h-[110px] rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] flex items-center justify-center text-white/35 text-sm hover:border-cyan-500/20 transition-all cursor-pointer">

          Upload Thumbnail

        </div>

      </Section>

    </>

  )

}
