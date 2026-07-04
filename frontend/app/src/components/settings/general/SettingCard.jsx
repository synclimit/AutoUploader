export default function SettingCard({ title, value, color }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#141821] px-3 py-2 flex flex-col justify-center min-h-[46px]">
      <div className="text-[10px] font-medium text-white/90 truncate">{title}</div>
      <div className={`text-[10px] flex items-center gap-1.5 mt-0.5 capitalize ${color}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-current" /> {value.toLowerCase()}
      </div>
    </div>
  )
}
