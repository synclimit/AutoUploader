import { useState, useEffect } from 'react'
import TooltipHelper from '../../common/TooltipHelper'
import { useProfileStore } from '../../../store/profiles/profileStore'
import ConfirmModal from '../../common/ConfirmModal'

export default function ProfileDetailPanel() {
  const { activeProfile, updateProfile, deleteProfile, bulkImportTemplates, duplicateProfile, setDefaultProfile, deleteTemplate } = useProfileStore()
  const [isAddingTitle, setIsAddingTitle] = useState(false)
  const [isBulkingTitle, setIsBulkingTitle] = useState(false)
  const [isAddingDesc, setIsAddingDesc] = useState(false)
  const [isBulkingDesc, setIsBulkingDesc] = useState(false)
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [isBulkingTag, setIsBulkingTag] = useState(false)
  
  const [localProfile, setLocalProfile] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [localApiMode, setLocalApiMode] = useState('Balanced')
  const [localApprovalQueue, setLocalApprovalQueue] = useState('Always Review')

  useEffect(() => {
    if (activeProfile) {
      setLocalProfile(activeProfile)
      setLocalApiMode(activeProfile.api_mode || 'Balanced')
      setLocalApprovalQueue(activeProfile.approval_queue || 'Always Review')
    }
  }, [activeProfile])

  if (!localProfile) {
    return (
      <div className="flex-1 min-h-0 bg-[#141821] border border-white/5 rounded-2xl flex items-center justify-center">
        <div className="text-white/30 text-sm">Select a profile to view details</div>
      </div>
    )
  }

  const handleSave = () => {
    updateProfile(localProfile.id, {
      name: localProfile.name,
      description: localProfile.description,
      content_type: localProfile.content_type,
      metadata_strategy: localProfile.metadata_strategy,
      category: localProfile.category,
      language: localProfile.language,
      audience: localProfile.audience,
      license: localProfile.license,
      thumbnail_rules: localProfile.thumbnail_rules,
      ai_preset: localProfile.ai_preset,
      prompt_template: localProfile.prompt_template
    })
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  return (
    <div className="flex-1 min-h-0 bg-[#141821] border border-white/5 rounded-2xl overflow-hidden flex flex-col">
      <div className="h-[64px] border-b border-white/5 px-5 flex items-center shrink-0">
        <div>
          <div className="text-sm font-semibold text-purple-300">Profile Detail</div>
          <div className="text-[11px] text-white/40 mt-1">
            <TooltipHelper label="Configure metadata rules & templates" tooltip="Set strategies for how metadata is generated across assigned channels." />
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
                <Input value={localProfile.name} onChange={(v) => setLocalProfile({...localProfile, name: v})} />
              </Section>
            </div>
            <div className="min-h-[72px] flex flex-col justify-center border-b border-white/[0.02] py-1.5">
              <Section title="Description">
                <TextArea text={localProfile.description || ''} onChange={(v) => setLocalProfile({...localProfile, description: v})} />
              </Section>
            </div>
            <div className="grid grid-cols-2 gap-3 min-h-[82px] items-center border-b border-white/[0.02] py-1.5">
              <Section title="Content Type">
                <Select value={localProfile.content_type} onChange={(v) => setLocalProfile({...localProfile, content_type: v})} options={['Longform (16:9)', 'Shorts (9:16)']} />
              </Section>
              <Section title={<span className="flex items-center gap-1">Metadata Strategy <TooltipHelper label="" tooltip="Determines if Gemini AI should assist in rewriting or generating metadata based on these templates."/></span>}>
                <Select value={localProfile.metadata_strategy} onChange={(v) => setLocalProfile({...localProfile, metadata_strategy: v})} options={['Template Only', 'Gemini Assisted', 'Gemini Full']} />
              </Section>
            </div>
            <div className="grid grid-cols-2 gap-3 min-h-[82px] items-center border-b border-white/[0.02] py-1.5">
              <Section title={<span className="flex items-center gap-1">Gemini API Mode <TooltipHelper label="" tooltip="AI generation profile for this specific channel."/></span>}>
                <Select value={localApiMode} onChange={setLocalApiMode} options={['Balanced', 'Creative', 'Strict']} />
              </Section>
              <Section title={<span className="flex items-center gap-1">Approval Queue <TooltipHelper label="" tooltip="Post-generation review requirement."/></span>}>
                <Select value={localApprovalQueue} onChange={setLocalApprovalQueue} options={['Always Review', 'Auto Approve']} />
              </Section>
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-white/[0.02]" />

      </div>

      <div className="border-t border-white/5 p-4 flex gap-3 bg-[#11141b] shrink-0">
        <button onClick={handleSave} className="flex-1 bg-purple-500/15 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 rounded-xl py-1.5 text-sm font-medium transition-all">
          Save Changes
        </button>
        <button onClick={() => duplicateProfile(localProfile.id)} className="px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-1.5 text-sm text-white/70 font-medium transition-all">
          Duplicate
        </button>
        {!localProfile.is_default && (
          <button onClick={() => setDefaultProfile(localProfile.id)} className="px-4 bg-[var(--accent-500)]/10 hover:bg-[var(--accent-500)]/20 border border-[var(--accent-500)]/20 rounded-xl py-1.5 text-sm text-[var(--accent-400)] font-medium transition-all">
            Make Default
          </button>
        )}
        <button onClick={handleDelete} className="px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl py-1.5 text-sm text-red-200 font-medium transition-all">
          Delete
        </button>
      </div>
      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Profile"
          message={`Are you sure you want to delete profile "${localProfile.name}"? This action cannot be undone.`}
          confirmText="Hapus"
          onConfirm={() => {
            deleteProfile(localProfile.id)
            setShowDeleteConfirm(false)
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
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

function Input({ value, onChange }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-[34px] rounded-lg bg-white/[0.03] border border-white/5 px-2.5 text-[11px] text-white/85 outline-none focus:border-purple-500/30 transition-all"
    />
  )
}

function TextArea({ text, onChange }) {
  return (
    <textarea
      value={text}
      onChange={(e) => onChange(e.target.value)}
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

function TemplateItem({ text, onDelete }) {
  return (
    <div className="group flex items-center justify-between min-h-[34px] rounded-lg bg-white/[0.02] border border-white/5 px-3 py-1 hover:bg-white/[0.04] transition-colors">
      <div className="text-[11px] text-white/80 break-all pr-4">{text}</div>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={onDelete} className="text-[10px] font-bold text-red-400 hover:text-red-300">Hapus</button>
      </div>
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

function BulkImportEditor({ onCancel, placeholder, onImport }) {
  const [value, setValue] = useState('')
  const [importMode, setImportMode] = useState('append')
  
  const lines = value.split('\n').filter(l => l.trim().length > 0)

  return (
    <div className="mt-2 rounded-xl border border-[var(--accent-500)]/30 bg-[var(--accent-500)]/5 p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold text-[var(--accent-400)]">Bulk Import</div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <input 
              type="radio" 
              name="importMode" 
              checked={importMode === 'replace'}
              onChange={() => setImportMode('replace')}
              className="accent-cyan-500 w-3 h-3" 
            />
            <span className="text-[10px] text-white/60 group-hover:text-white/90">Replace Existing</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <input 
              type="radio" 
              name="importMode" 
              checked={importMode === 'append'}
              onChange={() => setImportMode('append')}
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
          Ready: {lines.length} templates
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white/50 hover:text-white/80 transition-colors">
            Cancel
          </button>
          <button onClick={() => onImport(importMode, lines)} className="px-4 py-1.5 rounded-lg bg-[var(--accent-500)]/20 border border-[var(--accent-500)]/30 text-[10px] font-bold text-[var(--accent-400)] hover:bg-[var(--accent-500)]/30 transition-colors">
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
