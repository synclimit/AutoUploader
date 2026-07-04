import { BrainCircuit, Info } from 'lucide-react'

export default function AIIdentityTab({ draft, original, onChange }) {

  const handleUpdate = (key, value) => {
    const updated = { ...draft, [key]: value }
    onChange(updated)
  }

  const renderDirtyIndicator = (field) => {
    const draftVal = JSON.stringify(draft?.[field])
    const origVal = JSON.stringify(original?.[field])
    if (draftVal !== origVal) {
      return <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 shadow-[0_0_8px_#fbbf24]"></span>
    }
    return null
  }

  const currentCategory = draft?.channel_category || 'Other'

  const getExamples = (category, fieldId) => {
    const examples = {
      Music: {
        channel_description: 'This channel uploads classic rock music from the 80s and 90s.',
        target_audience: 'Musicians, music lovers, 18-35 Years',
        writing_style: 'SEO Friendly, Storytelling, Conversational',
        tone: 'Friendly, Relaxing, Energetic',
        vocabulary: 'Epic, Relaxing, Legendary, Powerful, Bass',
        avoid_words: 'Cheap, Clickbait, Breaking News',
        preferred_cta: 'Subscribe for more relaxing music.',
        primary_keywords: 'Rock Music, Rain Sounds, Lofi Hip Hop',
        secondary_keywords: 'Classic Rock, Heavy Metal, Deep Sleep Music',
        notes: 'Always generate English metadata. Do not use emojis.'
      },
      Education: {
        channel_description: 'This channel provides high-quality tutorials on software engineering and AI architectures.',
        target_audience: 'Students, Professionals, Self-taught developers',
        writing_style: 'Professional, Clear, Step-by-step',
        tone: 'Authoritative, Helpful, Encouraging',
        vocabulary: 'Tutorial, Guide, Explain, Architecture, Best Practices',
        avoid_words: 'Hack, Exploit, Quick rich',
        preferred_cta: 'Subscribe to learn more programming skills.',
        primary_keywords: 'Python Tutorial, System Design, React Basics',
        secondary_keywords: 'Coding for beginners, Web Development',
        notes: 'Use a structured format. Keep titles under 60 characters.'
      }
    }
    
    // Default fallback
    const fallback = examples['Education']
    const catExamples = examples[category] || fallback
    
    return catExamples[fieldId] || 'No specific example.'
  }

  const getHelperText = (fieldId) => {
    const helpers = {
      channel_category: 'Select the main category for this channel.',
      channel_description: 'Explain what this channel is about.',
      target_audience: 'Who is this content for?',
      writing_style: 'How should the AI write the metadata?',
      tone: 'What is the emotional tone of the writing?',
      vocabulary: 'Frequently used words that the AI should include.',
      avoid_words: 'Words the AI must never use.',
      preferred_cta: 'Your preferred Call To Action text.',
      primary_keywords: 'Main channel keywords.',
      secondary_keywords: 'Supporting keywords.',
      notes: 'Additional AI instructions and strict rules.'
    }
    return helpers[fieldId] || ''
  }

  const categories = [
    'Music', 'Gaming', 'Education', 'Funny', 'Podcast', 
    'Technology', 'Travel', 'Kids', 'Business', 'News', 
    'Cooking', 'Lifestyle', 'Religion', 'Nature', 'Motivation', 'Other'
  ]

  const fields = [
    { id: 'channel_description', label: 'Brand Description', type: 'textarea' },
    { id: 'target_audience', label: 'Target Audience', type: 'text' },
    { id: 'writing_style', label: 'Writing Style', type: 'text' },
    { id: 'tone', label: 'Tone', type: 'text' },
    { id: 'vocabulary', label: 'Vocabulary', type: 'text' },
    { id: 'avoid_words', label: 'Avoid Words', type: 'text' },
    { id: 'preferred_cta', label: 'Preferred CTA', type: 'text' },
    { id: 'primary_keywords', label: 'Primary Keywords', type: 'text' },
    { id: 'secondary_keywords', label: 'Secondary Keywords', type: 'text' },
    { id: 'notes', label: 'Notes', type: 'textarea' }
  ]

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      <div className="flex flex-col gap-2 p-6 rounded-[16px] bg-[#0a0f18]/80 backdrop-blur-xl border border-white/[0.04] overflow-visible">
        <h2 className="text-[14px] font-bold text-[var(--accent-400)] uppercase tracking-[0.15em] flex items-center gap-3">
          <BrainCircuit size={16} strokeWidth={2.5} />
          Channel Brand Profile
        </h2>
        <p className="text-[12px] text-white/50 leading-relaxed max-w-2xl mt-1 mb-4">
          Every AI module (Metadata, Thumbnails, Captions) will use this profile. Set the foundation of your channel's identity.
        </p>

        <div className="grid grid-cols-2 gap-x-5 gap-y-6">
          
          {/* CATEGORY (Full Width) */}
          <div className="flex flex-col gap-2 col-span-2 border-b border-white/[0.04] pb-6 mb-2">
            <div className="flex items-center gap-2 relative group">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Channel Category</label>
              {renderDirtyIndicator('channel_category')}
              <div className="relative flex items-center">
                <Info size={14} className="text-[var(--accent-400)]/50 hover:text-[var(--accent-400)] cursor-help transition-colors" />
                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-[240px] bg-[#111824] border border-white/10 rounded-[8px] p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    {getHelperText('channel_category')}
                  </p>
                </div>
              </div>
            </div>
            
            <select 
              value={currentCategory}
              onChange={(e) => handleUpdate('channel_category', e.target.value)}
              className="w-full h-[44px] rounded-[10px] bg-[#05080e] border border-white/[0.08] px-3 text-[14px] text-white outline-none focus:border-[var(--accent-500)] transition-colors appearance-none"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* DYNAMIC FIELDS */}
          {fields.map((f) => (
            <div key={f.id} className={`flex flex-col gap-2 ${f.type === 'textarea' ? 'col-span-2' : ''}`}>
              <div className="flex items-center gap-2 relative group">
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">{f.label}</label>
                {renderDirtyIndicator(f.id)}
                <div className="relative flex items-center">
                  <Info size={14} className="text-[var(--accent-400)]/50 hover:text-[var(--accent-400)] cursor-help transition-colors" />
                  
                  {/* TOOLTIP */}
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 w-[280px] bg-[#111824] border border-white/10 rounded-[8px] p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                    <p className="text-[11px] font-bold text-white/90 mb-1">{getHelperText(f.id)}</p>
                    <div className="bg-black/30 rounded-[6px] p-2 mt-2">
                      <span className="text-[10px] text-[var(--accent-400)]/80 font-bold uppercase tracking-wider block mb-1">Example ({currentCategory})</span>
                      <p className="text-[11px] text-white/60 leading-relaxed">"{getExamples(currentCategory, f.id)}"</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {f.type === 'textarea' ? (
                <textarea 
                  className="w-full bg-[#05080e] border border-white/[0.08] rounded-[10px] px-3 py-3 text-[13px] text-white focus:border-[var(--accent-500)] transition-colors outline-none min-h-[100px] resize-y custom-scrollbar leading-relaxed"
                  placeholder={`e.g. ${getExamples(currentCategory, f.id)}`}
                  value={draft[f.id] || ''}
                  onChange={(e) => handleUpdate(f.id, e.target.value)}
                />
              ) : (
                <input 
                  type="text"
                  className="w-full bg-[#05080e] border border-white/[0.08] rounded-[10px] px-3 h-[40px] text-[13px] text-white focus:border-[var(--accent-500)] transition-colors outline-none"
                  placeholder={`e.g. ${getExamples(currentCategory, f.id)}`}
                  value={draft[f.id] || ''}
                  onChange={(e) => handleUpdate(f.id, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
