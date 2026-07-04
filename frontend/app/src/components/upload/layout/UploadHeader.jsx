import TooltipHelper from '../../common/TooltipHelper'


export default function UploadHeader() {

  return (

    <div className="h-[72px] border-b border-white/[0.04] px-4 flex items-center justify-between shrink-0">

      <div>

        <h1 className="text-[18px] font-bold text-[var(--accent-400)]">

          Upload Queue

        </h1>

        <div className="text-xs text-white/35 mt-1">

          <TooltipHelper

            label="Active scheduled uploads"

            tooltip="Upload queue displays all videos scheduled for processing and publishing to YouTube."

          />

        </div>

      </div>

    </div>

  )

}
