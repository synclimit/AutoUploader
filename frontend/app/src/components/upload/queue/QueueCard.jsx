import QueueStatusBadge from './QueueStatusBadge'

import TooltipHelper from '../../common/TooltipHelper'


const statusColor = {

  FAILED: 'bg-red-400',

  SCANNING: 'bg-blue-400',

}


const sourceStyles = {

  MANUAL: 'border-[var(--accent-500)]/15 bg-[var(--accent-500)]/10 text-[var(--accent-400)]/80',

  'SCAN FOLDER': 'border-green-500/15 bg-green-500/10 text-green-300/80',

  'WATCH FOLDER': 'border-yellow-500/15 bg-yellow-500/10 text-yellow-300/80',

}


const parseUTC = (iso) => {
  if (!iso) return null;
  let str = iso;
  if (typeof str === 'string' && !str.endsWith('Z') && !str.includes('+') && !str.includes('-')) {
    str = str.replace(' ', 'T') + 'Z';
  }
  return new Date(str);
};

export default function QueueCard({ item, isActive, onClick }) {
  const source = item.source_type === 'M1_VIDEO_SPLITTER' ? 'M1' : item.source_type === 'M3_PLAYLIST_BUILDER' ? 'M3' : 'MANUAL'
  const sourceStyle = source === 'M1' ? sourceStyles['SCAN FOLDER'] : source === 'M3' ? sourceStyles['WATCH FOLDER'] : sourceStyles.MANUAL


  return (

    <div
      onClick={onClick}
      className={`rounded-xl border p-2.5 transition-all cursor-pointer ${
        isActive
          ? 'border-[var(--accent-500)]/30 bg-[var(--accent-500)]/[0.04]'
          : 'border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04]'
      }`}
    >

      <div className="flex gap-2.5">

        <div className="w-[44px] h-[44px] rounded-lg bg-[#232938] border border-white/[0.05] shrink-0 flex items-center justify-center text-white/15 text-base">

          ♪

        </div>

        <div className="flex-1 min-w-0">

          <div className="flex items-start justify-between gap-3">

            <div className="min-w-0 flex-1">

              <div className="flex items-center gap-2">

                <div className="text-[14px] leading-tight font-bold text-white break-words truncate">
                  {item.title || item.package_folder?.split('\\').pop()?.split('/').pop() || 'Untitled Task'}
                </div>

                {/* QUEUE SOURCE BADGE */}

                <span className={`shrink-0 px-1.5 py-[1px] rounded-md border text-[8px] font-semibold uppercase tracking-wider ${sourceStyle}`}>

                  {source}

                </span>

              <TooltipHelper

                label=""

                tooltip={`Queue source: ${source === 'MANUAL' ? 'Video was manually imported by the user.' : source === 'SCAN FOLDER' ? 'Video was imported via folder scan.' : 'Video was automatically imported from a watched folder.'}`}

              />

              </div>

              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-white/45">
                {item.scheduled_at && <span>{parseUTC(item.scheduled_at).toLocaleString()}</span>}
                {item.scheduled_at && <span>•</span>}

                <TooltipHelper

                  label=""

                  tooltip={`YouTube channel: ${item.channel}. Profile templates, watch folder, and region are inherited from this account.`}

                />

                <span>Account: {item.account_id?.substring(0,8)}</span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-[var(--accent-400)] font-semibold">
                  {item.source_type}
                </span>
                <span className="text-purple-300 font-semibold">
                  {item.metadata_source}
                </span>
              </div>

              {item.retry_count > 0 && (
                <div className="mt-1.5 inline-flex items-center px-2.5 py-1 rounded-lg border border-yellow-500/20 bg-yellow-500/10 text-yellow-300 text-[10px] font-medium">
                  Retry: {item.retry_count}/3
                </div>
              )}

            </div>

            <QueueStatusBadge
              status={item.status}
              colorClass={statusColor[item.status]}
              retry={item.retry_count > 0 ? `${item.retry_count}/3` : null}
            />

          </div>

          {/* HUMANIZED SCHEDULER PREP — show schedule time for future use */}
          {item.scheduled_at && (
            <div className="mt-1 flex items-center gap-1 text-[9px] text-white/20">
              Target: {parseUTC(item.scheduled_at).toLocaleString()}
              <TooltipHelper
                label=""
                tooltip="Scheduled upload time."
              />
            </div>
          )}

          <div className="mt-1.5 h-[2px] bg-white/[0.05] rounded-full overflow-hidden">

            <div

              className="h-full bg-[var(--accent-400)] rounded-full"

              style={{ width: `${item.progress}%` }}

            />

          </div>

        </div>

      </div>

    </div>

  )

}
