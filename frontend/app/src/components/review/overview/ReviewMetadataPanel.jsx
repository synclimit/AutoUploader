import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Plus, Sparkles, Save, Check, X, Search, MonitorPlay, Copy, ExternalLink, Activity, History } from 'lucide-react'
import { useQueueStore } from '../../../store/upload/uploadStore'
import { showToast } from '../../common/NotificationToast'
import { YOUTUBE_CATEGORIES } from '../../../constants/youtubeCategories'
import Select from '../../common/Select'
import { analyzeSEO } from '../../../utils/seoAnalyzer'

export default function ReviewMetadataPanel({ video, aiAssistantEnabled, edits = {}, setEdits }) {
  const [activeTab, setActiveTab] = useState('Basic Information')
  const { updateTask } = useQueueStore()
  
  // AI States
  const [aiKeyword, setAiKeyword] = useState('')
  const [aiLanguage, setAiLanguage] = useState('Auto')
  const [aiSeoMode, setAiSeoMode] = useState('SEO Maximum')
  const [aiContentType, setAiContentType] = useState('General')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingStage, setGeneratingStage] = useState('')
  const [suggestion, setSuggestion] = useState(null)
  
  // Selection States for Alternatives
  const [selectedTitleIdx, setSelectedTitleIdx] = useState(0)
  const [selectedDescIdx, setSelectedDescIdx] = useState(0)
  
  // SEO Validation State
  const [seoDropdownOpen, setSeoDropdownOpen] = useState(false)
  
  // Staggered loading simulation
  const runStaggeredLoading = async (target) => {
    if (target === 'all' || target === 'improve') {
      setGeneratingStage('Analyzing keyword...')
      await new Promise(r => setTimeout(r, 600))
      setGeneratingStage('Generating title...')
      await new Promise(r => setTimeout(r, 600))
      setGeneratingStage('Generating description...')
      await new Promise(r => setTimeout(r, 600))
      setGeneratingStage('Generating tags...')
      await new Promise(r => setTimeout(r, 600))
      setGeneratingStage('Finalizing...')
    } else {
      setGeneratingStage(`Generating ${target}...`)
    }
  }

  useEffect(() => {
    setEdits({})
    setSuggestion(null)
    setSelectedTitleIdx(0)
    setSelectedDescIdx(0)
  }, [video?.id])

  // Clear AI states if toggled off
  useEffect(() => {
    if (!aiAssistantEnabled) {
      setSuggestion(null)
      // We keep aiKeyword and others to preserve user input for later, but UI is hidden.
    }
  }, [aiAssistantEnabled])

  const handleChange = (field, value) => {
    setEdits(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (Object.keys(edits).length > 0) {
      await updateTask(video.id, edits)
      setEdits({})
    }
    showToast('Metadata saved successfully', 'success')
  }

  const currentTitleStr = edits.title !== undefined ? edits.title : (video?.title || '')
  const currentDescStr = edits.description !== undefined ? edits.description : (video?.description || '')
  const currentTagsStr = edits.tags !== undefined ? edits.tags : (video?.tags || '');
  const tagsArray = currentTagsStr ? currentTagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0) : [];
  
  const [newTagInput, setNewTagInput] = useState('');

  const handleRemoveTag = (tagToRemove) => {
    const newTags = tagsArray.filter(t => t !== tagToRemove);
    handleChange('tags', newTags.join(','));
  }

  const handleAddTag = (newTag) => {
    if (!newTag.trim()) return;
    const newTags = [...tagsArray, newTag.trim()];
    handleChange('tags', newTags.join(','));
    setNewTagInput('');
  }

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(newTagInput);
    }
  }

  const hasMetadata = currentTitleStr.trim() || currentDescStr.trim()
  
  // Realtime Analysis using deterministic rules
  const aiAnalysis = analyzeSEO({ title: currentTitleStr, description: currentDescStr, tags: currentTagsStr }, aiKeyword)

  const handleGenerateAI = async (targetField = 'all') => {
    if (!aiKeyword.trim()) {
      showToast('Please enter a target keyword first', 'error', 2500)
      return
    }

    setIsGenerating(true)
    setSuggestion(null)
    
    const actualTarget = (targetField === 'all' && hasMetadata) ? 'improve' : targetField

    // Start loading animation asynchronously
    const loadingPromise = runStaggeredLoading(actualTarget)

    try {
      const apiClient = (await import('../../../api/client')).default
      const payload = {
        keyword: aiKeyword,
        language: aiLanguage,
        seo_mode: aiSeoMode,
        content_type: aiContentType,
        target: actualTarget,
        current_title: currentTitleStr,
        current_description: currentDescStr,
        current_tags: currentTagsStr
      }
      
      const data = await apiClient.post(`/queue/${video.id}/generate-metadata`, payload)
      
      if (data.success) {
        // Wait for at least the staggered loading to finish so it feels natural, only on success
        await loadingPromise
        if (targetField === 'all' || targetField === 'improve') {
           setSuggestion({
             ...data.data,
             providerInfo: {
               provider: data.provider,
               baseUrl: data.base_url,
               model: data.model,
               timeMs: data.response_time_ms,
               promptName: data.prompt_name,
               historyVersion: data.history_version
             }
           })
           setSelectedTitleIdx(0)
           setSelectedDescIdx(0)
        } else {
           // Direct apply for per-field
           if (data.data.title && targetField === 'title') handleChange('title', data.data.title)
           if (data.data.description && targetField === 'description') handleChange('description', data.data.description)
           if (data.data.tags && targetField === 'tags') handleChange('tags', data.data.tags)
           showToast(`Generated ${targetField} successfully`, 'success')
        }
      } else {
        showToast(data.message || 'AI Generation failed', 'error')
      }
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.response?.data?.message || err.message || 'Error communicating with backend'
      showToast(errMsg, 'error')
    } finally {
      setIsGenerating(false)
      setGeneratingStage('')
    }
  }

  const handleApplySuggestion = () => {
    if (suggestion) {
      // Handle the new nested structure (alternatives) or fallback to backward compatible single fields
      if (suggestion.alternatives) {
        if (suggestion.alternatives.titles && suggestion.alternatives.titles.length > 0) {
          handleChange('title', suggestion.alternatives.titles[selectedTitleIdx])
        }
        if (suggestion.alternatives.descriptions && suggestion.alternatives.descriptions.length > 0) {
          handleChange('description', suggestion.alternatives.descriptions[selectedDescIdx])
        }
        if (suggestion.alternatives.tags && suggestion.alternatives.tags.length > 0) {
          handleChange('tags', suggestion.alternatives.tags.join(', '))
        }
      } else {
        if (suggestion.title) handleChange('title', suggestion.title)
        if (suggestion.description) handleChange('description', suggestion.description)
        if (suggestion.tags) handleChange('tags', suggestion.tags)
      }
      setSuggestion(null)
      showToast('Suggestion applied', 'success')
    }
  }

  const handleValidateSEO = async (mode, action = 'open') => {
    try {
      const apiClient = (await import('../../../api/client')).default
      const payload = {
        mode,
        keyword: aiKeyword || currentTitleStr,
        provider: 'vidiq',
        action
      }
      const res = await apiClient.post(`/queue/${video.id}/validate-seo`, payload)
      
      if (res.data?.success || res.success) {
         if (action === 'copy') {
             const urlToCopy = res.data?.url || res.url
             if (urlToCopy) {
               navigator.clipboard.writeText(urlToCopy)
               showToast('URL copied to clipboard!', 'success')
             }
         } else {
             showToast('Opening external validation...', 'info')
         }
         
         // Update task visually
         if (updateTask) {
             updateTask(video.id, { 
                 last_seo_validation_at: new Date().toISOString(), 
                 last_seo_provider: 'vidiq' 
             })
         }
      }
    } catch (err) {
      showToast('Validation failed', 'error')
      console.error(err)
    }
  }

  if (!video) {
    return (
      <div className="w-[400px] h-full border-l border-white/[0.04] bg-[#05080e]/40 backdrop-blur-sm shrink-0 flex items-center justify-center">
        <div className="text-[12px] font-medium text-white/30">Select a video to view metadata</div>
      </div>
    )
  }

  return (
    <div className="w-[400px] h-full flex flex-col border-l border-white/[0.04] shrink-0 bg-[#05080e]/60 backdrop-blur-md">
      
      {/* Tabs */}
      <div className="flex items-center px-6 border-b border-white/[0.04] shrink-0">
        {['Basic Information', 'Advanced Settings'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-4 px-2 text-[12px] font-bold tracking-wide relative whitespace-nowrap mr-6 transition-colors ${
              activeTab === tab ? 'text-white' : 'text-white/40 hover:text-white/80'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent-400)] shadow-[0_-2px_8px_rgba(34,211,238,0.5)] rounded-t-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        
        {activeTab === 'Basic Information' && (
          <div className="flex flex-col gap-4">
            
            {/* AI Assistant Panel (Only visible when ON) */}
            <div className={`overflow-hidden transition-all duration-300 ${aiAssistantEnabled ? 'max-h-[4000px] opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'}`}>
               <div className="bg-[#151f2e] border border-[var(--accent-500)]/30 rounded-xl p-4 shadow-[0_4px_20px_rgba(34,211,238,0.05)] flex flex-col gap-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={14} className="text-[var(--accent-400)]" />
                    <span className="text-[12px] font-bold text-[var(--accent-400)]">AI Metadata Assistant</span>
                  </div>
                  
                  {/* Keyword */}
                  <div>
                    <label className="block text-[11px] text-white/60 mb-1.5 font-medium">Target Keyword <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={aiKeyword}
                      onChange={(e) => setAiKeyword(e.target.value)}
                      placeholder="Masukkan keyword utama video..."
                      className="w-full h-[36px] rounded-lg bg-white/[0.03] border border-[var(--accent-500)]/20 px-3 text-[12px] text-white/90 outline-none focus:border-[var(--accent-500)]/50 transition-all"
                    />
                  </div>
                  
                  {/* Realtime Analysis */}
                  {aiKeyword.trim() && !suggestion && (
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-black/20 p-2 rounded-[6px] border border-white/5 flex justify-between items-center">
                        <span className="text-white/40">Title SEO</span>
                        <span className="text-white/90 font-medium">{aiAnalysis.title.keyword_position}</span>
                      </div>
                      <div className="bg-black/20 p-2 rounded-[6px] border border-white/5 flex justify-between items-center">
                        <span className="text-white/40">Desc Length</span>
                        <span className="text-white/90 font-medium">{aiAnalysis.description.character_count} chars</span>
                      </div>
                      <div className="bg-black/20 p-2 rounded-[6px] border border-[var(--accent-500)]/20 flex justify-between items-center">
                        <span className="text-[var(--accent-400)]/60">Keyword Present</span>
                        <span className="text-[var(--accent-400)] font-bold">{aiAnalysis.description.keyword_presence ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="bg-black/20 p-2 rounded-[6px] border border-[var(--accent-500)]/20 flex justify-between items-center">
                        <span className="text-[var(--accent-400)]/60">Long Tail Tags</span>
                        <span className="text-[var(--accent-400)] font-bold">{aiAnalysis.tags.long_tail_percentage}%</span>
                      </div>
                    </div>
                  )}

                  {/* Config */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <select
                        value={aiLanguage}
                        onChange={(e) => setAiLanguage(e.target.value)}
                        className="w-full h-[32px] rounded-lg bg-white/[0.03] border border-[var(--accent-500)]/20 px-2 text-[11px] text-white/80 outline-none focus:border-[var(--accent-500)]/30 transition-all appearance-none cursor-pointer"
                      >
                        <option value="Auto">Language: Auto</option>
                        <option value="Indonesia">Indonesia</option>
                        <option value="English">English</option>
                      </select>
                    </div>
                    <div>
                      <select
                        value={aiContentType}
                        onChange={(e) => setAiContentType(e.target.value)}
                        className="w-full h-[32px] rounded-lg bg-white/[0.03] border border-[var(--accent-500)]/20 px-2 text-[11px] text-white/80 outline-none focus:border-[var(--accent-500)]/30 transition-all appearance-none cursor-pointer"
                      >
                        <option value="General">Type: General</option>
                        <option value="Music">Music</option>
                        <option value="Gaming">Gaming</option>
                        <option value="Education">Education</option>
                        <option value="Podcast">Podcast</option>
                        <option value="Relaxation">Relaxation</option>
                      </select>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={() => handleGenerateAI('all')}
                    disabled={!aiKeyword.trim() || isGenerating}
                    className={`h-[40px] rounded-lg font-bold text-[12px] flex items-center justify-center gap-2 transition-all border ${
                      !aiKeyword.trim()
                        ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                        : isGenerating 
                          ? 'bg-[var(--accent-500)]/20 border-[var(--accent-500)]/40 text-[var(--accent-400)]'
                          : hasMetadata
                            ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 hover:bg-purple-500/30 hover:border-purple-500/50'
                            : 'bg-[var(--accent-500)]/20 border-[var(--accent-500)]/40 text-[var(--accent-400)] hover:bg-[var(--accent-500)]/30 hover:border-[var(--accent-500)]/50'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span className="animate-pulse">{generatingStage || '✨ AI is thinking...'}</span>
                      </>
                    ) : (
                      <>
                        <span>✨</span>
                        {hasMetadata ? 'Improve Metadata' : 'Generate Metadata'}
                      </>
                    )}
                  </button>

                  {/* Preview Section Modal */}
                  {suggestion && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in duration-200">
                      <div className="bg-[#0a0f1a] w-full max-w-4xl max-h-[90vh] rounded-2xl border border-[var(--accent-500)]/30 shadow-[0_10px_50px_rgba(34,211,238,0.15)] flex flex-col overflow-hidden">
                        
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                          <div className="flex items-center gap-3">
                            <Sparkles className="text-[var(--accent-400)]" size={20} />
                            <h2 className="text-[16px] font-bold text-white">AI Metadata Suggestion</h2>
                          </div>
                          {suggestion.providerInfo && (() => {
                            let providerName = suggestion.providerInfo.provider;
                            if (providerName === 'openai_compatible') {
                               if (suggestion.providerInfo.baseUrl?.includes('atomesus')) providerName = 'Atomesus';
                               else if (suggestion.providerInfo.baseUrl?.includes('cipher')) providerName = 'Cipher';
                               else providerName = 'Custom API';
                            }
                            return (
                              <div className="text-[11px] text-[var(--accent-400)]/50 flex flex-col items-end mr-4">
                                <span>{providerName} | Model: {suggestion.providerInfo.model} | {(suggestion.providerInfo.timeMs / 1000).toFixed(1)}s</span>
                                {suggestion.providerInfo.promptName && (
                                  <span className="text-[10px] text-cyan-500/40">
                                    Prompt: {suggestion.providerInfo.promptName} (v{suggestion.providerInfo.historyVersion})
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        
                        {/* Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column - Meta & SEO */}
                            <div className="flex flex-col gap-4">
                              {/* Confidence Score */}
                              {suggestion.confidence && (
                                <div className={`p-4 rounded-xl border ${
                                  suggestion.confidence.level?.toLowerCase() === 'high' ? 'border-green-500/20 bg-green-500/5 text-green-400' :
                                  suggestion.confidence.level?.toLowerCase() === 'medium' ? 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400' :
                                  'border-red-500/20 bg-red-500/5 text-red-400'
                                }`}>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[13px] font-bold">Confidence: {suggestion.confidence.level}</span>
                                  </div>
                                  <div className="text-[12px] opacity-80 leading-relaxed">
                                    {suggestion.confidence.reason}
                                  </div>
                                </div>
                              )}

                              {/* Keyword Expansion Data */}
                              {suggestion.keyword_expansion && (
                                <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5">
                                  <div className="text-[13px] font-bold text-purple-400 mb-3">Structured Keyword Expansion</div>
                                  <div className="grid grid-cols-1 gap-3 text-[12px]">
                                    <div>
                                      <span className="text-purple-300/60 block mb-0.5">Primary Keyword:</span>
                                      <span className="text-purple-200">{suggestion.keyword_expansion.primary}</span>
                                    </div>
                                    <div>
                                      <span className="text-purple-300/60 block mb-0.5">Search Intents:</span>
                                      <span className="text-purple-200">{suggestion.keyword_expansion.intent?.join(', ')}</span>
                                    </div>
                                    <div>
                                      <span className="text-purple-300/60 block mb-0.5">Related:</span>
                                      <span className="text-purple-200">{suggestion.keyword_expansion.related?.join(', ')}</span>
                                    </div>
                                    <div>
                                      <span className="text-purple-300/60 block mb-0.5">Long Tail:</span>
                                      <span className="text-purple-200">{suggestion.keyword_expansion.long_tail?.join(', ')}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Local SEO Analyzer Data */}
                              {(() => {
                                 const postAnalysis = analyzeSEO(suggestion, aiKeyword);
                                 return (
                                   <div className="grid grid-cols-2 gap-3 text-[12px]">
                                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col justify-center">
                                        <span className="text-white/40 mb-1">Title Uppercase</span>
                                        <span className="text-white/90 font-medium text-[14px]">{postAnalysis.title.uppercase_ratio}%</span>
                                      </div>
                                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col justify-center">
                                        <span className="text-white/40 mb-1">Desc CTAs</span>
                                        <span className="text-white/90 font-medium text-[14px]">{postAnalysis.description.cta_detection ? 'Yes' : 'No'}</span>
                                      </div>
                                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col justify-center">
                                        <span className="text-white/40 mb-1">Desc Hashtags</span>
                                        <span className="text-white/90 font-medium text-[14px]">{postAnalysis.description.hashtag_count}</span>
                                      </div>
                                      <div className="bg-[var(--accent-500)]/5 p-3 rounded-xl border border-[var(--accent-500)]/20 flex flex-col justify-center">
                                        <span className="text-[var(--accent-400)]/60 mb-1">Keyword in Tags</span>
                                        <span className="text-[var(--accent-400)] font-bold text-[14px]">{postAnalysis.tags.keyword_coverage ? 'Yes' : 'No'}</span>
                                      </div>
                                   </div>
                                 );
                              })()}
                            </div>

                            {/* Right Column - Generation Alternatives */}
                            <div className="flex flex-col gap-5">
                              {/* Title Alternatives */}
                              <div>
                                <div className="text-[10px] text-white/40 mb-2 uppercase tracking-widest font-bold">Title Alternatives</div>
                                <div className="flex flex-col gap-2">
                                  {suggestion.alternatives?.titles ? suggestion.alternatives.titles.map((t, idx) => (
                                    <label key={idx} className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors border ${selectedTitleIdx === idx ? 'bg-[var(--accent-500)]/10 border-[var(--accent-500)]/30' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}>
                                      <input type="radio" name="ai_title" checked={selectedTitleIdx === idx} onChange={() => setSelectedTitleIdx(idx)} className="mt-1" />
                                      <span className={`text-[13px] leading-snug ${selectedTitleIdx === idx ? 'text-[var(--accent-400)] font-medium' : 'text-white/70'}`}>{t}</span>
                                    </label>
                                  )) : (
                                    <div className="text-[13px] text-white/90 p-3 rounded-xl bg-[var(--accent-500)]/10 border border-[var(--accent-500)]/20">{suggestion.title}</div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Description Alternatives */}
                              <div>
                                <div className="text-[10px] text-white/40 mb-2 uppercase tracking-widest font-bold">Description Alternatives</div>
                                <div className="flex flex-col gap-2">
                                  {suggestion.alternatives?.descriptions ? suggestion.alternatives.descriptions.map((d, idx) => (
                                    <label key={idx} className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors border ${selectedDescIdx === idx ? 'bg-[var(--accent-500)]/10 border-[var(--accent-500)]/30' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}>
                                      <input type="radio" name="ai_desc" checked={selectedDescIdx === idx} onChange={() => setSelectedDescIdx(idx)} className="mt-1" />
                                      <span className={`text-[12px] leading-relaxed max-h-[150px] overflow-y-auto custom-scrollbar whitespace-pre-wrap ${selectedDescIdx === idx ? 'text-[var(--accent-400)] font-medium' : 'text-white/70'}`}>{d}</span>
                                    </label>
                                  )) : (
                                    <div className="text-[12px] text-white/80 p-3 rounded-xl bg-[var(--accent-500)]/10 border border-[var(--accent-500)]/20 max-h-[150px] overflow-y-auto custom-scrollbar whitespace-pre-wrap">{suggestion.description}</div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Tags */}
                              <div>
                                <div className="text-[10px] text-white/40 mb-2 uppercase tracking-widest font-bold">Suggested Tags</div>
                                <div className="text-[12px] text-[var(--accent-400)]/80 p-3 rounded-xl bg-[var(--accent-500)]/5 border border-[var(--accent-500)]/10 leading-relaxed">
                                  {suggestion.alternatives?.tags ? suggestion.alternatives.tags.join(', ') : suggestion.tags}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 py-4 border-t border-white/5 flex gap-3 bg-[#0a0f1a]">
                          <button onClick={() => setSuggestion(null)} className="flex-1 h-[44px] px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2">
                            <X size={16} /> Discard
                          </button>
                          <button onClick={handleApplySuggestion} className="flex-[2] h-[44px] bg-[var(--accent-500)]/20 hover:bg-[var(--accent-500)]/30 border border-[var(--accent-500)]/30 text-[var(--accent-400)] rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2">
                            <Check size={16} /> Apply Selected Alternatives
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

               </div>
            </div>

            
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <label className="text-[11px] font-bold text-white/80">Title <span className="text-red-400">*</span></label>
                  {currentTitleStr && (
                    <button 
                      onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(currentTitleStr)}`, '_blank')}
                      title="Check keyword on YouTube to trigger vidIQ extension"
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-colors cursor-pointer text-[9px] font-bold uppercase tracking-wider neon-interactive"
                    >
                      <ExternalLink size={10} /> Check vidIQ
                    </button>
                  )}
                </div>
              </div>
              <div className="relative group neon-interactive">
                <input 
                  type="text" 
                  value={currentTitleStr}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full bg-[#0a0f1a]/50 border border-[var(--accent-500)]/20 rounded-[8px] px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-[var(--accent-500)]/50 pr-10"
                />
                {aiAssistantEnabled && (
                  <button 
                    onClick={() => handleGenerateAI('title')}
                    title="Generate Title"
                    disabled={isGenerating || !aiKeyword.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center text-[var(--accent-400)] hover:bg-[var(--accent-500)]/20 hover:shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#0a0f1a]"
                  >
                    <Sparkles size={14} />
                  </button>
                )}
              </div>
              <div className="text-[10px] text-white/40 text-right font-mono">{currentTitleStr.length}/100</div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-white/80">Description <span className="text-red-400">*</span></label>
              <div className="relative group neon-interactive">
                <textarea 
                  rows={4}
                  value={currentDescStr}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full bg-[#0a0f1a]/50 border border-[var(--accent-500)]/20 rounded-[8px] px-3 py-2.5 text-[13px] text-white/80 focus:outline-none focus:border-[var(--accent-500)]/50 resize-none custom-scrollbar pr-10"
                />
                {aiAssistantEnabled && (
                  <button 
                    onClick={() => handleGenerateAI('description')}
                    title="Generate Description"
                    disabled={isGenerating || !aiKeyword.trim()}
                    className="absolute right-2 top-2 w-6 h-6 rounded flex items-center justify-center text-[var(--accent-400)] hover:bg-[var(--accent-500)]/20 hover:shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#0a0f1a]"
                  >
                    <Sparkles size={14} />
                  </button>
                )}
              </div>
              <div className="text-[10px] text-white/40 text-right font-mono">{currentDescStr.length}/5000</div>
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-white/80">Tags</label>
              <div className="flex flex-wrap gap-2 items-center bg-[#0a0f1a]/50 border border-[var(--accent-500)]/20 rounded-[8px] p-2 min-h-[44px] neon-interactive relative pr-10">
                {tagsArray.map(tag => (
                  <div key={tag} className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-white/[0.05] border border-white/[0.05] text-[11px] text-white/80 hover:bg-white/[0.1] transition-colors cursor-pointer group" onClick={() => handleRemoveTag(tag)}>
                    {tag}
                    <div className="opacity-40 group-hover:opacity-100 hover:text-red-400 transition-all">&times;</div>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 ml-1">
                  <Plus size={12} className="text-white/40" />
                  <input 
                    type="text" 
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Add tag..."
                    className="bg-transparent border-none outline-none text-[11px] text-white/80 w-[80px]"
                  />
                </div>
                {aiAssistantEnabled && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                    <button 
                      onClick={() => handleGenerateAI('tags')}
                      title="Generate Tags"
                      disabled={isGenerating || !aiKeyword.trim()}
                      className="w-6 h-6 rounded flex items-center justify-center text-[var(--accent-400)] hover:bg-[var(--accent-500)]/20 hover:shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#0a0f1a]"
                    >
                      <Sparkles size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {Object.keys(edits).length > 0 && (
              <button 
                onClick={handleSave}
                className="mt-4 flex items-center justify-center gap-2 px-6 py-2 rounded-[8px] bg-[var(--accent-500)]/20 text-[var(--accent-400)] hover:bg-[var(--accent-500)]/30 transition-colors text-[13px] font-bold border border-[var(--accent-500)]/30"
              >
                <Save size={16} /> Save Changes
              </button>
            )}

            {/* SEO Validation Section */}
            {currentTitleStr.trim() !== '' && currentDescStr.trim() !== '' && tagsArray.length > 0 && (
              <div className="mt-6 border-t border-white/[0.04] pt-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[12px] font-bold text-white/90 flex items-center gap-1.5">
                    <Activity size={14} className="text-purple-400" />
                    External SEO Validation
                  </div>
                  
                  {/* Status Indicator */}
                  {video.youtube_video_id ? (
                     <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-[10px] font-bold text-green-400">
                       <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div> Uploaded
                     </div>
                  ) : video.last_seo_validation_at ? (
                     <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-400">
                       <Check size={10} /> Already Validated
                     </div>
                  ) : (
                     <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-[10px] font-bold text-yellow-400">
                       <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div> Ready to Validate
                     </div>
                  )}
                </div>

                <div className="flex items-center gap-2 relative">
                   <button 
                     onClick={() => handleValidateSEO(video.youtube_video_id ? 'studio' : 'search')}
                     className="flex-1 h-[36px] bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-l-[8px] rounded-r-[2px] text-[12px] font-bold transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                   >
                     {video.youtube_video_id ? (
                        <><MonitorPlay size={14} /> Open in YouTube Studio</>
                     ) : (
                        <><Search size={14} /> Search Keyword on YouTube</>
                     )}
                   </button>
                   
                   <button
                     onClick={() => setSeoDropdownOpen(!seoDropdownOpen)}
                     onBlur={() => setTimeout(() => setSeoDropdownOpen(false), 200)}
                     className="h-[36px] px-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 border-l-0 text-purple-300 rounded-r-[8px] rounded-l-[2px] transition-all flex items-center justify-center hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                   >
                     <ChevronDown size={14} className={`transition-transform ${seoDropdownOpen ? 'rotate-180' : ''}`} />
                   </button>

                   {/* Split Dropdown */}
                   {seoDropdownOpen && (
                     <div className="absolute top-[40px] right-0 w-[200px] bg-[#0a0f1a] border border-white/10 rounded-[8px] shadow-[0_5px_25px_rgba(0,0,0,0.8)] z-50 overflow-hidden flex flex-col py-1">
                        <button onMouseDown={() => handleValidateSEO('studio')} className="px-3 py-2 text-[11px] text-left text-white/80 hover:bg-white/5 hover:text-[var(--accent-400)] flex items-center gap-2">
                           <MonitorPlay size={12} /> Open YouTube Studio
                        </button>
                        <button onMouseDown={() => handleValidateSEO('search')} className="px-3 py-2 text-[11px] text-left text-white/80 hover:bg-white/5 hover:text-[var(--accent-400)] flex items-center gap-2">
                           <Search size={12} /> Open YouTube Search
                        </button>
                        <button onMouseDown={() => handleValidateSEO(video.youtube_video_id ? 'studio' : 'search', 'copy')} className="px-3 py-2 text-[11px] text-left text-white/80 hover:bg-white/5 hover:text-[var(--accent-400)] flex items-center gap-2">
                           <Copy size={12} /> Copy Search URL
                        </button>
                        
                        <div className="h-[1px] bg-white/5 my-1"></div>
                        <div className="px-3 py-1 text-[9px] font-bold text-white/30 uppercase tracking-wider">Future Providers</div>
                        
                        <button disabled className="px-3 py-2 text-[11px] text-left text-white/30 flex items-center gap-2 cursor-not-allowed">
                           <ExternalLink size={12} /> Google Trends
                        </button>
                        <button disabled className="px-3 py-2 text-[11px] text-left text-white/30 flex items-center gap-2 cursor-not-allowed">
                           <ExternalLink size={12} /> TubeBuddy
                        </button>
                     </div>
                   )}
                </div>

                {video.last_seo_validation_at && (
                  <div className="mt-3 flex items-center gap-2 text-[10px] text-white/40">
                    <History size={12} /> 
                    Last validated: {new Date(video.last_seo_validation_at).toLocaleString()} via {video.last_seo_provider?.toUpperCase()}
                  </div>
                )}

              </div>
            )}

          </div>
        )}

        {/* Advanced Settings Tab */}
        {activeTab === 'Advanced Settings' && (
           <div className="flex flex-col gap-2">
             {[
               { label: 'Category', value: edits.category_id !== undefined ? edits.category_id : (video.category_id || '22'), field: 'category_id', options: YOUTUBE_CATEGORIES.map(c => ({val: c.id, label: c.name})) },
               { label: 'AI Content Declaration', value: edits.ai_use !== undefined ? edits.ai_use : (video.ai_use || 'UNKNOWN'), field: 'ai_use', options: [{val: 'UNKNOWN', label: 'Not Specified'}, {val: 'YES', label: 'Yes'}, {val: 'NO', label: 'No'}] },
               { label: 'Audience', value: edits.audience !== undefined ? edits.audience : (video.audience || 'not_kids'), field: 'audience', options: [{val: 'not_kids', label: 'Not Kids'}, {val: 'kids', label: 'Kids'}] },
               { label: 'License', value: edits.license !== undefined ? edits.license : (video.license || 'standard'), field: 'license', options: [{val: 'standard', label: 'Standard'}, {val: 'creativeCommon', label: 'Creative Commons'}] },
               { label: 'Visibility', value: edits.privacy_status !== undefined ? edits.privacy_status : (video.privacy_status || 'public'), field: 'privacy_status', options: [{val: 'public', label: 'Public'}, {val: 'private', label: 'Private'}, {val: 'unlisted', label: 'Unlisted'}] },
               { label: 'Default Language', value: edits.default_language !== undefined ? edits.default_language : (video.default_language || 'en'), field: 'default_language', options: [{val: 'en', label: 'English'}, {val: 'id', label: 'Indonesian'}, {val: 'es', label: 'Spanish'}, {val: 'ja', label: 'Japanese'}, {val: 'ko', label: 'Korean'}] },
               { label: 'Audio Language', value: edits.audio_language !== undefined ? edits.audio_language : (video.audio_language || 'en'), field: 'audio_language', options: [{val: 'en', label: 'English'}, {val: 'id', label: 'Indonesian'}, {val: 'es', label: 'Spanish'}, {val: 'ja', label: 'Japanese'}, {val: 'ko', label: 'Korean'}] },
               { label: 'Playlist', value: edits.playlist_title !== undefined ? edits.playlist_title : (video.playlist_title || 'None'), field: 'playlist_title', options: [{val: 'None', label: 'None'}, {val: 'Music', label: 'Music'}, {val: 'Gaming', label: 'Gaming'}, {val: 'Vlogs', label: 'Vlogs'}] },
             ].map((item, idx) => (
               <div key={idx} className="flex items-center justify-between group neon-interactive p-1 -mx-1 rounded-[6px]">
                 <div className="flex flex-col">
                   <label className="text-[12px] text-white/60 group-hover:text-white/80 transition-colors">{item.label}</label>
                 </div>
                 <Select
                   value={item.value}
                   onChange={(val) => handleChange(item.field, val)}
                   options={item.options}
                   className="w-[180px]"
                 />
               </div>
             ))}
             
             <div className="flex items-center justify-between group neon-interactive p-1 -mx-1 rounded-[6px]">
                 <div className="flex flex-col">
                   <label className="text-[12px] text-white/60 group-hover:text-white/80 transition-colors">Recording Date</label>
                 </div>
                 <div className="w-[180px] h-[32px] bg-[#0a0f1a]/80 border border-white/[0.05] rounded-[6px] flex items-center px-2 hover:border-[var(--accent-500)]/30 transition-colors">
                    <input 
                      type="datetime-local"
                      value={edits.recording_date !== undefined ? (edits.recording_date ? edits.recording_date.substring(0, 16) : '') : (video.recording_date ? video.recording_date.substring(0, 16) : '')} 
                      onChange={(e) => handleChange('recording_date', e.target.value ? new Date(e.target.value).toISOString() : null)}
                      className="w-full bg-transparent border-none text-[11px] text-white/90 outline-none cursor-pointer"
                    />
                 </div>
             </div>
 
             {/* Schedule */}
             <div className="flex items-start justify-between group neon-interactive p-1 -mx-1 rounded-[6px] mt-2">
                 <div className="flex flex-col">
                   <label className="text-[12px] text-white/60 group-hover:text-white/80 transition-colors">Schedule</label>
                 </div>
                 <div className="w-[180px] flex flex-col gap-3">
                    <label className="flex items-center gap-2 cursor-pointer group/radio" onClick={() => handleChange('scheduled_at', null)}>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${!edits.scheduled_at && !video.scheduled_at ? 'border-[var(--accent-500)]' : 'border-white/20'}`}>
                        {!edits.scheduled_at && !video.scheduled_at && <div className="w-2 h-2 rounded-full bg-[var(--accent-400)] shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>}
                      </div>
                      <span className="text-[12px] text-white/90">Publish immediately</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group/radio" onClick={() => handleChange('scheduled_at', new Date(Date.now() + 86400000).toISOString())}>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${edits.scheduled_at || video.scheduled_at ? 'border-[var(--accent-500)]' : 'border-white/20 group-hover/radio:border-white/40 transition-colors'}`}>
                        {(edits.scheduled_at || video.scheduled_at) && <div className="w-2 h-2 rounded-full bg-[var(--accent-400)] shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>}
                      </div>
                      <span className="text-[12px] text-white/50 group-hover/radio:text-white/80 transition-colors">Schedule for later</span>
                    </label>
                 </div>
             </div>

             {Object.keys(edits).length > 0 && (
              <button 
                onClick={handleSave}
                className="mt-4 flex items-center justify-center gap-2 px-6 py-2 rounded-[8px] bg-[var(--accent-500)]/20 text-[var(--accent-400)] hover:bg-[var(--accent-500)]/30 transition-colors text-[13px] font-bold border border-[var(--accent-500)]/30"
              >
                <Save size={16} /> Save Changes
              </button>
            )}
           </div>
        )}

      </div>
    </div>
  )
}
