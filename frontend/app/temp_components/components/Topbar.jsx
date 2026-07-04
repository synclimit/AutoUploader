export default function Topbar() {

  return (

    <div className="h-[92px] border-b border-white/[0.04] bg-[#0d121b] px-6 flex items-center justify-between shrink-0">

      <div>

        <div className="text-[38px] font-black tracking-tight text-cyan-300">

          AUTO UPLOADER

        </div>

        <div className="text-sm text-white/35 mt-1">

          Compact Operational Upload Workflow

        </div>

      </div>

      <div className="flex items-center gap-4">

        <div className="w-[140px] h-[58px] rounded-2xl bg-[#111722] border border-white/[0.06] px-4 flex flex-col justify-center">

          <div className="text-[10px] text-white/35 uppercase">

            Language

          </div>

          <div className="text-lg font-semibold mt-1">

            EN

          </div>

        </div>

        <div className="w-[260px] h-[58px] rounded-2xl bg-[#111722] border border-white/[0.06] px-4 flex items-center gap-3">

          <div className="w-10 h-10 rounded-full bg-white/10" />

          <div>

            <div className="font-semibold">

              DJ Remix Factory

            </div>

            <div className="text-xs text-white/40">

              Profile: DJ Remix Template

            </div>

          </div>

        </div>

        <div className="w-[180px] h-[58px] rounded-2xl bg-[#111722] border border-white/[0.06] px-4 flex flex-col justify-center">

          <div className="text-[10px] text-white/35 uppercase">

            Upload Mode

          </div>

          <div className="text-lg font-semibold mt-1">

            DJ Mode

          </div>

        </div>

        <button className="h-[58px] px-7 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-semibold hover:bg-cyan-500/20 transition-all">

          Select Video

        </button>

      </div>

    </div>

  )

}