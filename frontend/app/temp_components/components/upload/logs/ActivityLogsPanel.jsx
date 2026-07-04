import LogItem from './LogItem'
import { useUploadStore } from '../../../store/upload/uploadStore'


export default function ActivityLogsPanel() {

  const logs = useUploadStore((s) => s.logs)


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

          <LogItem key={index} log={log} />

        ))}

      </div>

    </div>

  )

}
