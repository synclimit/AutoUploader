import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react'

export default function NotificationCenter({ notifications = [] }) {
  if (!notifications || notifications.length === 0) {
    return (
      <div className="h-[40px] shrink-0 bg-green-500/5 border border-green-500/10 rounded-[8px] flex items-center px-4 gap-2">
        <CheckCircle2 size={14} className="text-green-400" />
        <span className="text-[12px] font-bold text-green-400">System Healthy</span>
      </div>
    )
  }

  // Assuming notifications array looks like: [{ id: 1, type: 'error', message: 'Upload Failed' }]
  // For compactness, display up to 3 notifications. If more, show a "View all" link.
  const displayNotifs = notifications.slice(0, 3)
  const hasMore = notifications.length > 3

  const getIcon = (type) => {
    if (type === 'error') return <XCircle size={14} className="text-red-400 shrink-0" />
    if (type === 'warning') return <AlertTriangle size={14} className="text-amber-400 shrink-0" />
    return <Info size={14} className="text-blue-400 shrink-0" />
  }

  return (
    <div className="shrink-0 bg-red-500/5 border border-red-500/10 rounded-[8px] flex flex-col p-2 gap-1.5 max-h-[90px] overflow-hidden">
      {displayNotifs.map(notif => (
        <div key={notif.id} className="flex items-center gap-2 px-2 py-0.5">
          {getIcon(notif.type)}
          <span className="text-[12px] font-bold text-white/90 truncate">{notif.message}</span>
        </div>
      ))}
      {hasMore && (
        <div className="flex items-center gap-2 px-2 py-0.5 mt-1 border-t border-red-500/10 pt-1">
          <span className="text-[11px] font-bold text-red-400 cursor-pointer hover:text-red-300">Show {notifications.length - 3} More</span>
        </div>
      )}
    </div>
  )
}
