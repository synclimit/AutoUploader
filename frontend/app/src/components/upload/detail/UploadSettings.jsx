import { useState } from 'react'
import TooltipHelper from '../../common/TooltipHelper'


function Section({ title, children }) {

  return (

    <div>

      <div className="text-[10px] uppercase tracking-wide text-white/35 mb-2">

        {title}

      </div>

      {children}

    </div>

  )

}


function Select({ value }) {
  return (
    <div className="h-[36px] rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 flex items-center justify-between text-white/85 text-[12px]">
      <span>{value}</span>
      <span className="text-white/30 text-[10px]">
        ▼
      </span>
    </div>
  )
}


export default function UploadSettings() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] overflow-hidden shrink-0">
      <div 
        className={`h-[48px] px-3 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] ${isExpanded ? 'border-b border-white/[0.05]' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-1.5">
          <div>
            <div className="text-[13px] font-bold text-[var(--accent-400)]">
              Advanced Upload Settings
            </div>
            <div className="text-[9px] text-white/35 mt-0.5">
              YouTube metadata & compliance settings
            </div>
          </div>
          <TooltipHelper
            label=""
            tooltip="Configure upload behavior including schedule, visibility, category, and playlist settings."
          />
        </div>
        <div className="text-white/30 text-xs">
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>
      {isExpanded && (
        <div className="p-3 space-y-3">

        <div className="grid grid-cols-2 gap-3">

          <Section title={

            <span className="flex items-center gap-1">

              Schedule

              <TooltipHelper

                label=""

                tooltip="Scheduled date and time for the upload. Future scheduler may apply humanized offsets based on target region for optimal engagement."

              />

            </span>

          }>

            <Select value="Today • 20:00" />

          </Section>

          <Section title={

            <span className="flex items-center gap-1">

              Visibility

              <TooltipHelper

                label=""

                tooltip="Video visibility on YouTube. Public = visible to everyone. Unlisted = only people with the link. Private = only you."

              />

            </span>

          }>

            <Select value="Public" />

          </Section>

        </div>

        <div className="grid grid-cols-2 gap-3">

          <Section title={

            <span className="flex items-center gap-1">

              For Kids

              <TooltipHelper

                label=""

                tooltip="YouTube COPPA compliance. Indicates whether the video is made for children. Affects features like comments and personalized ads."

              />

            </span>

          }>

            <Select value="No, Not Made For Kids" />

          </Section>

          <Section title={

            <span className="flex items-center gap-1">

              Altered Content

              <TooltipHelper

                label=""

                tooltip="Disclose if the video contains altered or synthetic content (AI-generated). Required for YouTube compliance."

              />

            </span>

          }>

            <Select value="No" />

          </Section>

        </div>

        <div className="grid grid-cols-2 gap-3">

          <Section title={

            <span className="flex items-center gap-1">

              Category

              <TooltipHelper

                label=""

                tooltip="YouTube video category for better discoverability and recommendations. Common: Music, Entertainment, Education."

              />

            </span>

          }>

            <Select value="Music" />

          </Section>

          <Section title={

            <span className="flex items-center gap-1">

              Playlist

              <TooltipHelper

                label=""

                tooltip="Add the video to a YouTube playlist automatically on upload. Playlists help organize content and increase watch time."

              />

            </span>

          }>

            <Select value="DJ Remix Viral" />

          </Section>

        </div>

        </div>
      )}
    </div>

  )

}
