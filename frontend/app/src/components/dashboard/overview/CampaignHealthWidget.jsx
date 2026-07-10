import React from 'react'
import { ShieldCheck, AlertTriangle, AlertOctagon, FolderX } from 'lucide-react'

export default function CampaignHealthWidget({ counts = {}, onFilterSelect, activeFilter }) {
  const items = [
    {
      id: 'Healthy',
      label: 'Healthy',
      count: counts.healthy || 0,
      icon: ShieldCheck,
      color: 'text-green-400',
      bg: 'bg-green-500/10 border-green-500/30',
      activeBg: 'bg-green-500/20 border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.2)]'
    },
    {
      id: 'Low',
      label: 'Low',
      count: counts.low || 0,
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
      activeBg: 'bg-amber-500/20 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
    },
    {
      id: 'Critical',
      label: 'Critical',
      count: counts.critical || 0,
      icon: AlertOctagon,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10 border-orange-500/30',
      activeBg: 'bg-orange-500/20 border-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.2)]'
    },
    {
      id: 'Empty',
      label: 'Empty',
      count: counts.empty || 0,
      icon: FolderX,
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/30',
      activeBg: 'bg-red-500/20 border-red-400 shadow-[0_0_15px_rgba(248,113,113,0.2)]'
    }
  ]

  return (
    <div className="flex items-center gap-2 bg-[#08181f]/90 border border-[var(--accent-500)]/20 p-2 rounded-[10px] shrink-0">
      <span className="text-[11px] font-extrabold text-white/70 uppercase tracking-wider px-2">
        Campaign Health:
      </span>
      <div className="flex items-center gap-1.5">
        {items.map(item => {
          const Icon = item.icon
          const isActive = activeFilter === item.id
          return (
            <button
              key={item.id}
              onClick={() => onFilterSelect && onFilterSelect(isActive ? 'All' : item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border transition-all duration-200 cursor-pointer ${
                isActive ? item.activeBg : `${item.bg} hover:border-white/30`
              }`}
            >
              <Icon size={14} className={item.color} />
              <span className="text-[12px] font-bold text-white/90">{item.label}</span>
              <span className={`text-[12px] font-black px-1.5 py-0.5 rounded-[4px] bg-black/40 ${item.color}`}>
                {item.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
