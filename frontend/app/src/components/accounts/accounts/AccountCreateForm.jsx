import { useState, useEffect } from 'react'
import { useAccountsStore } from '../../../store/accounts/accountsStore'
import { useProfileStore } from '../../../store/profiles/profileStore'
import TooltipHelper from '../../common/TooltipHelper'

export default function AccountCreateForm({ onCancel }) {
  const createAccount = useAccountsStore((s) => s.createAccount)
  const profiles = useProfileStore((s) => s.profiles)
  const fetchProfiles = useProfileStore((s) => s.fetchProfiles)

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  const [name, setName] = useState('')
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [sourceType, setSourceType] = useState('M1_VIDEO_SPLITTER')
  const [targetRegion, setTargetRegion] = useState('Indonesia')
  const [watchEnabled, setWatchEnabled] = useState(false)
  const [watchPath, setWatchPath] = useState('')

  const [browserProfile, setBrowserProfile] = useState('')
  const [metadataProfile, setMetadataProfile] = useState('')
  const [uploadPreset, setUploadPreset] = useState('')
  const [playlist, setPlaylist] = useState('')
  const [category, setCategory] = useState('20')
  const [audience, setAudience] = useState('not_kids')
  const [license, setLicense] = useState('standard')
  const [language, setLanguage] = useState('en')

  return (
    <div className="flex-1 min-h-0 bg-[#141821] border border-[var(--accent-500)]/20 rounded-2xl overflow-hidden flex flex-col">
      <div className="h-[64px] border-b border-white/5 px-5 flex items-center shrink-0">
        <div>
          <div className="text-sm font-semibold text-[var(--accent-400)]">
            Create New Account
          </div>
          <div className="text-[11px] text-white/40 mt-1">
            Configure a new upload channel identity
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 scroll-smooth overscroll-contain space-y-5">
        
        {/* GENERAL SECTION */}
        <div>
          <div className="text-[11px] font-bold text-white/90 mb-3 tracking-wide">General</div>
          <div className="space-y-1.5">
            <div className="min-h-[72px] flex flex-col justify-center border-b border-white/[0.02] py-1.5">
              <Section title="Channel Name">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. DJ Channel X" />
              </Section>
            </div>
            <div className="grid grid-cols-2 gap-3 min-h-[82px] items-center border-b border-white/[0.02] py-1.5">
              <Section title="Workspace Profile">
                <select 
                  value={selectedProfileId} 
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="w-full h-[34px] rounded-lg bg-white/[0.03] border border-white/5 px-2.5 text-[11px] text-white/85 outline-none appearance-none cursor-pointer focus:border-[var(--accent-500)]/30 transition-all">
                  <option value="" className="bg-[#141821] text-white/50">-- Select Profile --</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id} className="bg-[#141821] text-white">{p.name}</option>
                  ))}
                </select>
              </Section>
              <Section title="Source Type">
                <Select value={sourceType} onChange={setSourceType} options={['MANUAL_UPLOAD', 'M1_VIDEO_SPLITTER', 'M3_PLAYLIST_BUILDER']} />
              </Section>
            </div>
            <div className="min-h-[72px] flex flex-col justify-center border-b border-white/[0.02] py-1.5">
              <Section title={<span className="flex items-center gap-1">Target Region <TooltipHelper label="" tooltip="Future scheduler optimization: upload window timing will be adjusted based on the target region for best engagement."/></span>}>
                <Select value={targetRegion} onChange={setTargetRegion} options={['Indonesia', 'USA', 'Japan', 'Brazil']} />
              </Section>
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-white/[0.02]" />

        {/* AUTOMATION SECTION */}
        <div>
          <div className="text-[11px] font-bold text-white/90 mb-3 tracking-wide">Automation</div>
          <div className="space-y-1.5">
            {(sourceType === 'M1_VIDEO_SPLITTER' || sourceType === 'M3_PLAYLIST_BUILDER') && (
              <div className="min-h-[82px] flex flex-col justify-center border-b border-white/[0.02] py-2">
                <Section title={<span className="flex items-center gap-1">Watch Folder <TooltipHelper label="" tooltip="When enabled, new videos entering this folder will automatically enter the Upload Queue."/></span>}>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <div onClick={() => setWatchEnabled(!watchEnabled)} className={`w-[38px] h-[20px] rounded-full transition-all relative ${watchEnabled ? 'bg-[var(--accent-500)]' : 'bg-white/[0.1]'}`}>
                        <div className={`absolute top-[2px] w-[16px] h-[16px] rounded-full bg-white transition-all ${watchEnabled ? 'left-[20px]' : 'left-[2px]'}`} />
                      </div>
                      <span className="text-[11px] text-white/70">{watchEnabled ? 'Enabled' : 'Disabled'}</span>
                    </label>
                    {watchEnabled && (
                      <FolderInput value={watchPath} onChange={(v) => setWatchPath(v)} />
                    )}
                  </div>
                </Section>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3 min-h-[82px] items-center border-b border-white/[0.02] py-1.5">
              <Section title="Approval Mode">
                <Select value="Always Review" options={['Always Review', 'Auto Approve']} />
              </Section>
              {sourceType === 'M3_PLAYLIST_BUILDER' && (
                <Section title="Gemini Metadata">
                  <Select value="Gemini 1.5 Pro" options={['Gemini 1.5 Pro', 'Gemini 1.5 Flash']} />
                </Section>
              )}
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-white/[0.02]" />

        {/* UPLOAD DEFAULTS SECTION */}
        <div>
          <div className="text-[11px] font-bold text-white/90 mb-3 tracking-wide">Upload Defaults</div>
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-3 min-h-[82px] items-center border-b border-white/[0.02] py-1.5">
              <Section title="Browser Profile">
                <Input value={browserProfile} onChange={(e) => setBrowserProfile(e.target.value)} placeholder="e.g. Default" />
              </Section>
              <Section title="Upload Preset">
                <Input value={uploadPreset} onChange={(e) => setUploadPreset(e.target.value)} placeholder="e.g. Gaming Preset" />
              </Section>
            </div>
            <div className="grid grid-cols-2 gap-3 min-h-[82px] items-center border-b border-white/[0.02] py-1.5">
              <Section title="Metadata Profile">
                <Input value={metadataProfile} onChange={(e) => setMetadataProfile(e.target.value)} placeholder="e.g. Standard V1" />
              </Section>
              <Section title="Playlist">
                <Input value={playlist} onChange={(e) => setPlaylist(e.target.value)} placeholder="e.g. Let's Play Series" />
              </Section>
            </div>
            <div className="grid grid-cols-4 gap-3 min-h-[82px] items-center border-b border-white/[0.02] py-1.5">
              <Section title="Category">
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. 20" />
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
          </div>
        </div>

        <div className="h-[1px] bg-white/[0.02]" />

        {/* AUTHENTICATION SECTION */}
        <div>
          <div className="text-[11px] font-bold text-white/90 mb-3 tracking-wide">Authentication</div>
          <div className="space-y-1.5">
            <div className="min-h-[82px] flex flex-col justify-center border-b border-white/[0.02] py-1.5">
              <Section title="YouTube Connection">
                <div className="flex items-center justify-between h-[34px] rounded-lg border border-red-500/20 bg-red-500/5 px-4 text-sm">
                  <span className="text-red-300 text-[11px] font-medium">Not Connected</span>
                  <span className="text-[10px] text-white/40 italic">Create account first to connect YouTube</span>
                </div>
              </Section>
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-white/[0.02]" />

        {/* QUEUE & SCHEDULING SECTION */}
        <div>
          <div className="text-[11px] font-bold text-white/90 mb-3 tracking-wide">Queue & Scheduling</div>
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-3 min-h-[82px] items-center border-b border-white/[0.02] py-1.5">
              <Section title="Upload Window">
                <Select value="18:00 - 22:00" options={['08:00 - 12:00', '12:00 - 18:00', '18:00 - 22:00', '22:00 - 02:00']} />
              </Section>
              <Section title="Humanized Scheduler">
                <Select value="Enabled (Random +/- 15m)" options={['Disabled', 'Enabled (Random +/- 15m)', 'Enabled (Random +/- 30m)']} />
              </Section>
            </div>
            <div className="min-h-[72px] flex flex-col justify-center border-b border-white/[0.02] py-1.5">
              <Section title="Queue Settings">
                <Select value="Default Priority (Process FIFO)" options={['Default Priority (Process FIFO)', 'High Priority (Bypass Default)']} />
              </Section>
            </div>
          </div>
        </div>

      </div>

      <div className="border-t border-white/5 p-4 flex gap-3 bg-[#11141b] shrink-0">
        <button onClick={onCancel} className="flex-[0.5] bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-1.5 text-sm text-white/70 font-medium transition-all">
          Cancel
        </button>
        <button 
          onClick={async () => {
            if (!name.trim()) return;
            await createAccount({
              channel_name: name,
              source_type: sourceType,
              region: targetRegion,
              profile_id: selectedProfileId || null,
              watch_folder: watchPath,
              watch_folder_enabled: watchEnabled,
              browser_profile: browserProfile,
              metadata_profile: metadataProfile,
              upload_preset: uploadPreset,
              playlist: playlist,
              category: category,
              audience: audience,
              license: license,
              language: language
            })
            onCancel()
          }}
          className="flex-1 bg-[var(--accent-500)]/15 hover:bg-[var(--accent-500)]/20 border border-[var(--accent-500)]/20 text-[var(--accent-400)] rounded-xl py-1.5 text-sm font-medium transition-all">
          Create Account
        </button>
      </div>
    </div>
  )
}

function FolderInput({ value, onChange }) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="D:\Render\M1"
        className="flex-1 h-[34px] rounded-lg bg-white/[0.03] border border-white/5 px-2.5 text-[11px] text-white/85 outline-none focus:border-[var(--accent-500)]/30 transition-all font-mono"
      />
      <div className="relative group">
        <button
          disabled
          className="h-[34px] px-3 rounded-lg bg-white/[0.02] border border-white/5 text-[10px] text-white/25 cursor-not-allowed flex items-center gap-1.5"
        >
          <span>📁</span>
          <span className="font-medium">Browse</span>
        </button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 border border-white/10 rounded text-[10px] text-white/70 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
          Coming Later — native folder picker
        </div>
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
      onChange={onChange}
      placeholder={placeholder}
      className="w-full h-[34px] rounded-lg bg-white/[0.03] border border-white/5 px-2.5 text-[11px] text-white/85 outline-none focus:border-[var(--accent-500)]/30 transition-all"
    />
  )
}

function Select({ value, onChange, options = [] }) {
  return (
    <div className="relative">
      <select 
        value={value} 
        onChange={(e) => onChange && onChange(e.target.value)}
        className="w-full h-[34px] rounded-lg bg-white/[0.03] border border-white/5 px-2.5 text-[11px] text-white/85 outline-none appearance-none cursor-pointer focus:border-[var(--accent-500)]/30 transition-all">
        {options.map((opt, i) => (
          <option key={i} value={opt} className="bg-[#141821] text-white">{opt}</option>
        ))}
        {options.length === 0 && <option className="bg-[#141821] text-white">{value}</option>}
      </select>
      <span className="absolute right-2.5 top-[10px] text-[10px] text-white/30 pointer-events-none">▼</span>
    </div>
  )
}
