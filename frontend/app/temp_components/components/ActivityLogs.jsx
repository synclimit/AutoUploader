const logs = [

  '[20:01] Queue initialized',

  '[20:03] 12 videos detected',

  '[20:05] Metadata generated',

  '[20:06] Upload started',

  '[20:08] Schedule synced',

  '[20:10] Upload completed',

  '[20:12] OCR processing started',

  '[20:14] Duplicate metadata detected',

  '[20:16] Retry engine initialized',

]


export default function ActivityLogs() {

  return (

    <div className="h-[170px] bg-[#101722] border border-white/[0.05] rounded-3xl overflow-hidden flex flex-col shrink-0">

      <div className="h-[54px] border-b border-white/[0.05] px-5 flex items-center justify-between shrink-0">

        <div className="text-sm font-bold text-orange-300 tracking-wide uppercase">

          Activity Logs

        </div>

        <div className="flex items-center gap-2">

          <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />

          <div className="text-xs text-white/35">

            LIVE

          </div>

        </div>

      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-[11px]">

        {logs.map((log, index) => (

          <div

            key={index}

            className="rounded-xl bg-white/[0.03] border border-white/[0.03] px-3 py-2 text-white/60 hover:bg-white/[0.05] transition-all"

          >

            {log}

          </div>

        ))}

      </div>

    </div>

  )

}