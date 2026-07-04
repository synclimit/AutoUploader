export default function SettingCard({ title, value, color }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#141821] px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.08em] text-white/35 font-medium">
            {title}
          </div>

          <div className={`mt-2 text-[20px] font-semibold ${color}`}>
            {value}
          </div>
        </div>

        <div className="w-2 h-2 rounded-full bg-green-400 mt-1 shrink-0" />
      </div>
    </div>
  )
}
