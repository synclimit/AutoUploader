import { Folder, Settings2, Activity, Plus, Trash2, HelpCircle, HeartPulse, CheckCircle2, ShieldAlert, Info, ListVideo } from 'lucide-react'
import { useState, useEffect } from 'react'
import apiClient from '../../../../api/client'
import { useAppStore } from '../../../../store/app/appStore'
import UploadJournal from './UploadJournal'

export default function GeneralTab({ draft, original, onChange, states, channelStatus }) {
  
  const [scanResults, setScanResults] = useState({})
  const [isScanning, setIsScanning] = useState({})
  const [queuePlans, setQueuePlans] = useState({})
  const [isBuildingQueue, setIsBuildingQueue] = useState({})

  const updatePipeline = (key, field, value) => {
    const updated = { ...draft }
    updated[key] = { ...(updated[key] || {}) }
    updated[key][field] = value
    onChange(updated)
  }

  const triggerScan = async (key, folderPath) => {
    if (!folderPath) return;
    setIsScanning(prev => ({ ...prev, [key]: true }));
    try {
      const res = await apiClient.post('/api/v1/campaign-scan', { campaign_folder: folderPath });
      if (res && res.data) {
        // Send scan result to review engine to create/update session
        const reviewRes = await apiClient.post(`/api/v1/campaign-review?channel_id=${draft.id}&pipeline_type=${key}`, res.data);
        if (reviewRes && reviewRes.data) {
          setScanResults(prev => ({ ...prev, [key]: reviewRes.data }));
        }
      }
    } catch (e) {
      console.error("Scan failed", e);
    } finally {
      setIsScanning(prev => ({ ...prev, [key]: false }));
    }
  }

  const handleSelectAsset = async (key, assetId, selected) => {
    try {
      const res = await apiClient.post('/api/v1/campaign-review/select', {
        channel_id: draft.id,
        pipeline_type: key,
        asset_id: assetId,
        selected: selected
      });
      if (res && res.data) {
        setScanResults(prev => ({ ...prev, [key]: res.data }));
      }
    } catch (e) {
      console.error("Selection failed", e);
    }
  }

  const handleUpdateMetadata = async (key, assetId, field, value) => {
    try {
      // Optimistic update
      setScanResults(prev => {
        const current = { ...prev };
        if (current[key] && current[key].assets) {
          const assetIdx = current[key].assets.findIndex(a => a.id === assetId);
          if (assetIdx >= 0) {
            current[key].assets[assetIdx][field] = value;
          }
        }
        return current;
      });

      const res = await apiClient.post(`/api/v1/campaign-review/update/${assetId}?channel_id=${draft.id}&pipeline_type=${key}`, {
        [field]: value
      });
      if (res && res.data) {
        setScanResults(prev => ({ ...prev, [key]: res.data }));
      }
    } catch (e) {
      console.error("Update failed", e);
    }
  }

  const handleApproveCampaign = async (key) => {
    try {
      const res = await apiClient.post('/api/v1/campaign-review/approve', { channel_id: draft.id, pipeline_type: key });
      if (res && res.data) {
        setScanResults(prev => ({ ...prev, [key]: res.data }));
      }
    } catch (e) {
      console.error("Approve failed", e);
    }
  }

  const handleBuildQueue = async (key, sessionId) => {
    setIsBuildingQueue(prev => ({ ...prev, [key]: true }));
    try {
      const res = await apiClient.post('/api/v1/campaign-queue/build', {
        session_id: sessionId,
        channel_id: draft.id,
        pipeline_type: key
      });
      if (res && res.data) {
        setQueuePlans(prev => ({ ...prev, [key]: res.data }));
      }
    } catch (e) {
      console.error("Build queue failed", e);
    } finally {
      setIsBuildingQueue(prev => ({ ...prev, [key]: false }));
    }
  }

  const handleStartCampaign = async (key, sessionId) => {
    setIsBuildingQueue(prev => ({ ...prev, [key]: true }));
    try {
      await apiClient.post('/api/v1/campaign-execution/start', {
        session_id: sessionId,
        channel_id: draft.id,
        pipeline_type: key
      });
      // Refresh the queue plans to show READY status
      loadQueuePlans(key, sessionId);
    } catch (e) {
      console.error("Start campaign failed", e);
    } finally {
      setIsBuildingQueue(prev => ({ ...prev, [key]: false }));
    }
  }

  const handleRetryPlan = async (key, sessionId, planId) => {
    try {
      await apiClient.post(`/api/v1/campaign-execution/retry/${planId}`);
      loadQueuePlans(key, sessionId);
    } catch (e) {
      console.error("Retry failed", e);
    }
  }

  const loadQueuePlans = async (key, sessionId) => {
    try {
      const res = await apiClient.get(`/api/v1/campaign-queue/${sessionId}`);
      if (res && res.data && res.data.length > 0) {
        setQueuePlans(prev => ({ ...prev, [key]: res.data }));
      }
    } catch (e) {
      // Ignore if none exist
    }
  }

  // Fetch session or auto trigger scan on mount
  useEffect(() => {
    ['long', 'shorts'].forEach(async key => {
      const p = draft[key] || {}
      if (p.automation_strategy === 'campaign' && p.campaign_folder && !scanResults[key] && !isScanning[key]) {
        try {
          const res = await apiClient.get(`/api/v1/campaign-review/${draft.id}/${key}`);
          if (res && res.data) {
            setScanResults(prev => ({ ...prev, [key]: res.data }));
            if (res.data.status === 'LOCKED') {
              loadQueuePlans(key, res.data.id);
            }
          } else {
            triggerScan(key, p.campaign_folder);
          }
        } catch (e) {
          triggerScan(key, p.campaign_folder);
        }
      }
    });
  }, [draft, scanResults, isScanning]);

  const generateEvenSchedule = (limit) => {
    const slots = [];
    const startMins = 9 * 60; // 09:00
    const endMins = 18 * 60; // 18:00
    if (limit <= 1) return ['09:00'];
    const interval = (endMins - startMins) / (limit - 1);
    for (let i = 0; i < limit; i++) {
      const totalMins = Math.round(startMins + (i * interval));
      const h = String(Math.floor(totalMins / 60)).padStart(2, '0');
      const m = String(totalMins % 60).padStart(2, '0');
      slots.push(`${h}:${m}`);
    }
    return slots;
  };

  const updateDailyLimit = (key, value) => {
    let limit = Math.max(0, value);
    if (isNaN(limit)) limit = 0;
    
    const updated = { ...draft };
    updated[key] = { ...(updated[key] || {}) };
    updated[key].daily_limit = limit;
    
    const currentSchedule = updated[key].schedule || [];
    const idealSchedule = generateEvenSchedule(limit);
    
    updated[key].schedule = idealSchedule.map((time, idx) => {
      if (idx < currentSchedule.length) return currentSchedule[idx];
      return time;
    });
    
    onChange(updated);
  }

  
  const updateHumanize = (key, field, value) => {
    const updated = { ...draft }
    updated[key] = { ...(updated[key] || {}) }
    if (!updated[key].humanize) updated[key].humanize = { enabled: true, min_delay_minutes: 0, max_delay_minutes: 10 }
    updated[key].humanize = { ...updated[key].humanize, [field]: value }
    onChange(updated)
  }

  const addSchedule = (key) => {
    const updated = { ...draft }
    updated[key] = { ...(updated[key] || {}) }
    if (!updated[key].schedule) updated[key].schedule = []
    updated[key].schedule = [...updated[key].schedule, '12:00']
    onChange(updated)
  }

  const removeSchedule = (key, index) => {
    const updated = { ...draft }
    if (!updated[key] || !updated[key].schedule) return
    updated[key] = { ...updated[key] }
    updated[key].schedule = updated[key].schedule.filter((_, i) => i !== index)
    onChange(updated)
  }

  const updateScheduleTime = (key, index, time) => {
    const updated = { ...draft }
    if (!updated[key] || !updated[key].schedule) return
    updated[key] = { ...updated[key] }
    updated[key].schedule = [...updated[key].schedule]
    updated[key].schedule[index] = time
    onChange(updated)
  }

  const renderTooltip = (text) => (
    <div className="group relative flex items-center ml-1">
      <div className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold opacity-60 group-hover:opacity-100 transition-opacity bg-white/5 cursor-help">?</div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[220px] bg-[#111824] text-white/90 text-[11px] p-2.5 rounded-[8px] border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 font-normal leading-relaxed text-center hidden group-hover:block whitespace-normal">
        {text}
      </div>
    </div>
  )

  const browseFolder = async (key, isCampaign = false) => {
    try {
      const res = await apiClient.get('/system/browse-folder')
      if (res && res.path) {
        if (isCampaign) {
          updatePipeline(key, 'campaign_folder', res.path);
          triggerScan(key, res.path); // Auto trigger scan immediately after selection
        } else {
          updatePipeline(key, 'watch_folder', res.path);
        }
      }
    } catch (e) {
      console.error("Browse folder failed", e)
    }
  }

  const renderDirtyIndicator = (key, field) => {
    const draftVal = JSON.stringify(draft[key]?.[field])
    const origVal = JSON.stringify(original[key]?.[field])
    if (draftVal !== origVal) {
      return <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 shadow-[0_0_8px_#fbbf24]"></span>
    }
    return null
  }

  const renderHumanizeDirtyIndicator = (key, field) => {
    const draftVal = JSON.stringify(draft[key]?.humanize?.[field])
    const origVal = JSON.stringify(original[key]?.humanize?.[field])
    if (draftVal !== origVal) {
      return <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 shadow-[0_0_8px_#fbbf24]"></span>
    }
    return null
  }

  const formatSchedulePreview = (time, p) => {
    const strTime = String(time);
    const isDate = strTime.includes('-');
    const timeOnly = isDate ? (strTime.includes('T') ? strTime.split('T')[1] : strTime.split(' ')[1]) || '00:00' : strTime;
    const humanize = p.humanize || { enabled: true, min_delay_minutes: 0, max_delay_minutes: 10 }
    if (!humanize.enabled || (humanize.min_delay_minutes === 0 && humanize.max_delay_minutes === 0)) return strTime;
    
    // Parse time to calculate max end time
    const [h, m] = timeOnly.split(':').map(Number);
    const date = new Date();
    date.setHours(h || 0, m || 0, 0, 0);
    date.setMinutes(date.getMinutes() + humanize.max_delay_minutes);
    
    const endH = String(date.getHours()).padStart(2, '0');
    const endM = String(date.getMinutes()).padStart(2, '0');
    
    return isDate ? `${strTime} → ${endH}:${endM}` : `${timeOnly} → ${endH}:${endM}`;
  }

  const renderPipeline = (key, title) => {
    const p = draft[key] || {}
    const s = (typeof states === 'string' ? JSON.parse(states) : states)?.[key] || { today_intake: 0 }
    const isEnabled = p.enabled !== false
    const humanize = p.humanize || { enabled: true, min_delay_minutes: 0, max_delay_minutes: 10 }
    
    const remainingToday = Math.max(0, (p.daily_limit || 0) - s.today_intake)

    const strategy = p.automation_strategy || 'continuous'
    const scanData = scanResults[key] || { summary: {}, assets: [] }

    return (
      <div className="flex flex-col gap-0 p-6 rounded-[16px] bg-[#0a0f18]/80 backdrop-blur-xl border border-white/[0.04] relative overflow-hidden transition-all duration-300">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-white/[0.04] pb-5 mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-[14px] font-bold text-[var(--accent-400)] uppercase tracking-[0.15em] flex items-center gap-3">
              <Settings2 size={16} strokeWidth={2.5} />
              {title}
            </h2>
            {renderDirtyIndicator(key, 'enabled')}
          </div>
          <label className="flex items-center gap-3 cursor-pointer group">
            <span className="text-[12px] font-bold text-white/50 group-hover:text-white/80 transition-colors">Enable Pipeline</span>
            <div 
              onClick={() => updatePipeline(key, 'enabled', !isEnabled)}
              className={`w-10 h-5.5 rounded-full flex items-center p-0.5 transition-colors ${isEnabled ? 'bg-[var(--accent-500)]' : 'bg-white/10'}`}>
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-4.5' : 'translate-x-0'}`}></div>
            </div>
          </label>
        </div>

        <div className={`flex gap-8 transition-all duration-300 ${!isEnabled ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
          
          {/* LEFT: Config */}
          <div className="flex-[1.5] flex flex-col gap-6">

            {/* AUTOMATION STRATEGY */}
            <div className="flex flex-col gap-3 pb-4 border-b border-white/[0.04]">
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Automation Strategy</label>
                {renderTooltip('Continuous: Upload otomatis setiap ada video baru. Campaign: Upload batch dari folder tertentu.')}
                {renderDirtyIndicator(key, 'automation_strategy')}
              </div>
              <div className="flex gap-3">
                <label className={`flex-1 flex items-center gap-3 p-3 rounded-[8px] border cursor-pointer transition-colors ${strategy === 'continuous' ? 'bg-[var(--accent-500)]/10 border-[var(--accent-500)]/30 text-[var(--accent-400)]' : 'bg-[#05080e] border-white/[0.08] text-white/50 hover:border-white/20'}`}>
                  <input 
                    type="radio" 
                    name={`${key}-strategy`} 
                    value="continuous" 
                    checked={strategy === 'continuous'}
                    onChange={() => updatePipeline(key, 'automation_strategy', 'continuous')}
                    className="hidden" 
                  />
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${strategy === 'continuous' ? 'border-[var(--accent-400)]' : 'border-white/20'}`}>
                    {strategy === 'continuous' && <div className="w-2 h-2 bg-[var(--accent-400)] rounded-full" />}
                  </div>
                  <span className="text-[12px] font-semibold">Continuous Engine</span>
                </label>

                <label className={`flex-1 flex items-center gap-3 p-3 rounded-[8px] border cursor-pointer transition-colors ${strategy === 'campaign' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-[#05080e] border-white/[0.08] text-white/50 hover:border-white/20'}`}>
                  <input 
                    type="radio" 
                    name={`${key}-strategy`} 
                    value="campaign" 
                    checked={strategy === 'campaign'}
                    onChange={() => {
                      updatePipeline(key, 'automation_strategy', 'campaign');
                      if (p.campaign_folder && !scanResults[key]) triggerScan(key, p.campaign_folder);
                    }}
                    className="hidden" 
                  />
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${strategy === 'campaign' ? 'border-purple-400' : 'border-white/20'}`}>
                    {strategy === 'campaign' && <div className="w-2 h-2 bg-purple-400 rounded-full" />}
                  </div>
                  <span className="text-[12px] font-semibold">Campaign Engine</span>
                </label>
              </div>
            </div>
            
            {strategy === 'continuous' ? (
              <>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Watch Folder</label>
                    {renderTooltip('Folder di komputer Anda yang akan terus dipantau.')}
                    {renderDirtyIndicator(key, 'watch_folder')}
                  </div>
                  <div className="h-[44px] rounded-[10px] bg-[#05080e] border border-white/[0.08] flex items-center justify-between px-3 overflow-hidden">
                    <span className="text-[13px] font-mono text-white/80 truncate">{p.watch_folder || 'Select a folder...'}</span>
                    <button onClick={() => browseFolder(key, false)} className="h-[28px] px-3 rounded-[6px] bg-[var(--accent-500)]/10 text-[var(--accent-400)] text-[11px] font-bold hover:bg-[var(--accent-500)]/20 transition-all shrink-0">
                      Browse
                    </button>
                  </div>
                </div>

            <div className="flex gap-5">
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Daily Limit</label>
                  {renderTooltip('Batas maksimal jumlah video yang boleh diproses dalam satu hari.')}
                  {renderDirtyIndicator(key, 'daily_limit')}
                </div>
                <input 
                  type="number" min="0" max="100" 
                  value={p.daily_limit !== undefined ? p.daily_limit : 0} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateDailyLimit(key, isNaN(val) ? 0 : val);
                  }}
                  className="h-[40px] rounded-[10px] bg-[#05080e] border border-white/[0.08] px-3 text-[14px] text-white outline-none focus:border-[var(--accent-500)] transition-colors" 
                />
              </div>
            </div>
            </>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Campaign Folder</label>
                    {renderTooltip('Folder Campaign yang berisi ratusan video batch Anda. Scan otomatis dilakukan saat folder dipilih.')}
                    {renderDirtyIndicator(key, 'campaign_folder')}
                  </div>
                  <div className="h-[44px] rounded-[10px] bg-[#05080e] border border-purple-500/30 flex items-center justify-between px-3 overflow-hidden">
                    <span className="text-[13px] font-mono text-purple-100 truncate">{p.campaign_folder || 'Select a campaign folder...'}</span>
                    <button onClick={() => browseFolder(key, true)} className="h-[28px] px-3 rounded-[6px] bg-purple-500/10 text-purple-400 text-[11px] font-bold hover:bg-purple-500/20 transition-all shrink-0">
                      Browse
                    </button>
                  </div>
                </div>

                <div className="flex gap-5">
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Videos Per Day</label>
                      {renderTooltip('Batas video campaign yang akan diupload per harinya.')}
                      {renderDirtyIndicator(key, 'daily_limit')}
                    </div>
                    <input 
                      type="number" min="0" max="100" 
                      value={p.daily_limit !== undefined ? p.daily_limit : 0} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        updateDailyLimit(key, isNaN(val) ? 0 : val);
                      }}
                      className="h-[40px] rounded-[10px] bg-[#05080e] border border-white/[0.08] px-3 text-[14px] text-white outline-none focus:border-[var(--accent-500)] transition-colors" 
                    />
                  </div>
                  <div className="flex-[2] flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Total Target Videos</label>
                      {renderTooltip('Batas maksimal video yang akan ditarik dari campaign folder ini.')}
                      {renderDirtyIndicator(key, 'videos_to_upload')}
                    </div>
                    <input 
                      type="number" min="0" max="10000" 
                      value={p.videos_to_upload !== undefined ? p.videos_to_upload : scanData.summary.available || 0} 
                      onChange={(e) => updatePipeline(key, 'videos_to_upload', parseInt(e.target.value) || 0)}
                      className="w-full h-[40px] rounded-[10px] bg-[#05080e] border border-white/[0.08] px-3 text-[14px] text-white outline-none focus:border-[var(--accent-500)] transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

            {/* SCHEDULE & HUMANIZE */}
            <div className="flex flex-col gap-4 p-5 rounded-[12px] bg-white/[0.02] border border-white/[0.03]">

              {/* AI METADATA GENERATION */}
              <div className="pb-4 border-b border-white/[0.04]">
                <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-[8px] border border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-[var(--accent-500)]/10 flex items-center justify-center">
                      <Settings2 size={14} className="text-[var(--accent-400)]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-white tracking-wide">AI Metadata Generation</span>
                      <span className="text-[10px] text-white/50">Automatically generate metadata before upload based on AI Identity</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderDirtyIndicator(key, 'ai_metadata_enabled')}
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div 
                        onClick={() => updatePipeline(key, 'ai_metadata_enabled', !p.ai_metadata_enabled)}
                        className={`w-9 h-5 rounded-full flex items-center p-0.5 transition-colors ${p.ai_metadata_enabled ? 'bg-[var(--accent-500)]' : 'bg-white/10'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${p.ai_metadata_enabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Deterministic Schedule</label>
                  {renderTooltip('Jadwal pasti kapan video-video Anda akan dirilis di YouTube setiap harinya.')}
                  {renderDirtyIndicator(key, 'schedule')}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => addSchedule(key)} className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--accent-400)] hover:text-[var(--accent-400)] bg-[var(--accent-500)]/10 px-2 py-1 rounded-[6px]" title="Add Daily Recurring Time">
                    <Plus size={12} /> Add Daily Time
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(p.schedule || []).map((time, idx) => {
                  const strTime = String(time);
                  const isDate = strTime.includes('-');
                  const timeOnly = isDate ? (strTime.includes('T') ? strTime.split('T')[1] : strTime.split(' ')[1]) || '12:00' : strTime;
                  return (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-[8px] bg-[#05080e] border border-white/[0.08] group hover:border-[var(--accent-500)]/30 transition-colors">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {isDate ? (
                          <input 
                            type="datetime-local" 
                            value={strTime.replace(' ', 'T').slice(0, 16)}
                            onChange={(e) => updateScheduleTime(key, idx, e.target.value.replace('T', ' '))}
                            className="bg-transparent border-none text-[12px] font-mono text-amber-400 outline-none flex-1 truncate"
                          />
                        ) : (
                          <input 
                            type="time" 
                            value={strTime}
                            onChange={(e) => updateScheduleTime(key, idx, e.target.value)}
                            className="bg-transparent border-none text-[13px] font-mono text-[var(--accent-400)] outline-none w-[65px] text-center"
                          />
                        )}
                        <span className="text-white/20 text-[10px]">→</span>
                        <span className="text-[11px] font-mono text-white/50 truncate">{formatSchedulePreview(strTime, p)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 ml-2 shrink-0">
                        <button 
                          onClick={() => {
                            if (isDate) {
                              updateScheduleTime(key, idx, timeOnly);
                            } else {
                              const todayStr = new Date().toISOString().slice(0, 10);
                              updateScheduleTime(key, idx, `${todayStr} ${strTime}`);
                            }
                          }}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors ${isDate ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'}`}
                          title={isDate ? "Switch to Daily Recurring Time" : "Switch to Specific Date & Time"}
                        >
                          {isDate ? "Date" : "Daily"}
                        </button>
                        <button onClick={() => removeSchedule(key, idx)} className="text-white/30 hover:text-red-400 p-1 transition-colors" title="Remove">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* HUMANIZE CONFIG */}
              <div className="mt-4 pt-5 border-t border-white/[0.04] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-[12px] font-bold text-white tracking-wide">Humanize (Random Delay)</label>
                    {renderHumanizeDirtyIndicator(key, 'enabled')}
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div 
                      onClick={() => updateHumanize(key, 'enabled', !humanize.enabled)}
                      className={`w-9 h-5 rounded-full flex items-center p-0.5 transition-colors ${humanize.enabled ? 'bg-[var(--accent-500)]' : 'bg-white/10'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${humanize.enabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                  </label>
                </div>

                <div className="flex items-start gap-3 bg-[#05080e]/50 p-3 rounded-[10px] border border-white/[0.04]">
                  <HelpCircle size={14} className="text-[var(--accent-400)] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    Humanize adds a random delay during scheduling to create more natural publishing behavior. <strong className="text-white/70">The Watch Folder Engine never applies this.</strong> The Schedule Engine applies the delay when creating the final scheduled upload time.
                  </p>
                </div>

                <div className={`flex items-center gap-3 transition-opacity ${!humanize.enabled ? 'opacity-30 pointer-events-none' : ''}`}>
                  <div className="flex-1 flex items-center gap-3 bg-[#05080e] rounded-[8px] border border-white/[0.08] px-3 h-[40px] group focus-within:border-[var(--accent-500)]/50 transition-colors relative">
                    <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider w-[30px]">Min</span>
                    <input 
                      type="number" min="0" max="60"
                      value={humanize.min_delay_minutes}
                      onChange={(e) => updateHumanize(key, 'min_delay_minutes', parseInt(e.target.value) || 0)}
                      className="flex-1 bg-transparent border-none text-white text-[14px] font-mono outline-none"
                    />
                    <span className="text-[11px] text-white/40">minutes</span>
                    <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 translate-x-full">{renderHumanizeDirtyIndicator(key, 'min_delay_minutes')}</div>
                  </div>
                  <span className="text-white/20 font-mono">—</span>
                  <div className="flex-1 flex items-center gap-3 bg-[#05080e] rounded-[8px] border border-white/[0.08] px-3 h-[40px] group focus-within:border-[var(--accent-500)]/50 transition-colors relative">
                    <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider w-[30px]">Max</span>
                    <input 
                      type="number" min="0" max="120"
                      value={humanize.max_delay_minutes}
                      onChange={(e) => updateHumanize(key, 'max_delay_minutes', parseInt(e.target.value) || 0)}
                      className="flex-1 bg-transparent border-none text-white text-[14px] font-mono outline-none"
                    />
                    <span className="text-[11px] text-white/40">minutes</span>
                    <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 translate-x-full">{renderHumanizeDirtyIndicator(key, 'max_delay_minutes')}</div>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* RIGHT: Dashboard Widget or Campaign Widget */}
          <div className="flex-1 flex flex-col gap-4">
            {strategy === 'continuous' ? (
              <div className="p-5 rounded-[12px] bg-[#030508] border border-white/[0.03] flex flex-col gap-4 relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-500)]/5 blur-[40px] rounded-full pointer-events-none"></div>
                
                <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04]">
                  <Activity size={14} className="text-[var(--accent-400)]" />
                  <span className="text-[13px] font-bold text-white tracking-wide">Intake Dashboard</span>
                </div>

                {/* STATS GRID */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 p-3 rounded-[8px] bg-white/[0.02]">
                    <div className="flex items-center gap-1.5 group/tooltip relative">
                      <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Imported Today</span>
                    </div>
                    <span className="text-[20px] font-mono font-bold text-white"><span className="text-[var(--accent-400)]">{s.today_intake}</span><span className="text-white/20 text-[14px]">/{p.daily_limit || 0}</span></span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 p-3 rounded-[8px] bg-white/[0.02]">
                    <div className="flex items-center gap-1.5 group/tooltip relative">
                      <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Remaining Today</span>
                    </div>
                    <span className="text-[20px] font-mono font-bold text-white">{remainingToday}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 p-3 rounded-[8px] bg-white/[0.02] col-span-2">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Pipeline Status</span>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-green-400 animate-pulse' : 'bg-white/20'}`}></span>
                      <span className="text-[13px] font-bold text-white">{isEnabled ? (s.status || 'Running & Monitoring') : 'Idle (Disabled)'}</span>
                    </div>
                  </div>
                </div>
                
                {/* TELEMETRY */}
                <div className="mt-2 pt-4 border-t border-white/[0.04] flex flex-col gap-3">
                  <div className="flex justify-between items-center group/tooltip relative">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-white/40">Waiting Packages</span>
                    </div>
                    <span className="text-[12px] font-mono text-white/70">{s.waiting_packages !== undefined ? s.waiting_packages : '—'}</span>
                  </div>
                  <div className="flex justify-between items-center group/tooltip relative">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-white/40">Invalid Packages</span>
                    </div>
                    <span className="text-[12px] font-mono text-white/70">{s.invalid_packages !== undefined ? s.invalid_packages : '—'}</span>
                  </div>
                  <div className="flex justify-between items-center group/tooltip relative">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-white/40">Duplicates Ignored</span>
                    </div>
                    <span className="text-[12px] font-mono text-white/70">{s.duplicate_ignored !== undefined ? s.duplicate_ignored : '—'}</span>
                  </div>
                  <div className="flex justify-between items-center group/tooltip relative">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-white/40">Last Scan</span>
                    </div>
                    <span className="text-[12px] font-mono text-white/70">{s.last_scan ? new Date(s.last_scan).toLocaleTimeString() : '—'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-[12px] bg-purple-900/10 border border-purple-500/20 flex flex-col gap-4 relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[40px] rounded-full pointer-events-none"></div>
                
                <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
                  <div className="flex items-center gap-2">
                    <ListVideo size={14} className="text-purple-400" />
                    <span className="text-[13px] font-bold text-purple-100 tracking-wide">Campaign Summary</span>
                  </div>
                  {isScanning[key] && <div className="text-[10px] text-purple-400 animate-pulse font-bold">SCANNING...</div>}
                </div>

                {/* STATS GRID */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 p-3 rounded-[8px] bg-white/[0.02]">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Detected</span>
                    <span className="text-[20px] font-mono font-bold text-white">{scanData.detected || 0}</span>
                  </div>
                  <div className="flex flex-col gap-1.5 p-3 rounded-[8px] bg-white/[0.02]">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Available (New)</span>
                    <span className="text-[20px] font-mono font-bold text-green-400">{scanData.available || 0}</span>
                  </div>
                  <div className="flex flex-col gap-1.5 p-3 rounded-[8px] bg-white/[0.02]">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Selected</span>
                    <span className="text-[20px] font-mono font-bold text-cyan-400">{scanData.selected || 0}</span>
                  </div>
                  <div className="flex flex-col gap-1.5 p-3 rounded-[8px] bg-white/[0.02]">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Invalid / Dup</span>
                    <span className="text-[20px] font-mono font-bold text-amber-400">{(scanData.invalid || 0) + (scanData.duplicate || 0)}</span>
                  </div>
                </div>

                {/* PREVIEW */}
                <div className="mt-2 pt-4 border-t border-purple-500/20 flex flex-col gap-3">
                  <div className="flex justify-between items-center group/tooltip relative">
                    <span className="text-[11px] font-bold text-white/40">Est. Coverage</span>
                    <span className="text-[12px] font-mono text-purple-300 font-bold">
                      {p.daily_limit ? `${Math.ceil((scanData.selected || 0) / p.daily_limit)} days` : '0 days'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center group/tooltip relative">
                    <span className="text-[11px] font-bold text-white/40">Est. Upload Size</span>
                    <span className="text-[12px] font-mono text-purple-300 font-bold">
                      {((scanData.selected_file_size || 0) / 1024 / 1024 / 1024).toFixed(2)} GB
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CAMPAIGN REVIEW WORKSPACE */}
        {strategy === 'campaign' && scanData.assets && scanData.assets.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/[0.04]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[12px] font-bold text-white/70 tracking-wider uppercase flex items-center gap-2">
                Campaign Review Workspace
                {scanData.status === 'LOCKED' && <span className="text-[10px] font-mono text-red-400 bg-red-500/10 px-2 py-1 rounded">LOCKED</span>}
                {scanData.status !== 'LOCKED' && <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">{scanData.status}</span>}
              </h3>
              {scanData.status !== 'LOCKED' ? (
                <button 
                  onClick={() => handleApproveCampaign(key)}
                  disabled={scanData.selected === 0}
                  className="px-4 py-1.5 rounded bg-cyan-500 text-white text-[11px] font-bold disabled:opacity-50 hover:bg-cyan-400 transition-colors"
                >
                  Approve Campaign
                </button>
              ) : queuePlans[key] && queuePlans[key].length > 0 ? (
                <button 
                  onClick={() => handleStartCampaign(key, scanData.id)}
                  disabled={isBuildingQueue[key] || queuePlans[key].some(p => p.execution_status !== 'PLANNED')}
                  className="px-4 py-1.5 rounded bg-green-500 text-white text-[11px] font-bold disabled:opacity-50 hover:bg-green-400 transition-colors flex items-center gap-2"
                >
                  {isBuildingQueue[key] ? 'Starting...' : 'Start Campaign Upload'}
                </button>
              ) : (
                <button 
                  onClick={() => handleBuildQueue(key, scanData.id)}
                  disabled={isBuildingQueue[key]}
                  className="px-4 py-1.5 rounded bg-purple-500 text-white text-[11px] font-bold disabled:opacity-50 hover:bg-purple-400 transition-colors flex items-center gap-2"
                >
                  {isBuildingQueue[key] ? 'Building...' : 'Build Upload Plan'}
                </button>
              )}
            </div>
            <div className="w-full overflow-y-auto max-h-[400px] rounded-[8px] border border-white/[0.04]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#111824] z-10 shadow-md">
                  <tr className="text-[10px] font-bold text-white/40 uppercase tracking-wider border-b border-white/[0.04]">
                    <th className="px-4 py-3 w-[40px]">Select</th>
                    <th className="px-4 py-3">Filename / Metadata</th>
                    <th className="px-4 py-3 w-[100px]">Size</th>
                    <th className="px-4 py-3 w-[120px]">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white/[0.01]">
                  {scanData.assets.map((asset, idx) => (
                    <tr key={idx} className={`border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors ${!asset.editable && asset.status !== 'NEW' ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 align-top">
                        <input 
                          type="checkbox" 
                          checked={asset.selected} 
                          disabled={scanData.status === 'LOCKED' || asset.status !== 'NEW'} 
                          onChange={(e) => handleSelectAsset(key, asset.id, e.target.checked)}
                          className={scanData.status === 'LOCKED' || asset.status !== 'NEW' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} 
                        />
                      </td>
                      <td className="px-4 py-3 flex flex-col gap-2">
                        <div className="text-[12px] font-mono text-white/80 truncate max-w-[300px]" title={asset.filepath}>{asset.filename}</div>
                        {asset.editable && scanData.status !== 'LOCKED' ? (
                          <div className="flex flex-col gap-1 mt-1">
                            <input 
                              type="text" 
                              value={asset.title || ''} 
                              onChange={(e) => handleUpdateMetadata(key, asset.id, 'title', e.target.value)}
                              placeholder="Video Title" 
                              className="bg-black/30 border border-white/10 rounded px-2 py-1 text-[11px] text-white w-full focus:outline-none focus:border-cyan-500/50"
                            />
                            <input 
                              type="text" 
                              value={asset.tags || ''} 
                              onChange={(e) => handleUpdateMetadata(key, asset.id, 'tags', e.target.value)}
                              placeholder="Tags (comma separated)" 
                              className="bg-black/30 border border-white/10 rounded px-2 py-1 text-[11px] text-white w-full focus:outline-none focus:border-cyan-500/50"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1 mt-1">
                            <div className="text-[11px] text-white/60">Title: {asset.title || 'N/A'}</div>
                            <div className="text-[10px] text-white/40">Tags: {asset.tags || 'N/A'}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[11px] font-mono text-white/50 align-top">{(asset.filesize / 1024 / 1024).toFixed(1)} MB</td>
                      <td className="px-4 py-3 align-top">
                        {asset.status === 'NEW' && <span className="px-2 py-0.5 rounded-[4px] bg-green-500/10 text-green-400 text-[10px] font-bold">NEW</span>}
                        {asset.status === 'CONSUMED' && <span className="px-2 py-0.5 rounded-[4px] bg-white/10 text-white/50 text-[10px] font-bold">CONSUMED</span>}
                        {asset.status === 'INVALID' && <span className="px-2 py-0.5 rounded-[4px] bg-red-500/10 text-red-400 text-[10px] font-bold">INVALID</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* QUEUE PLANS DISPLAY */}
            {queuePlans[key] && queuePlans[key].length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/[0.04]">
                <h3 className="text-[12px] font-bold text-white/70 tracking-wider uppercase mb-4">
                  Upload Timeline ({queuePlans[key].length} videos)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {queuePlans[key].map((plan, idx) => (
                    <div key={idx} className="flex flex-col gap-2 p-3 rounded-[8px] bg-black/20 border border-white/[0.04]">
                      <div className="flex justify-between items-center">
                        <span className="text-[12px] font-bold text-purple-400">{plan.publish_date}</span>
                        <div className="flex items-center gap-2">
                          {plan.execution_status === 'FAILED' && (
                            <button onClick={() => handleRetryPlan(key, scanData.id, plan.id)} className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded-[4px] text-[9px] uppercase tracking-wider font-bold">
                              Retry
                            </button>
                          )}
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] ${
                            plan.execution_status === 'COMPLETED' || plan.execution_status === 'UPLOADED' ? 'bg-green-500/20 text-green-400' :
                            plan.execution_status === 'FAILED' ? 'bg-red-500/20 text-red-400' :
                            plan.execution_status === 'UPLOADING' ? 'bg-blue-500/20 text-blue-400' :
                            plan.execution_status === 'READY' ? 'bg-cyan-500/20 text-cyan-400' :
                            'bg-white/10 text-white/50'
                          }`}>
                            {plan.execution_status}
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] text-white/80 truncate font-mono" title={plan.title}>{plan.title || 'Untitled Video'}</div>
                      <div className="text-[10px] text-white/40 flex justify-between">
                        <span>Order: {plan.publish_order + 1}</span>
                        <span>{new Date(plan.humanized_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {plan.youtube_video_id && (
                        <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-1 mt-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {plan.youtube_video_id}
                        </div>
                      )}
                      {plan.last_error && plan.execution_status === 'FAILED' && (
                        <div className="text-[9px] text-red-400 line-clamp-2 mt-1 bg-red-500/10 p-1.5 rounded-[4px]">
                          {plan.last_error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button 
              onClick={() => {
                useAppStore.getState().setJournalContext({ channelId: scanData.id });
                useAppStore.getState().setActiveModule('Journal');
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-[13px] font-medium text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-sm"
            >
              <Activity className="h-4 w-4" />
              Open Upload Journal
            </button>
          </div>
        )}
      </div>
    )
  }

  const isConfigured = (pipeline) => draft?.[pipeline]?.watch_folder ? '✓ Configured' : '⚠ Missing Folder'

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* CHANNEL HEALTH SUMMARY CARD */}
      <div className="flex items-center gap-6 p-6 rounded-[16px] bg-[#0a0f18]/90 backdrop-blur-xl border border-white/[0.04]">
        <div className={`flex items-center justify-center w-14 h-14 rounded-full shrink-0 border shadow-lg ${
          channelStatus === 'Connected' ? 'bg-green-500/10 border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.15)] text-green-400' : 'bg-red-500/10 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.15)] text-red-400 animate-pulse'
        }`}>
          <HeartPulse size={24} />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <h2 className="text-[16px] font-bold text-white">Channel Health</h2>
          {channelStatus === 'Connected' ? (
            <span className="text-[12px] font-bold text-green-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> Overall System Healthy</span>
          ) : (
            <span className="text-[12px] font-bold text-red-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span> Needs Reconnection</span>
          )}
        </div>
        
        <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-3 pl-8 border-l border-white/[0.08]">
          <div className="flex justify-between items-center">
            <span className="text-[12px] text-white/50 font-bold">Watch Long</span>
            <span className={`text-[12px] font-bold ${draft?.long?.watch_folder ? 'text-green-400' : 'text-amber-400'}`}>{isConfigured('long')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[12px] text-white/50 font-bold">Watch Shorts</span>
            <span className={`text-[12px] font-bold ${draft?.shorts?.watch_folder ? 'text-green-400' : 'text-amber-400'}`}>{isConfigured('shorts')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[12px] text-white/50 font-bold">OAuth Connection</span>
            <span className={`text-[12px] font-bold ${channelStatus === 'Connected' ? 'text-green-400' : 'text-red-400'}`}>
              {channelStatus === 'Connected' ? '✓ Connected' : '⚠ Disconnected'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[12px] text-white/50 font-bold">Upload Defaults</span>
            <span className={`text-[12px] font-bold ${channelStatus === 'Connected' ? 'text-green-400' : 'text-amber-400'}`}>
              {channelStatus === 'Connected' ? '✓ Active' : '⚠ Paused'}
            </span>
          </div>
        </div>
      </div>

      {renderPipeline('long', 'Watch Long Videos')}
      {renderPipeline('shorts', 'Watch Short Videos')}
      
    </div>
  )
}
