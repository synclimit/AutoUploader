export default function HistoryStatusBadge({ status }) {

  const colorClass =

    status === 'SUCCESS'
      ? 'bg-green-500/10 border border-green-500/20 text-green-300'
      : status === 'FAILED'
        ? 'bg-red-500/10 border border-red-500/20 text-red-300'
        : 'bg-orange-500/10 border border-orange-500/20 text-orange-300'


  return (

    <div className={`px-2 py-[5px] rounded-md text-[8px] font-semibold tracking-wide shrink-0 ${colorClass}`}>

      {status}

    </div>

  )

}
