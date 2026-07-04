import { AlertTriangle, ShieldAlert, Bot, UploadCloud, TrendingUp, CheckCircle2 } from 'lucide-react'

export default function TodaysFocus() {
  const actions = [
    { id: 1, title: 'Critical Error', description: 'Database connection unstable.', icon: ShieldAlert, colorClass: 'text-red-400', bgClass: 'bg-red-500/10', borderClass: 'border-red-500/20', urgency: 1 },
    { id: 2, title: 'Upload Failed', description: '2 uploads failed. Needs review.', icon: AlertTriangle, colorClass: 'text-red-400', bgClass: 'bg-red-500/10', borderClass: 'border-red-500/20', urgency: 2 },
    { id: 3, title: 'OAuth Expired', description: 'Zidny Life requires re-authentication.', icon: ShieldAlert, colorClass: 'text-amber-400', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/20', urgency: 3 },
    { id: 4, title: 'AI Waiting', description: '4 videos waiting for metadata.', icon: Bot, colorClass: 'text-amber-400', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/20', urgency: 4 },
    { id: 5, title: 'Queue Waiting', description: '12 uploads in queue.', icon: UploadCloud, colorClass: 'text-blue-400', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500/20', urgency: 5 },
    { id: 6, title: 'System Healthy', description: 'All systems operational.', icon: CheckCircle2, colorClass: 'text-green-400', bgClass: 'bg-green-500/10', borderClass: 'border-green-500/20', urgency: 10 }
  ]

  // Smart Priority Sort: Urgency 1 (Highest) to 10 (Lowest)
  const sortedActions = [...actions].sort((a, b) => a.urgency - b.urgency).slice(0, 4) // Show top 4

  const ActionCard = ({ title, description, icon: Icon, colorClass, bgClass, borderClass }) => (
    <div className={`p-3 rounded-[12px] border ${borderClass} ${bgClass} flex flex-col gap-2 hover:opacity-80 cursor-pointer transition-opacity shrink-0`}>
      <div className="flex items-center gap-2">
        <Icon size={14} className={colorClass} />
        <span className={`text-[12px] font-bold ${colorClass}`}>{title}</span>
      </div>
      <span className="text-[11px] font-medium text-white/70 leading-tight">{description}</span>
    </div>
  )

  return (
    <div className="flex flex-col gap-3 shrink-0">
      <h2 className="text-[14px] font-bold text-white tracking-wide">Today's Operations</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sortedActions.map(action => (
          <ActionCard key={action.id} {...action} />
        ))}
      </div>
    </div>
  )
}
