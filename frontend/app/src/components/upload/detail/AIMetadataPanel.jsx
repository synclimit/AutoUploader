import { useState, useEffect } from 'react'
import NotificationToast, { showToast } from '../../common/NotificationToast'

export default function AIMetadataPanel({ activeTask, editData, onApply }) {
  const [keyword, setKeyword] = useState('')
  const [language, setLanguage] = useState('Auto')
  const [seoMode, setSeoMode] = useState('SEO Maximum')
  
  const [generating, setGenerating] = useState(false)
  const [target, setTarget] = useState(null)
  
  const [suggestion, setSuggestion] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState([])
  const [keywordSuggestions, setKeywordSuggestions] = useState([])
  const [showAutocomplete, setShowAutocomplete] = useState(false)

  // Realtime Analysis
  const analyzeKeyword = () => {
    const k = keyword.trim()
    const wordCount = k.split(/\s+/).filter(Boolean).length
    const isBroad = ['viral', 'tiktok', 'trending', 'video'].includes(k.toLowerCase())
    
    let specificity = 'Good'
    if (wordCount < 2) specificity = 'Too Broad (Low Specificity)'
    else if (wordCount > 5) specificity = 'Long Tail (High Specificity)'

    let seoQuality = 50
    if (wordCount >= 2 && wordCount <= 4) seoQuality += 30
    if (!isBroad) seoQuality += 20
    else seoQuality -= 20

    return {
      length: k.length,
      wordCount,
      specificity,
      seoQuality: Math.max(0, Math.min(100, seoQuality))
    }
  }

  const analysis = analyzeKeyword()
  const hasMetadata = editData?.title?.trim() || editData?.description?.trim()

  const fetchHistory = async () => {
    try {
      const apiClient = (await import('../../../api/client')).default
      const res = await apiClient.get(`/queue/${activeTask.id}/ai-history`)
      if (res.data?.success) {
        setHistory(res.data.data)
      }
    } catch (e) {
      console.error('Failed to fetch history', e)
    }
  }

  const fetchKeywordSuggestions = async () => {
    try {
      const apiClient = (await import('../../../api/client')).default
      const res = await apiClient.get(`/queue/keywords/autocomplete`)
      if (res.data?.success) {
        setKeywordSuggestions(res.data.data)
      }
    } catch (e) {
      console.error('Failed to fetch keywords', e)
    }
  }

  useEffect(() => {
    if (activeTask) {
      fetchHistory()
      fetchKeywordSuggestions()
    }
  }, [activeTask])

  const handleGenerate = async (genTarget) => {
    if (!keyword.trim()) {
      showToast('Please enter a keyword first', 'error', 2500)
      return
    }

    setGenerating(true)
    setTarget(genTarget)
    setSuggestion(null)
    showToast(`Thinking... ${genTarget}...`, 'info', 3000)

    try {
      const apiClient = (await import('../../../api/client')).default
      const payload = {
        keyword,
        language,
        seo_mode: seoMode,
        target: genTarget,
        current_title: editData?.title || '',
        current_description: editData?.description || '',
        current_tags: editData?.tags || ''
      }
      const res = await apiClient.post(`/queue/${activeTask.id}/generate-metadata`, payload)
      
      const responseData = res.data
      
      if (responseData.success) {
        setSuggestion({
          ...responseData.data,
          providerInfo: {
            provider: responseData.provider,
            model: responseData.model,
            timeMs: responseData.response_time_ms
          }
        })
        fetchHistory()
        showToast(`AI successfully generated metadata`, 'success', 2500)
      } else {
        showToast(responseData.message || 'AI Generation failed', 'error', 4000)
      }
    } catch (err) {
      showToast('Error communicating with backend', 'error', 3000)
    } finally {
      setGenerating(false)
      setTarget(null)
    }
  }

  const handleRestore = (hist) => {
    setSuggestion({
      title: hist.title,
      description: hist.description,
      tags: hist.tags,
      providerInfo: {
        provider: hist.provider,
        model: hist.model,
        timeMs: hist.response_time_ms
      }
    })
    setKeyword(hist.keyword || keyword)
    showToast(`Restored Version ${hist.version}`, 'info', 2000)
  }

  const applySuggestion = () => {
    if (suggestion) {
      onApply(suggestion)
      setSuggestion(null)
      showToast('Suggestion applied to form. Click Save Metadata to commit.', 'success', 3000)
    }
  }

  return (
    <div className="bg-[#151f2e] border border-white/[0.08] rounded-xl overflow-hidden mt-4">
      {/* 1. Keyword Section */}
      <div className="p-4 border-b border-white/[0.04]">
        <h4 className="text-[12px] font-bold text-white/90 mb-3">1. Keyword</h4>
        <div className="relative">
          <input
            type="text"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setShowAutocomplete(true)
            }}
            onFocus={() => setShowAutocomplete(true)}
            onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
            placeholder="e.g. dj remix viral tiktok 2025"
            className="w-full h-[36px] rounded-lg bg-white/[0.03] border border-white/[0.08] px-3 text-[12px] text-white/90 outline-none focus:border-[var(--accent-500)]/30 transition-all"
          />
          {showAutocomplete && keywordSuggestions.length > 0 && (
            <div className="absolute top-[40px] left-0 w-full bg-[#151f2e] border border-white/10 rounded-lg shadow-xl z-10 overflow-hidden">
              {keywordSuggestions.map(s => (
                <div 
                  key={s} 
                  className="px-3 py-2 text-[11px] text-white/70 hover:bg-white/5 cursor-pointer"
                  onClick={() => {
                    setKeyword(s)
                    setShowAutocomplete(false)
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Analysis Section */}
      {keyword.trim() && (
        <div className="px-4 py-3 border-b border-white/[0.04] bg-white/[0.01]">
          <h4 className="text-[12px] font-bold text-white/90 mb-2">2. Analysis</h4>
          <div className="grid grid-cols-2 gap-3 text-[10px]">
            <div className="bg-black/20 p-2 rounded border border-white/5">
              <div className="text-white/40 mb-1">Keyword Length</div>
              <div className="text-white/90 font-medium">{analysis.length} chars</div>
            </div>
            <div className="bg-black/20 p-2 rounded border border-white/5">
              <div className="text-white/40 mb-1">Word Count</div>
              <div className="text-white/90 font-medium">{analysis.wordCount} words</div>
            </div>
            <div className="bg-black/20 p-2 rounded border border-white/5">
              <div className="text-white/40 mb-1">Specificity</div>
              <div className="text-white/90 font-medium">{analysis.specificity}</div>
            </div>
            <div className="bg-black/20 p-2 rounded border border-white/5">
              <div className="text-white/40 mb-1">Estimated SEO Quality</div>
              <div className="text-white/90 font-medium text-[var(--accent-400)]">{analysis.seoQuality} / 100</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Generate Section */}
      <div className="p-4 border-b border-white/[0.04]">
        <h4 className="text-[12px] font-bold text-white/90 mb-3">3. Generate</h4>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-[11px] text-white/60 mb-1.5 font-medium">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full h-[36px] rounded-lg bg-white/[0.03] border border-white/[0.08] px-3 text-[12px] text-white/90 outline-none focus:border-[var(--accent-500)]/30 transition-all appearance-none cursor-pointer"
            >
              <option value="Auto">Auto</option>
              <option value="Indonesia">Indonesia</option>
              <option value="English">English</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-white/60 mb-1.5 font-medium">SEO Mode</label>
            <select
              value={seoMode}
              onChange={(e) => setSeoMode(e.target.value)}
              className="w-full h-[36px] rounded-lg bg-white/[0.03] border border-white/[0.08] px-3 text-[12px] text-white/90 outline-none focus:border-[var(--accent-500)]/30 transition-all appearance-none cursor-pointer"
            >
              <option value="SEO Maximum">SEO Maximum</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => handleGenerate(hasMetadata ? 'improve' : 'all')}
            disabled={generating}
            className={`w-full h-[40px] rounded-lg border text-[12px] font-bold transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              hasMetadata 
                ? 'bg-purple-500/15 border-purple-500/30 text-purple-300 hover:bg-purple-500/25'
                : 'bg-[var(--accent-500)]/15 border-[var(--accent-500)]/30 text-[var(--accent-400)] hover:bg-[var(--accent-500)]/25'
            }`}
          >
            {generating && ['all', 'improve'].includes(target) ? (
              <span className="animate-spin text-lg">⚙</span>
            ) : (
              <span className="text-sm">✨</span>
            )}
            {generating && ['all', 'improve'].includes(target) 
              ? 'Working...' 
              : (hasMetadata ? 'Improve Metadata' : 'Generate Metadata')
            }
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleGenerate('title')}
              disabled={generating}
              className="flex-1 h-[32px] rounded-lg bg-white/5 border border-white/10 text-white/70 text-[10px] font-medium hover:bg-white/10 transition-all flex justify-center items-center gap-1 disabled:opacity-50"
            >
              {generating && target === 'title' ? '...' : 'Title'}
            </button>
            <button
              onClick={() => handleGenerate('description')}
              disabled={generating}
              className="flex-1 h-[32px] rounded-lg bg-white/5 border border-white/10 text-white/70 text-[10px] font-medium hover:bg-white/10 transition-all flex justify-center items-center gap-1 disabled:opacity-50"
            >
              {generating && target === 'description' ? '...' : 'Description'}
            </button>
            <button
              onClick={() => handleGenerate('tags')}
              disabled={generating}
              className="flex-1 h-[32px] rounded-lg bg-white/5 border border-white/10 text-white/70 text-[10px] font-medium hover:bg-white/10 transition-all flex justify-center items-center gap-1 disabled:opacity-50"
            >
              {generating && target === 'tags' ? '...' : 'Tags'}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Preview & 5. Provider Info */}
      {suggestion && (
        <div className="p-4 border-b border-white/[0.04] bg-[var(--accent-500)]/5">
          <h4 className="text-[12px] font-bold text-[var(--accent-400)] mb-3">4. Preview</h4>
          
          <div className="space-y-3 mb-4">
            {suggestion.title && (
              <div>
                <div className="text-[9px] uppercase text-white/40 mb-1">Title</div>
                <div className="text-[12px] text-white/90 bg-black/20 p-2 rounded border border-white/5">{suggestion.title}</div>
              </div>
            )}
            {suggestion.description && (
              <div>
                <div className="text-[9px] uppercase text-white/40 mb-1">Description</div>
                <div className="text-[11px] text-white/70 bg-black/20 p-2 rounded border border-white/5 whitespace-pre-wrap max-h-[100px] overflow-y-auto">{suggestion.description}</div>
              </div>
            )}
            {suggestion.tags && (
              <div>
                <div className="text-[9px] uppercase text-white/40 mb-1">Tags</div>
                <div className="text-[11px] text-white/70 bg-black/20 p-2 rounded border border-white/5">{suggestion.tags}</div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 mb-4">
            <button
              onClick={applySuggestion}
              className="flex-1 h-[36px] rounded-lg bg-green-500/20 border border-green-500/30 text-green-300 text-[12px] font-bold hover:bg-green-500/30 transition-all"
            >
              Apply to Form
            </button>
            <button
              onClick={() => setSuggestion(null)}
              className="h-[36px] px-4 rounded-lg bg-white/5 border border-white/10 text-white/60 text-[12px] font-bold hover:bg-white/10 transition-all"
            >
              Discard
            </button>
          </div>

          {/* 5. Provider Info */}
          {suggestion.providerInfo && (
             <div className="pt-3 border-t border-[var(--accent-500)]/20 flex items-center gap-2">
                <span className="text-[10px] text-white/40">Using Provider:</span>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/30 border border-white/5 text-[9px] font-semibold text-white/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                  {suggestion.providerInfo.provider === 'gemini' ? 'Gemini Flash' : suggestion.providerInfo.provider} 
                  {' '}
                  <span className="text-white/30 px-1">•</span>
                  {(suggestion.providerInfo.timeMs / 1000).toFixed(1)} sec
                </div>
             </div>
          )}
        </div>
      )}

      {/* 6. History */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
           <h4 className="text-[12px] font-bold text-white/90">6. History</h4>
           <button 
              onClick={() => setShowHistory(!showHistory)}
              className="text-[10px] text-white/50 hover:text-white/90 bg-white/5 px-2 py-1 rounded border border-white/5"
            >
              {showHistory ? 'Hide' : 'Show'} ({history.length})
            </button>
        </div>
        
        {showHistory && (
          <div className="space-y-2 mt-2">
            {history.length === 0 ? (
              <div className="text-[11px] text-white/30 text-center py-2">No history available</div>
            ) : (
              history.map(h => (
                <div key={h.id} className="flex items-center justify-between bg-white/5 rounded p-2 text-[11px]">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white/90 font-bold">{h.prompt_name || 'Generation'}</span>
                      <span className="text-white/40 text-[9px]">
                        {new Date(h.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-white/60">
                      Keyword: <span className="text-white/80">{h.keyword}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] text-white/40 mt-0.5">
                       <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                       {h.provider} {h.model} • {h.response_time_ms}ms
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRestore(h)}
                    className="px-2 py-1 bg-white/10 text-white/80 rounded border border-white/20 hover:bg-white/20 ml-2"
                  >
                    Restore
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

    </div>
  )
}
