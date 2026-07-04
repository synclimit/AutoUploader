import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function AnalyticsCard({ data }) {
  // Format data for Recharts: [{name: "Mon", uploads: 10}, ...]
  const chartData = useMemo(() => {
    if (!data || !data.labels || !data.uploads) return []
    return data.labels.map((label, index) => ({
      name: label,
      uploads: data.uploads[index] || 0,
      completed: data.completed[index] || 0,
      failed: data.failed[index] || 0
    }))
  }, [data])

  return (
    <div className="bg-[#05080e]/60 backdrop-blur-2xl border border-white/[0.08] rounded-[20px] p-5 flex flex-col relative overflow-hidden h-full min-h-0 shadow-[0_8px_32px_rgba(0,0,0,0.4)] group hover:border-[var(--accent-500)]/20 transition-colors duration-300">
      
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--accent-500)]/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-[var(--accent-500)]/10 transition-colors"></div>

      {/* Header */}
      <div className="flex justify-between items-start mb-2 z-10 shrink-0">
        <h2 className="text-white font-bold text-sm tracking-wide">Uploads Last {data?.period || '7d'}</h2>
        <span className="px-2.5 py-1 bg-[var(--accent-500)]/10 border border-[var(--accent-500)]/30 text-[var(--accent-400)] text-[9px] font-bold uppercase tracking-widest rounded-full shadow-[0_0_15px_var(--color-primary-cyan)]">
          Live
        </span>
      </div>

      {/* Chart */}
      <div className="flex-1 w-full min-h-0 z-10 opacity-70 group-hover:opacity-90 transition-opacity duration-300">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 15, right: 0, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 500 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 500 }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0d121c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
              itemStyle={{ color: '#22d3ee', fontWeight: 'bold' }}
              cursor={{ stroke: 'rgba(34,211,238,0.2)', strokeWidth: 1 }}
            />
            <Area 
              type="monotone" 
              dataKey="uploads" 
              stroke="#22d3ee" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorUploads)" 
              activeDot={{ r: 5, fill: '#22d3ee', stroke: '#05070b', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
    </div>
  )
}
