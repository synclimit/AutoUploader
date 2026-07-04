export default function LogItem({ log }) {
  if (typeof log === 'string') {
    return (
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.03] px-3 py-2 text-white/60 hover:bg-white/[0.05] transition-all font-mono text-[11px]">
        {log}
      </div>
    )
  }

  const time = new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.03] px-3 py-2 text-white/60 hover:bg-white/[0.05] transition-all font-mono text-[11px] flex gap-2">
      <span className="text-white/40 shrink-0">[{time}]</span>
      <span className="break-all">{log.message}</span>
    </div>
  )
}
