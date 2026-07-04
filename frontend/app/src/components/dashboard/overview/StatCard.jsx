import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function StatCard({ title, value, icon: Icon, trend, trendValue, iconBg = "bg-white/10 text-white/70" }) {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp size={12} className="text-green-400" />
    if (trend === 'down') return <TrendingDown size={12} className="text-red-400" />
    return <Minus size={12} className="text-white/40" />
  }

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-400'
    if (trend === 'down') return 'text-red-400'
    return 'text-white/40'
  }

  return (
    <div className="bg-[#101722]/80 backdrop-blur-md border border-white/[0.05] hover:bg-white/[0.03] hover:border-white/[0.1] transition-all duration-300 rounded-xl p-3 flex flex-col group relative overflow-hidden shadow-sm">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] rounded-full blur-2xl group-hover:bg-white/[0.04] transition-colors pointer-events-none" />

      <div className="flex justify-between items-start mb-2 relative z-10">
        <div className="flex flex-col">
          <span className="text-white/50 font-bold text-[11px] tracking-wide mb-0.5">{title}</span>
          <span className="text-white font-black text-[22px] tracking-tight leading-none drop-shadow-md">{value}</span>
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg} shadow-inner`}>
          <Icon size={16} strokeWidth={2.5} />
        </div>
      </div>
      
      {trendValue && (
        <div className="flex items-center gap-1.5 mt-auto relative z-10 pt-1.5 border-t border-white/[0.03]">
          {getTrendIcon()}
          <span className={`text-[10px] font-bold ${getTrendColor()}`}>
            {trendValue}
          </span>
        </div>
      )}
    </div>
  )
}
