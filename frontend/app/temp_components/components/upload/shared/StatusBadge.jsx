export default function StatusBadge({ status, colorClass }) {

  return (

    <div className="flex items-center justify-end gap-2">

      <div className={`w-2 h-2 rounded-full ${colorClass}`} />

      <div className="text-sm font-bold">{status}</div>

    </div>

  )

}
