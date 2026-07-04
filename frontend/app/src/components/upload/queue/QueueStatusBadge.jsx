import TooltipHelper from '../../common/TooltipHelper'


export default function QueueStatusBadge({ status, colorClass, retry, eta }) {

  return (

    <div className="shrink-0 text-right min-w-[90px]">

      <div className="flex items-center justify-end gap-2">

        <TooltipHelper

          label=""

          tooltip={`Current processing status: ${status}. Indicates whether the upload is queued, processing, scheduled, or has failed.`}

        />

        <div className="text-sm font-bold">{status}</div>

        <div className={`w-2 h-2 rounded-full ${colorClass}`} />

      </div>

      <div className="mt-2 text-white/45 text-[11px] flex items-center justify-end gap-1">

        Retry {retry}

        <TooltipHelper

          label=""

          tooltip={`Retry attempt ${retry}. Number of times the system has retried this upload after failure.`}

        />

      </div>

      <div className="mt-1 text-[var(--accent-400)] font-semibold text-sm flex items-center justify-end gap-1">

        ETA {eta}

        <TooltipHelper

          label=""

          tooltip={`Estimated time before processing starts: ${eta}. Actual time may vary based on queue position and processing speed.`}

        />

      </div>

    </div>

  )

}
