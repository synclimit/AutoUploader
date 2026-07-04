import { Copy, Sliders } from 'lucide-react'
import CustomDropdown from '../../../ui/CustomDropdown'

export default function UploadDefaultsTab({ draft, original, onChange }) {
  
  const updateField = (pipeline, section, field, value) => {
    const updated = { ...draft }
    if (!updated[pipeline]) updated[pipeline] = { basic_info: {}, advanced: {} }
    if (!updated[pipeline][section]) updated[pipeline][section] = {}
    
    updated[pipeline][section][field] = value
    onChange(updated)
  }

  const copyConfig = (source, target) => {
    if (confirm(`Are you sure you want to copy all settings from ${source.toUpperCase()} to ${target.toUpperCase()}? This will overwrite any unsaved changes.`)) {
      const updated = { ...draft }
      updated[target] = JSON.parse(JSON.stringify(updated[source]))
      onChange(updated)
    }
  }

  const renderDirtyIndicator = (pipeline, section, field) => {
    const draftVal = JSON.stringify(draft?.[pipeline]?.[section]?.[field])
    const origVal = JSON.stringify(original?.[pipeline]?.[section]?.[field])
    if (draftVal !== origVal) {
      return <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 shadow-[0_0_8px_#fbbf24]"></span>
    }
    return null
  }

  const basicFields = [
    { id: 'title_template', label: 'Default Title Template', type: 'text', helpText: 'Format judul otomatis. Gunakan {filename} untuk menyisipkan nama file.' },
    { id: 'description', label: 'Default Description', type: 'textarea', helpText: 'Deskripsi bawaan yang akan selalu ditambahkan ke setiap video.' },
    { id: 'playlist', label: 'Playlist', type: 'text', helpText: 'Nama playlist untuk memasukkan video secara otomatis.' },
    { id: 'tags', label: 'Tags', type: 'text', helpText: 'Tag bawaan. Pisahkan dengan koma.' },
    { id: 'category', label: 'Category', type: 'select', searchable: true, helpText: 'Kategori video YouTube.', options: [
      { label: 'Film & Animation', value: '1' }, { label: 'Autos & Vehicles', value: '2' },
      { label: 'Music', value: '10' }, { label: 'Pets & Animals', value: '15' },
      { label: 'Sports', value: '17' }, { label: 'Gaming', value: '20' },
      { label: 'People & Blogs', value: '22' }, { label: 'Entertainment', value: '24' },
      { label: 'News & Politics', value: '25' }, { label: 'Howto & Style', value: '26' },
      { label: 'Education', value: '27' }, { label: 'Science & Technology', value: '28' }
    ]},
    { id: 'audience', label: 'Audience', type: 'select', helpText: 'Pengaturan pembatasan usia penonton.', options: [
      { label: 'Yes, it is made for kids', value: 'kids' },
      { label: 'No, it is not made for kids', value: 'not_kids' }
    ]},
    { id: 'visibility', label: 'Visibility', type: 'select', helpText: 'Status privasi saat video pertama kali diupload.', options: [
      { label: 'Public', value: 'public' },
      { label: 'Unlisted', value: 'unlisted' },
      { label: 'Private', value: 'private' }
    ]},
    { id: 'license', label: 'License', type: 'select', helpText: 'Lisensi hak cipta video Anda.', options: [
      { label: 'Standard YouTube License', value: 'standard' },
      { label: 'Creative Commons', value: 'creative_commons' }
    ]},
    { id: 'ai_generated', label: 'AI-generated Content (YouTube label)', type: 'toggle', helpText: 'Wajib dinyalakan jika video/audio berisi deepfake atau AI realistis.' }
  ]

  const advancedFields = [
    { id: 'allow_comments', label: 'Allow Comments', type: 'toggle', helpText: 'Izinkan penonton memberikan komentar.' },
    { id: 'notify_subscribers', label: 'Notify Subscribers', type: 'toggle', helpText: 'Kirim notifikasi ke subscriber saat video dirilis.' },
    { id: 'embeddable', label: 'Allow Embedding', type: 'toggle', helpText: 'Izinkan video dipasang (di-embed) di website lain.' },
  ]

  const renderSectionField = (pipeline, section, f) => {
    const data = draft[pipeline] || { basic_info: {}, advanced: {} }
    const val = data[section][f.id]

    return (
      <div key={f.id} className="flex flex-col gap-2 h-[80px]">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider truncate">{f.label}</label>
          
          {f.helpText && (
            <div className="group relative flex items-center">
              <div className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold opacity-60 group-hover:opacity-100 transition-opacity bg-white/5 cursor-help">?</div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[#05080e] text-white/90 text-[11px] p-2 rounded-[8px] border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 font-normal leading-relaxed text-center hidden group-hover:block whitespace-normal">
                {f.helpText}
              </div>
            </div>
          )}

          {renderDirtyIndicator(pipeline, section, f.id)}
        </div>
        {f.type === 'text' && (
          <input 
            type="text" value={val || ''} onChange={(e) => updateField(pipeline, section, f.id, e.target.value)}
            className="h-[40px] rounded-[10px] bg-[#05080e] border border-white/[0.08] px-3 text-[13px] text-white outline-none focus:border-[var(--accent-500)] transition-colors" 
          />
        )}
        {f.type === 'textarea' && (
          <textarea 
            value={val || ''} onChange={(e) => updateField(pipeline, section, f.id, e.target.value)}
            className="h-[40px] min-h-[40px] max-h-[80px] rounded-[10px] bg-[#05080e] border border-white/[0.08] p-2 text-[13px] text-white outline-none focus:border-[var(--accent-500)] transition-colors custom-scrollbar resize-y leading-tight" 
          />
        )}
        {f.type === 'select' && (
          <CustomDropdown 
            options={f.options} 
            value={val} 
            onChange={(v) => updateField(pipeline, section, f.id, v)} 
            searchable={f.searchable} 
          />
        )}
        {f.type === 'toggle' && (
          <div 
            onClick={() => updateField(pipeline, section, f.id, !val)}
            className="h-[40px] flex items-center gap-3 px-3 rounded-[10px] bg-[#05080e] border border-white/[0.08] cursor-pointer group hover:border-white/[0.15] transition-colors"
          >
            <div className={`w-8 h-4.5 rounded-full flex items-center p-0.5 transition-colors ${val ? 'bg-[var(--accent-500)]' : 'bg-white/10'}`}>
              <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${val ? 'translate-x-3.5' : 'translate-x-0'}`}></div>
            </div>
            <span className="text-[12px] text-white/70 group-hover:text-white transition-colors">Enabled</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* COPY UTILITIES */}
      <div className="flex items-center justify-end gap-3 px-2">
        <button 
          onClick={() => copyConfig('long', 'shorts')}
          className="h-[36px] px-4 rounded-[8px] bg-white/[0.03] border border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.15] text-[12px] font-bold transition-all flex items-center gap-2"
        >
          <Copy size={14} /> Copy Long → Shorts
        </button>
        <button 
          onClick={() => copyConfig('shorts', 'long')}
          className="h-[36px] px-4 rounded-[8px] bg-white/[0.03] border border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.15] text-[12px] font-bold transition-all flex items-center gap-2"
        >
          <Copy size={14} /> Copy Shorts → Long
        </button>
      </div>

      {/* SIDE-BY-SIDE LAYOUT */}
      <div className="flex gap-6">
        
        {/* LONG VIDEO DEFAULTS */}
        <div className="flex-1 flex flex-col gap-6 p-6 rounded-[16px] bg-[#0a0f18]/80 backdrop-blur-xl border border-white/[0.04] relative overflow-hidden transition-all duration-300">
          <h2 className="text-[14px] font-bold text-[var(--accent-400)] uppercase tracking-[0.15em] flex items-center gap-3 border-b border-white/[0.04] pb-4">
            <Sliders size={16} strokeWidth={2.5} />
            Long Video Defaults
          </h2>

          <div className="flex flex-col gap-5">
            <h3 className="text-[12px] font-bold text-white/50 uppercase tracking-widest mt-2">Basic Info</h3>
            <div className="flex flex-col gap-4">
              {basicFields.map(f => renderSectionField('long', 'basic_info', f))}
            </div>

            <h3 className="text-[12px] font-bold text-white/50 uppercase tracking-widest mt-6 border-t border-white/[0.04] pt-6">Advanced Settings</h3>
            <div className="flex flex-col gap-4">
              {advancedFields.map(f => renderSectionField('long', 'advanced', f))}
            </div>
          </div>
        </div>

        {/* SHORT VIDEO DEFAULTS */}
        <div className="flex-1 flex flex-col gap-6 p-6 rounded-[16px] bg-[#0a0f18]/80 backdrop-blur-xl border border-white/[0.04] relative overflow-hidden transition-all duration-300">
          <h2 className="text-[14px] font-bold text-[var(--accent-400)] uppercase tracking-[0.15em] flex items-center gap-3 border-b border-white/[0.04] pb-4">
            <Sliders size={16} strokeWidth={2.5} />
            Short Video Defaults
          </h2>

          <div className="flex flex-col gap-5">
            <h3 className="text-[12px] font-bold text-white/50 uppercase tracking-widest mt-2">Basic Info</h3>
            <div className="flex flex-col gap-4">
              {basicFields.map(f => renderSectionField('shorts', 'basic_info', f))}
            </div>

            <h3 className="text-[12px] font-bold text-white/50 uppercase tracking-widest mt-6 border-t border-white/[0.04] pt-6">Advanced Settings</h3>
            <div className="flex flex-col gap-4">
              {advancedFields.map(f => renderSectionField('shorts', 'advanced', f))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
