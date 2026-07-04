import { Clock } from 'lucide-react'

export default function FooterStatus({ engine }) {
  if (!engine) return null
  return (
    <div className="mt-1 border-t border-white/[0.04] pt-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-white/50 text-[12px] font-medium">
          <div className={`w-1.5 h-1.5 rounded-full ${engine.status === 'operational' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.4)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.4)]'}`}></div>
          System Status: {engine.status === 'operational' ? 'All systems operational' : engine.status}
        </div>
        <div className="flex items-center gap-1.5 text-white/30 text-[12px] font-medium">
          <Clock size={12} />
          Uptime: {engine.uptime}
        </div>
      </div>
      <div className="text-white/30 text-[12px] font-medium flex items-center gap-4">
        <span>Workers: {engine.worker_count}</span>
        <span>AutoUploader v1.0.0</span>
      </div>
    </div>
  )
}
