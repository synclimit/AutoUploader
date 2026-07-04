export default function SettingsLogItem({ message }) {
  return (
    <div className="rounded-xl border border-white/[0.03] bg-white/[0.025] px-3 py-2 snap-start min-h-[54px] flex items-center leading-relaxed">
      {message}
    </div>
  )
}
