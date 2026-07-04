import { useState } from 'react'

import TooltipHelper from '../../common/TooltipHelper'


const titleTemplates = [

  '{SONG} VIRAL TIKTOK TERBARU 2025',

  '{SONG} FULL BASS TERBARU 2025',

  '{SONG} DJ REMIX VIRAL 2025',

  '{SONG} SLOW BASS SANTAI 2025',

]


const descriptionBlocks = [

  'DJ remix viral terbaru untuk teman santai, kerja, dan perjalanan malam. Jangan lupa subscribe untuk update remix terbaru setiap hari.',

  'Dengarkan koleksi remix terbaik kami. Support terus channel ini agar kami bisa terus berkarya.',

  'Nikmati alunan bass terbaik pilihan untuk menemani aktivitas Anda. Subscribe untuk update setiap hari.',

]


const tagSets = [

  '#dj #remix #viral #tiktok #bass #music2025',

  '#djmix #music #viraltiktok #lagutherbaru #remix2025',

  '#djremix #bassmusic #tiktokviral #lagupopuler #musicplayer',

]


let templateIndex = 0


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


function SourceBadge({ label, color }) {

  const border = color === 'profile' ? 'border-purple-500/15 bg-purple-500/5' : 'border-[var(--accent-500)]/15 bg-[var(--accent-500)]/5'

  const text = color === 'profile' ? 'text-purple-300/80' : 'text-[var(--accent-400)]/80'

  const dot = color === 'profile' ? 'bg-purple-400' : 'bg-[var(--accent-400)]'

  return (

    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[8px] font-semibold uppercase tracking-wider ml-1.5 align-middle leading-none">

      <span className={`w-1 h-1 rounded-full ${dot} shrink-0`} />

      <span className={`${border} ${text} leading-none`}>

        {label}

      </span>

    </span>

  )

}


export default function MetadataEditor({ editData, setEditData }) {

  const handleGenerateTitle = () => {
    const template = titleTemplates[templateIndex % titleTemplates.length]
    templateIndex++
    const songName = 'DJ TABOLA BALE X CALON MANTU'
    setEditData({ ...editData, title: template.replace('{SONG}', songName) })
  }

  const handleGenerateDescription = () => {
    const block = descriptionBlocks[templateIndex % descriptionBlocks.length]
    templateIndex++
    setEditData({ ...editData, description: block })
  }

  const handleGenerateTags = () => {
    const tagSet = tagSets[templateIndex % tagSets.length]
    templateIndex++
    setEditData({ ...editData, tags: tagSet })
  }


  return (

    <>

      <Section title={

        <span className="flex items-center gap-1.5">

          Title

          <SourceBadge label="PROFILE" color="profile" />

          <TooltipHelper

            label=""

            tooltip="Song names should remain dominant in titles. SEO keywords are secondary. Example: 'DJ TABOLA BALE X CALON MANTU VIRAL TIKTOK TERBARU 2025'"

          />

        </span>

      }>

        <div className="flex gap-2 items-start">
          <input
            type="text"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            className="flex-1 min-h-[36px] rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 text-[12px] text-white/90 outline-none focus:border-[var(--accent-500)]/30 transition-all"
          />
          <button
            onClick={handleGenerateTitle}
            className="shrink-0 h-[36px] px-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-medium hover:bg-purple-500/20 hover:text-purple-200 transition-all flex items-center gap-1.5"
          >
            Generate
            <TooltipHelper
              label=""
              tooltip="Generate a title variation from account profile templates. Rotates through template patterns without AI usage."
            />
          </button>
        </div>

      </Section>


      <Section title={

        <span className="flex items-center gap-1.5">

          Description

          <SourceBadge label="PROFILE" color="profile" />

          <TooltipHelper

            label=""

            tooltip="Description blocks from the account profile template. Generate rotates through available template variations."

          />

        </span>

      }>

        <div className="flex gap-2 items-start">
          <textarea
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            className="flex-1 min-h-[80px] rounded-lg bg-white/[0.03] border border-white/[0.05] p-3 text-white/60 text-[11px] leading-relaxed outline-none resize-none focus:border-[var(--accent-500)]/30 transition-all"
          />
          <div className="shrink-0">
            <button
              onClick={handleGenerateDescription}
              className="h-[36px] px-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-medium hover:bg-purple-500/20 hover:text-purple-200 transition-all flex items-center justify-center gap-1.5"
            >
              Generate
              <TooltipHelper
                label=""
                tooltip="Generate a description block from account profile templates. Rotates through available template variations without AI usage."
              />
            </button>
          </div>
        </div>

      </Section>


      <Section title={

        <span className="flex items-center gap-1.5">

          Tags

          <SourceBadge label="PROFILE" color="profile" />

          <TooltipHelper

            label=""

            tooltip="Comma or space separated tags for better discoverability. These are used alongside profile template tags."

          />

        </span>

      }>

        <div className="flex gap-2 items-start">
          <input
            type="text"
            value={editData.tags}
            onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
            className="flex-1 min-h-[36px] rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 text-[12px] text-white/90 outline-none focus:border-[var(--accent-500)]/30 transition-all"
          />
          <button
            onClick={handleGenerateTags}
            className="shrink-0 h-[36px] px-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-medium hover:bg-purple-500/20 hover:text-purple-200 transition-all flex items-center gap-1.5"
          >
            Generate
            <TooltipHelper
              label=""
              tooltip="Generate a tag set from profile templates. Rotates through available tag patterns without AI usage."
            />
          </button>
        </div>

      </Section>


      <Section title={

        <span className="flex items-center gap-1.5">

          Thumbnail

          <TooltipHelper

            label=""

            tooltip="Custom thumbnail image for the video. If not provided, YouTube auto-generates thumbnails from the video."

          />

        </span>

      }>

        <div className="h-[72px] rounded-lg border border-dashed border-white/[0.08] bg-white/[0.02] flex items-center justify-center text-white/35 text-[11px] hover:border-[var(--accent-500)]/20 hover:text-white/50 transition-all cursor-pointer">
          Upload Thumbnail
        </div>

      </Section>

      <div className="grid grid-cols-2 gap-4">
        <Section title="Category">
          <select
            value={editData.category_id}
            onChange={(e) => setEditData({ ...editData, category_id: e.target.value })}
            className="w-full h-[36px] rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 text-[12px] text-white/90 outline-none focus:border-[var(--accent-500)]/30 transition-all appearance-none"
          >
            <option value="1">Film & Animation</option>
            <option value="2">Autos & Vehicles</option>
            <option value="10">Music</option>
            <option value="15">Pets & Animals</option>
            <option value="17">Sports</option>
            <option value="19">Travel & Events</option>
            <option value="20">Gaming</option>
            <option value="22">People & Blogs</option>
            <option value="23">Comedy</option>
            <option value="24">Entertainment</option>
            <option value="25">News & Politics</option>
            <option value="26">Howto & Style</option>
            <option value="27">Education</option>
            <option value="28">Science & Technology</option>
            <option value="29">Nonprofits & Activism</option>
          </select>
        </Section>

        <Section title="AI Content Declaration">
          <select
            value={editData.ai_use}
            onChange={(e) => setEditData({ ...editData, ai_use: e.target.value })}
            className="w-full h-[36px] rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 text-[12px] text-white/90 outline-none focus:border-[var(--accent-500)]/30 transition-all appearance-none"
          >
            <option value="UNKNOWN">Not Specified</option>
            <option value="YES">Yes (Altered or synthetic content)</option>
            <option value="NO">No</option>
          </select>
        </Section>

        <Section title="Default Language">
          <input
            type="text"
            placeholder="e.g. id, en"
            value={editData.default_language}
            onChange={(e) => setEditData({ ...editData, default_language: e.target.value })}
            className="w-full h-[36px] rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 text-[12px] text-white/90 outline-none focus:border-[var(--accent-500)]/30 transition-all"
          />
        </Section>

        <Section title="Audio Language">
          <input
            type="text"
            placeholder="e.g. id, en"
            value={editData.audio_language}
            onChange={(e) => setEditData({ ...editData, audio_language: e.target.value })}
            className="w-full h-[36px] rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 text-[12px] text-white/90 outline-none focus:border-[var(--accent-500)]/30 transition-all"
          />
        </Section>

        <Section title="Recording Date">
          <input
            type="date"
            value={editData.recording_date}
            onChange={(e) => setEditData({ ...editData, recording_date: e.target.value })}
            className="w-full h-[36px] rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 text-[12px] text-white/90 outline-none focus:border-[var(--accent-500)]/30 transition-all"
          />
        </Section>
      </div>

    </>

  )

}
