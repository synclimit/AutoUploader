export default function UploadHeader() {

  return (

    <div className="h-[72px] border-b border-white/[0.04] px-4 flex items-center justify-between shrink-0">

      <div>

        <div className="text-[18px] font-bold text-cyan-300">

          Upload Queue

        </div>

        <div className="text-xs text-white/35 mt-1">

          Active scheduled uploads

        </div>

      </div>

      <div className="flex items-center gap-3">

        <div className="w-[140px] h-[48px] rounded-xl bg-[#121926] border border-white/[0.05] px-3 flex flex-col justify-center">

          <div className="text-[9px] uppercase text-white/30">

            Bulk Auto

          </div>

          <div className="text-lg font-bold leading-none mt-1">

            OFF

          </div>

        </div>

        <button className="h-[48px] px-5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm font-semibold hover:bg-cyan-500/20 transition-all">

          Scan Folder

        </button>

      </div>

    </div>

  )

}
