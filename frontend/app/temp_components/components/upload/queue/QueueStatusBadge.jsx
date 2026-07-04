export default function QueueStatusBadge({ status, colorClass, retry, eta }) {

  return (

    <div className="shrink-0 text-right min-w-[90px]">

      <div className="flex items-center justify-end gap-2">

        <div className={`w-2 h-2 rounded-full ${colorClass}`} />

        <div className="text-sm font-bold">{status}</div>

      </div>

      <div className="mt-2 text-white/45 text-[11px]">

        Retry {retry}

      </div>

      <div className="mt-1 text-cyan-300 font-semibold text-sm">

        ETA {eta}

      </div>

    </div>

  )

}
