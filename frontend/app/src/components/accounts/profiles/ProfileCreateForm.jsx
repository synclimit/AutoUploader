import { useState } from 'react'
import TooltipHelper from '../../common/TooltipHelper'
import { useProfileStore } from '../../../store/profiles/profileStore'

export default function ProfileCreateForm({ onCancel }) {
  const { createProfile } = useProfileStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [contentType, setContentType] = useState('Longform (16:9)')
  const [metadataStrategy, setMetadataStrategy] = useState('Template Only')
  const [apiMode, setApiMode] = useState('Balanced')
  const [approvalQueue, setApprovalQueue] = useState('Always Review')

  const [category, setCategory] = useState('20')
  const [language, setLanguage] = useState('en')
  const [audience, setAudience] = useState('not_kids')
  const [license, setLicense] = useState('standard')
  const [thumbnailRules, setThumbnailRules] = useState('')
  const [aiPreset, setAiPreset] = useState('gaming_v1')
  const [promptTemplate, setPromptTemplate] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) return
    await createProfile({
      name,
      description,
      content_type: contentType,
      metadata_strategy: metadataStrategy,
      category,
      language,
      audience,
      license,
      thumbnail_rules: thumbnailRules,
      ai_preset: aiPreset,
      prompt_template: promptTemplate
    })
    onCancel()
  }
  
  const [isAddingTitle, setIsAddingTitle] = useState(false)
  const [isBulkingTitle, setIsBulkingTitle] = useState(false)
  const [isAddingDesc, setIsAddingDesc] = useState(false)
  const [isBulkingDesc, setIsBulkingDesc] = useState(false)
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [isBulkingTag, setIsBulkingTag] = useState(false)

  return (
    <div className="flex-1 min-h-0 bg-[#141821] border border-purple-500/20 rounded-2xl overflow-hidden flex flex-col">
      <div className="h-[64px] border-b border-white/5 px-5 flex items-center shrink-0">
        <div>
          <div className="text-sm font-semibold text-purple-300">Create New Profile</div>
          <div className="text-[11px] text-white/40 mt-1">
            <TooltipHelper label="Configure new metadata rules & templates" tooltip="Set strategies for how metadata is generated across assigned channels." />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 scroll-smooth overscroll-contain space-y-5">
        
        {/* GENERAL SECTION */}
        <div>
          <div className="text-[11px] font-bold text-white/90 mb-3 tracking-wide">General</div>
          <div className="space-y-1.5">
            <div className="min-h-[72px] flex flex-col justify-center border-b border-white/[0.02] py-1.5">
              <Section title={<span className="flex items-center gap-1">Profile Name <TooltipHelper label="" tooltip="Internal identifier for this profile configuration."/></span>}>
                <Input value={name} onChange={setName} placeholder="e.g. DJ Remix Factory" />
              </Section>
            </div>
            <div className="min-h-[72px] flex flex-col justify-center border-b border-white/[0.02] py-1.5">
              <Section title="Description">
                <TextArea text={description} onChange={setDescription} placeholder="Enter a description for this profile..." />
              </Section>
            </div>
            <div className="grid grid-cols-2 gap-3 min-h-[82px] items-center border-b border-white/[0.02] py-1.5">
              <Section title="Content Type">
                <Select value={contentType} onChange={setContentType} options={['Longform (16:9)', 'Shorts (9:16)']} />
              </Section>
              <Section title={<span className="flex items-center gap-1">Metadata Strategy <TooltipHelper label="" tooltip="Determines if Gemini AI should assist in rewriting or generating metadata based on these templates."/></span>}>
                <Select value={metadataStrategy} onChange={setMetadataStrategy} options={['Template Only', 'Gemini Assisted', 'Gemini Full']} />
              </Section>
            </div>
            <div className="grid grid-cols-2 gap-3 min-h-[82px] items-center border-b border-white/[0.02] py-1.5">
              <Section title={<span className="flex items-center gap-1">Gemini API Mode <TooltipHelper label="" tooltip="AI generation profile for this specific channel."/></span>}>
                <Select value={apiMode} onChange={setApiMode} options={['Balanced', 'Creative', 'Strict']} />
              </Section>
              <Section title={<span className="flex items-center gap-1">Approval Queue <TooltipHelper label="" tooltip="Post-generation review requirement."/></span>}>
                <Select value={approvalQueue} onChange={setApprovalQueue} options={['Always Review', 'Auto Approve']} />
              </Section>
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-white/[0.02]" />

        {/* METADATA & AI SETTINGS SECTION */}
        <div>
          <div className="text-[11px] font-bold text-white/90 mb-3 tracking-wide">Metadata & AI Settings</div>
          <div className="space-y-1.5">
            <div className="grid grid-cols-4 gap-3 min-h-[82px] items-center border-b border-white/[0.02] py-1.5">
              <Section title="Category">
                <Input value={category} onChange={setCategory} placeholder="e.g. 20" />
              </Section>
              <Section title="Audience">
                <Select value={audience} onChange={setAudience} options={['not_kids', 'kids']} />
              </Section>
              <Section title="License">
                <Select value={license} onChange={setLicense} options={['standard', 'creativeCommon']} />
              </Section>
              <Section title="Language">
                <Select value={language} onChange={setLanguage} options={['en', 'id', 'es', 'ja', 'ko']} />
              </Section>
            </div>
            <div className="grid grid-cols-2 gap-3 min-h-[82px] items-center border-b border-white/[0.02] py-1.5">
              <Section title={<span className="flex items-center gap-1">AI Preset <TooltipHelper label="" tooltip="AI generation profile for this specific channel."/></span>}>
                <Select value={aiPreset} onChange={setAiPreset} options={['gaming_v1', 'vlog', 'tech']} />
              </Section>
              <Section title={<span className="flex items-center gap-1">Approval Queue <TooltipHelper label="" tooltip="Post-generation review requirement."/></span>}>
                <Select value={approvalQueue} onChange={setApprovalQueue} options={['Always Review', 'Auto Approve']} />
              </Section>
            </div>
            <div className="min-h-[72px] flex flex-col justify-center border-b border-white/[0.02] py-1.5">
              <Section title={<span className="flex items-center gap-1">Prompt Template <TooltipHelper label="" tooltip="Custom instructions for Gemini AI when generating metadata."/></span>}>
                <TextArea text={promptTemplate} onChange={setPromptTemplate} placeholder="Enter prompt template for AI..." />
              </Section>
            </div>
            <div className="min-h-[72px] flex flex-col justify-center border-b border-white/[0.02] py-1.5">
              <Section title={<span className="flex items-center gap-1">Thumbnail Rules <TooltipHelper label="" tooltip="Rules for selecting or generating thumbnails."/></span>}>
                <TextArea text={thumbnailRules} onChange={setThumbnailRules} placeholder="Enter rules for thumbnail selection..." />
              </Section>
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-white/[0.02]" />

        {/* AVAILABLE VARIABLES SECTION */}
        <div>
          <div className="text-[11px] font-bold text-white/90 mb-3 tracking-wide">Available Variables</div>
          <div className="flex flex-wrap gap-2">
            <VariablePill name="{TITLE}" tooltip="The original title from the video file." />
            <VariablePill name="{CHANNEL}" tooltip="The target YouTube channel name." />
            <VariablePill name="{YEAR}" tooltip="Current year (e.g., 2025)." />
            <VariablePill name="{PROFILE}" tooltip="Name of this profile." />
            <VariablePill name="{REGION}" tooltip="Target region of the account." />
          </div>
        </div>

        <div className="h-[1px] bg-white/[0.02]" />

        {/* TITLE TEMPLATES SECTION */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-bold text-white/90 tracking-wide">Title Templates (0)</div>
            {!isAddingTitle && !isBulkingTitle && (
              <div className="flex items-center gap-3">
                <button onClick={() => setIsBulkingTitle(true)} className="text-[10px] font-bold text-[var(--accent-400)] hover:text-[var(--accent-400)]">
                  Bulk Import
                </button>
                <button onClick={() => setIsAddingTitle(true)} className="text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1">
                  <span>+</span> Add
                </button>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Section title={<span className="flex items-center gap-1">Title List <TooltipHelper label="" tooltip="Variables like {TITLE} will be replaced dynamically during generation."/></span>}>
              {isAddingTitle ? (
                <TemplateEditor onCancel={() => setIsAddingTitle(false)} placeholder="Enter title template containing {TITLE}..." />
              ) : isBulkingTitle ? (
                <BulkImportEditor onCancel={() => setIsBulkingTitle(false)} placeholder="Paste templates here (1 per line)..." />
              ) : (
                <div className="flex items-center justify-center h-[60px] rounded-lg border border-white/5 bg-white/[0.02] text-[10px] text-white/30 border-dashed mt-1">
                  No title templates configured
                </div>
              )}
            </Section>
          </div>
        </div>

        <div className="h-[1px] bg-white/[0.02]" />

        {/* DESCRIPTION TEMPLATES SECTION */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-bold text-white/90 tracking-wide">Description Templates (0)</div>
            {!isAddingDesc && !isBulkingDesc && (
              <div className="flex items-center gap-3">
                <button onClick={() => setIsBulkingDesc(true)} className="text-[10px] font-bold text-[var(--accent-400)] hover:text-[var(--accent-400)]">
                  Bulk Import
                </button>
                <button onClick={() => setIsAddingDesc(true)} className="text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1">
                  <span>+</span> Add
                </button>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Section title={<span className="flex items-center gap-1">Description List <TooltipHelper label="" tooltip="Block templates for assembling the video description."/></span>}>
              {isAddingDesc ? (
                <TemplateEditor onCancel={() => setIsAddingDesc(false)} placeholder="Enter description block template..." isMultiline />
              ) : isBulkingDesc ? (
                <BulkImportEditor onCancel={() => setIsBulkingDesc(false)} placeholder="Paste templates here (1 per line)..." />
              ) : (
                <div className="flex items-center justify-center h-[60px] rounded-lg border border-white/5 bg-white/[0.02] text-[10px] text-white/30 border-dashed mt-1">
                  No description templates configured
                </div>
              )}
            </Section>
          </div>
        </div>

        <div className="h-[1px] bg-white/[0.02]" />

        {/* TAG TEMPLATES SECTION */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-bold text-white/90 tracking-wide">Tag Templates (0)</div>
            {!isAddingTag && !isBulkingTag && (
              <div className="flex items-center gap-3">
                <button onClick={() => setIsBulkingTag(true)} className="text-[10px] font-bold text-[var(--accent-400)] hover:text-[var(--accent-400)]">
                  Bulk Import
                </button>
                <button onClick={() => setIsAddingTag(true)} className="text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1">
                  <span>+</span> Add
                </button>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Section title={<span className="flex items-center gap-1">Tag List <TooltipHelper label="" tooltip="Base tags applied to every upload."/></span>}>
              {isAddingTag ? (
                <TemplateEditor onCancel={() => setIsAddingTag(false)} placeholder="Enter comma separated tags..." />
              ) : isBulkingTag ? (
                <BulkImportEditor onCancel={() => setIsBulkingTag(false)} placeholder="Paste tags here (1 per line)..." />
              ) : (
                <div className="flex items-center justify-center h-[40px] rounded-lg border border-white/5 bg-white/[0.02] text-[10px] text-white/30 border-dashed mt-1">
                  No tags configured
                </div>
              )}
            </Section>
          </div>
        </div>



      </div>

      <div className="border-t border-white/5 p-4 flex gap-3 bg-[#11141b] shrink-0">
        <button onClick={onCancel} className="flex-[0.5] bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-1.5 text-sm text-white/70 font-medium transition-all">
          Cancel
        </button>
        <button onClick={handleCreate} className="flex-1 bg-purple-500/15 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 rounded-xl py-1.5 text-sm font-medium transition-all disabled:opacity-50">
          Create Profile
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-white/35 mb-1">
        {title}
      </div>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-[34px] rounded-lg bg-white/[0.03] border border-white/5 px-2.5 text-[11px] text-white/85 outline-none focus:border-purple-500/30 transition-all"
    />
  )
}

function TextArea({ text, onChange, placeholder }) {
  return (
    <textarea
      value={text}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full min-h-[60px] rounded-lg bg-white/[0.03] border border-white/5 p-2.5 text-[10px] text-white/85 leading-snug outline-none focus:border-purple-500/30 transition-all resize-y"
    />
  )
}

function Select({ value, onChange, options = [] }) {
  return (
    <div className="relative">
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-[34px] rounded-lg bg-white/[0.03] border border-white/5 px-2.5 text-[11px] text-white/85 outline-none appearance-none cursor-pointer focus:border-purple-500/30 transition-all">
        {options.map((opt, i) => (
          <option key={i} value={opt} className="bg-[#141821] text-white">{opt}</option>
        ))}
      </select>
      <span className="absolute right-2.5 top-[10px] text-[10px] text-white/30 pointer-events-none">▼</span>
    </div>
  )
}

function TemplateEditor({ onCancel, placeholder, isMultiline }) {
  const [value, setValue] = useState('')

  return (
    <div className="mt-2 rounded-xl border border-purple-500/30 bg-purple-500/5 p-3 flex flex-col gap-3">
      {isMultiline ? (
        <textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[60px] rounded-lg bg-white/[0.03] border border-white/10 p-2.5 text-[11px] text-white/90 leading-snug outline-none focus:border-purple-500/50 transition-all resize-y"
        />
      ) : (
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full h-[34px] rounded-lg bg-white/[0.03] border border-white/10 px-2.5 text-[11px] text-white/90 outline-none focus:border-purple-500/50 transition-all"
        />
      )}

      <div className="flex items-center justify-end gap-2 mt-1">
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white/50 hover:text-white/80 transition-colors">
          Cancel
        </button>
        <button onClick={onCancel} className="px-4 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-[10px] font-bold text-purple-300 hover:bg-purple-500/30 transition-colors">
          Save Template
        </button>
      </div>
    </div>
  )
}

function BulkImportEditor({ onCancel, placeholder }) {
  const [value, setValue] = useState('')
  const [importMode, setImportMode] = useState('Append To Existing')
  
  const lineCount = value.split('\n').filter(l => l.trim().length > 0).length

  return (
    <div className="mt-2 rounded-xl border border-[var(--accent-500)]/30 bg-[var(--accent-500)]/5 p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold text-[var(--accent-400)]">Bulk Import</div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <input 
              type="radio" 
              name="importMode" 
              checked={importMode === 'Replace Existing'}
              onChange={() => setImportMode('Replace Existing')}
              className="accent-cyan-500 w-3 h-3" 
            />
            <span className="text-[10px] text-white/60 group-hover:text-white/90">Replace Existing</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <input 
              type="radio" 
              name="importMode" 
              checked={importMode === 'Append To Existing'}
              onChange={() => setImportMode('Append To Existing')}
              className="accent-cyan-500 w-3 h-3" 
            />
            <span className="text-[10px] text-white/60 group-hover:text-white/90">Append To Existing</span>
          </label>
        </div>
      </div>
      
      <textarea
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[120px] rounded-lg bg-white/[0.03] border border-white/10 p-2.5 text-[11px] text-white/90 leading-snug outline-none focus:border-[var(--accent-500)]/50 transition-all resize-y font-mono whitespace-pre"
        spellCheck={false}
      />

      <div className="flex items-center justify-between mt-1">
        <div className="text-[10px] text-[var(--accent-400)]/70 font-mono">
          Imported: {lineCount} templates
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white/50 hover:text-white/80 transition-colors">
            Cancel
          </button>
          <button onClick={onCancel} className="px-4 py-1.5 rounded-lg bg-[var(--accent-500)]/20 border border-[var(--accent-500)]/30 text-[10px] font-bold text-[var(--accent-400)] hover:bg-[var(--accent-500)]/30 transition-colors">
            Import
          </button>
        </div>
      </div>
    </div>
  )
}

function VariablePill({ name, tooltip }) {
  return (
    <div className="group relative">
      <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-white/70 font-mono cursor-help hover:bg-white/10 hover:text-white transition-colors">
        {name}
      </div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
        <div className="bg-[#1a2030] border border-white/10 text-white/90 text-[10px] px-2.5 py-1.5 rounded-lg shadow-xl leading-snug text-center whitespace-normal">
          {tooltip}
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-[#1a2030]" />
      </div>
    </div>
  )
}
