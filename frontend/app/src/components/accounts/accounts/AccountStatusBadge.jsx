export default function AccountStatusBadge({ status }) {

  const colorClass =

    status === "ACTIVE"
      ? "text-green-300 border-green-500/20 bg-green-500/10"
      : status === "WARNING"
        ? "text-orange-300 border-orange-500/20 bg-orange-500/10"
        : "text-red-300 border-red-500/20 bg-red-500/10"


  return (

    <div className={`h-[28px] px-3 rounded-lg border text-[10px] font-semibold flex items-center shrink-0 ${colorClass}`}>

      {status}

    </div>

  )

}
