import { Folder, Settings2, Activity, Plus, Trash2, HelpCircle, HeartPulse, CheckCircle2, ShieldAlert, Info } from 'lucide-react'
import apiClient from '../../../../api/client'

export default function GeneralTab({ draft, original, onChange, states, channelStatus }) {
  
  const updatePipeline = (key, field, value) => {
    const updated = { ...draft }
    updated[key] = { ...(updated[key] || {}) }
    updated[key][field] = value
    onChange(updated)
  }

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

  const browseFolder = async (key) => {
    try {
      const res = await apiClient.get('/system/browse-folder')
      if (res && res.path) {
        updatePipeline(key, 'watch_folder', res.path)
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
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Watch Folder</label>
                {renderTooltip('Folder di komputer Anda yang akan terus dipantau. Video yang masuk ke folder ini akan otomatis diproses.')}
                {renderDirtyIndicator(key, 'watch_folder')}
              </div>
              <div className="h-[44px] rounded-[10px] bg-[#05080e] border border-white/[0.08] flex items-center justify-between px-3 overflow-hidden">
                <span className="text-[13px] font-mono text-white/80 truncate">{p.watch_folder || 'Select a folder...'}</span>
                <button onClick={() => browseFolder(key)} className="h-[28px] px-3 rounded-[6px] bg-[var(--accent-500)]/10 text-[var(--accent-400)] text-[11px] font-bold hover:bg-[var(--accent-500)]/20 transition-all shrink-0">
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
              <div className="flex-[2] flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Processing Order</label>
                  {renderTooltip('Urutan video yang akan diprioritaskan saat ada banyak video dalam folder.')}
                  {renderDirtyIndicator(key, 'processing_order')}
                </div>
                <div className="relative">
                  <select 
                    value={p.processing_order || 'oldest_first'}
                    onChange={(e) => updatePipeline(key, 'processing_order', e.target.value)}
                    className="w-full h-[40px] rounded-[10px] bg-[#05080e] border border-white/[0.08] px-3 text-[13px] text-white outline-none focus:border-[var(--accent-500)] transition-colors appearance-none relative z-10"
                  >
                    <option value="oldest_first">Oldest First</option>
                    <option value="newest_first">Newest First</option>
                    <option value="alphabetical">Alphabetical</option>
                    <option value="random">Random</option>
                  </select>
                  <div className="mt-2 p-3 bg-white/[0.02] border border-white/[0.04] rounded-[8px]">
                    <span className="text-[11px] text-white/50 leading-relaxed block">
                      {p.processing_order === 'oldest_first' && 'Oldest First: Process the oldest packages first based on modification time.'}
                      {p.processing_order === 'newest_first' && 'Newest First: Prioritize newly added packages immediately.'}
                      {p.processing_order === 'alphabetical' && 'Alphabetical: Useful for strictly numbered batches (e.g. 01_video).'}
                      {p.processing_order === 'random' && 'Random: Randomize package processing order completely.'}
                      {!p.processing_order && 'Oldest First: Process the oldest packages first based on modification time.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SCHEDULE & HUMANIZE */}
            <div className="flex flex-col gap-4 p-5 rounded-[12px] bg-white/[0.02] border border-white/[0.03]">

              <div className="flex flex-col gap-3 pb-4 border-b border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Schedule Mode</label>
                  {renderTooltip('Pilih apakah aplikasi menahan video (AutoUploader), atau langsung diserahkan ke YouTube (YouTube Studio).')}
                  {renderDirtyIndicator(key, 'schedule_mode')}
                </div>
                <div className="flex gap-3">
                  <label className={`flex-1 flex items-center gap-3 p-3 rounded-[8px] border cursor-pointer transition-colors ${p.schedule_mode !== 'youtube' ? 'bg-[var(--accent-500)]/10 border-[var(--accent-500)]/30 text-[var(--accent-400)]' : 'bg-[#05080e] border-white/[0.08] text-white/50 hover:border-white/20'}`}>
                    <input 
                      type="radio" 
                      name={`${key}-schedule-mode`} 
                      value="application" 
                      checked={p.schedule_mode !== 'youtube'}
                      onChange={() => updatePipeline(key, 'schedule_mode', 'application')}
                      className="hidden" 
                    />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${p.schedule_mode !== 'youtube' ? 'border-[var(--accent-400)]' : 'border-white/20'}`}>
                      {p.schedule_mode !== 'youtube' && <div className="w-2 h-2 bg-[var(--accent-400)] rounded-full" />}
                    </div>
                    <span className="text-[12px] font-semibold">AutoUploader Scheduler</span>
                  </label>

                  <label className={`flex-1 flex items-center gap-3 p-3 rounded-[8px] border cursor-pointer transition-colors ${p.schedule_mode === 'youtube' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-[#05080e] border-white/[0.08] text-white/50 hover:border-white/20'}`}>
                    <input 
                      type="radio" 
                      name={`${key}-schedule-mode`} 
                      value="youtube" 
                      checked={p.schedule_mode === 'youtube'}
                      onChange={() => updatePipeline(key, 'schedule_mode', 'youtube')}
                      className="hidden" 
                    />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${p.schedule_mode === 'youtube' ? 'border-red-400' : 'border-white/20'}`}>
                      {p.schedule_mode === 'youtube' && <div className="w-2 h-2 bg-red-400 rounded-full" />}
                    </div>
                    <span className="text-[12px] font-semibold">YouTube Studio Scheduler</span>
                  </label>
                </div>
              </div>

              {/* SPRINT 10.5 METADATA & UPLOAD MODE */}
              <div className="flex flex-col gap-3 pb-4 border-b border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Upload Mode</label>
                  {renderTooltip('Auto Upload: Langsung proses otomatis. Waiting For Approval: Masukkan ke queue Review terlebih dahulu.')}
                  {renderDirtyIndicator(key, 'upload_mode')}
                </div>
                <div className="flex gap-3">
                  <label className={`flex-1 flex items-center gap-3 p-3 rounded-[8px] border cursor-pointer transition-colors ${p.upload_mode !== 'Auto Upload' ? 'bg-[var(--accent-500)]/10 border-[var(--accent-500)]/30 text-[var(--accent-400)]' : 'bg-[#05080e] border-white/[0.08] text-white/50 hover:border-white/20'}`}>
                    <input 
                      type="radio" 
                      name={`${key}-upload-mode`} 
                      value="Waiting For Approval" 
                      checked={p.upload_mode !== 'Auto Upload'}
                      onChange={() => updatePipeline(key, 'upload_mode', 'Waiting For Approval')}
                      className="hidden" 
                    />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${p.upload_mode !== 'Auto Upload' ? 'border-[var(--accent-400)]' : 'border-white/20'}`}>
                      {p.upload_mode !== 'Auto Upload' && <div className="w-2 h-2 bg-[var(--accent-400)] rounded-full" />}
                    </div>
                    <span className="text-[12px] font-semibold">Waiting For Approval</span>
                  </label>

                  <label className={`flex-1 flex items-center gap-3 p-3 rounded-[8px] border cursor-pointer transition-colors ${p.upload_mode === 'Auto Upload' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-[#05080e] border-white/[0.08] text-white/50 hover:border-white/20'}`}>
                    <input 
                      type="radio" 
                      name={`${key}-upload-mode`} 
                      value="Auto Upload" 
                      checked={p.upload_mode === 'Auto Upload'}
                      onChange={() => updatePipeline(key, 'upload_mode', 'Auto Upload')}
                      className="hidden" 
                    />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${p.upload_mode === 'Auto Upload' ? 'border-amber-400' : 'border-white/20'}`}>
                      {p.upload_mode === 'Auto Upload' && <div className="w-2 h-2 bg-amber-400 rounded-full" />}
                    </div>
                    <span className="text-[12px] font-semibold">Auto Upload</span>
                  </label>
                </div>
                
                <div className="flex items-center justify-between mt-2 p-3 bg-white/[0.02] rounded-[8px] border border-white/[0.04]">
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
                  <button onClick={() => {
                    const updated = { ...draft };
                    updated[key] = { ...(updated[key] || {}) };
                    if (!updated[key].schedule) updated[key].schedule = [];
                    const todayStr = new Date().toISOString().slice(0, 10);
                    updated[key].schedule = [...updated[key].schedule, `${todayStr} 12:00`];
                    onChange(updated);
                  }} className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2 py-1 rounded-[6px]" title="Add Specific Date & Time">
                    <Plus size={12} /> Add Date & Time
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

          {/* RIGHT: Dashboard Widget */}
          <div className="flex-1 flex flex-col gap-4">
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
                    <Info size={12} className="text-white/30 cursor-help" />
                    <div className="absolute left-0 bottom-[120%] w-[200px] p-2 bg-[#111824] border border-white/10 rounded-[6px] text-[10px] text-white/70 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none shadow-xl">
                      Jumlah package yang berhasil diimpor hari ini.
                    </div>
                  </div>
                  <span className="text-[20px] font-mono font-bold text-white"><span className="text-[var(--accent-400)]">{s.today_intake}</span><span className="text-white/20 text-[14px]">/{p.daily_limit || 0}</span></span>
                </div>
                
                <div className="flex flex-col gap-1.5 p-3 rounded-[8px] bg-white/[0.02]">
                  <div className="flex items-center gap-1.5 group/tooltip relative">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Remaining Today</span>
                    <Info size={12} className="text-white/30 cursor-help" />
                    <div className="absolute right-0 bottom-[120%] w-[200px] p-2 bg-[#111824] border border-white/10 rounded-[6px] text-[10px] text-white/70 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none shadow-xl">
                      Sisa kuota import hari ini berdasarkan Daily Limit.
                    </div>
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
                    <Info size={12} className="text-white/30 cursor-help" />
                    <div className="absolute left-0 bottom-[120%] w-[220px] p-2 bg-[#111824] border border-white/10 rounded-[6px] text-[10px] text-white/70 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none shadow-xl">
                      Jumlah package valid yang masih berada di Watch Folder dan belum masuk Upload Queue.
                    </div>
                  </div>
                  <span className="text-[12px] font-mono text-white/70">{s.waiting_packages !== undefined ? s.waiting_packages : '—'}</span>
                </div>
                
                <div className="flex justify-between items-center group/tooltip relative">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-white/40">Invalid Packages</span>
                    <Info size={12} className="text-white/30 cursor-help" />
                    <div className="absolute left-0 bottom-[120%] w-[220px] p-2 bg-[#111824] border border-white/10 rounded-[6px] text-[10px] text-white/70 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none shadow-xl">
                      Package yang gagal divalidasi karena struktur folder tidak sesuai.
                    </div>
                  </div>
                  <span className="text-[12px] font-mono text-white/70">{s.invalid_packages !== undefined ? s.invalid_packages : '—'}</span>
                </div>
                
                <div className="flex justify-between items-center group/tooltip relative">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-white/40">Duplicates Ignored</span>
                    <Info size={12} className="text-white/30 cursor-help" />
                    <div className="absolute left-0 bottom-[120%] w-[220px] p-2 bg-[#111824] border border-white/10 rounded-[6px] text-[10px] text-white/70 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none shadow-xl">
                      Package yang dilewati karena sudah pernah diimport sebelumnya.
                    </div>
                  </div>
                  <span className="text-[12px] font-mono text-white/70">{s.duplicate_ignored !== undefined ? s.duplicate_ignored : '—'}</span>
                </div>
                
                <div className="flex justify-between items-center group/tooltip relative">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-white/40">Last Scan</span>
                    <Info size={12} className="text-white/30 cursor-help" />
                    <div className="absolute left-0 bottom-[120%] w-[220px] p-2 bg-[#111824] border border-white/10 rounded-[6px] text-[10px] text-white/70 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none shadow-xl">
                      Waktu terakhir Watch Folder melakukan scanning.
                    </div>
                  </div>
                  <span className="text-[12px] font-mono text-white/70">{s.last_scan ? new Date(s.last_scan).toLocaleTimeString() : '—'}</span>
                </div>
                
                <div className="flex justify-between items-center group/tooltip relative">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-white/40">Last Error</span>
                    <Info size={12} className="text-white/30 cursor-help" />
                    <div className="absolute left-0 bottom-[120%] w-[220px] p-2 bg-[#111824] border border-white/10 rounded-[6px] text-[10px] text-white/70 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none shadow-xl">
                      Error terakhir yang terjadi pada pipeline ini.
                    </div>
                  </div>
                  <span className="text-[12px] font-mono text-red-400 truncate max-w-[120px]" title={s.last_error || ''}>{s.last_error || '—'}</span>
                </div>
                
              </div>

            </div>
          </div>

        </div>
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
