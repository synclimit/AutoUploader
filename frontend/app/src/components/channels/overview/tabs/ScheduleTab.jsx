import { useState, useEffect } from 'react'
import { Clock, CalendarDays, Zap } from 'lucide-react'

export default function ScheduleTab({ channel, updateAccount }) {
  const [prefTime, setPrefTime] = useState(channel?.preferred_publish_time || '18:00')
  const [pubMode, setPubMode] = useState(channel?.publish_mode || 'humanized')
  const [variance, setVariance] = useState(channel?.publish_variance || 30)
  const [pubDays, setPubDays] = useState(() => {
    if (channel?.publish_days) {
      return Array.isArray(channel.publish_days) ? channel.publish_days : channel.publish_days.split(',')
    }
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  })
  
  const [scheduleProfile, setScheduleProfile] = useState({ schedule_mode: 'autouploader' })
  const [previewSchedule, setPreviewSchedule] = useState([])

  useEffect(() => {
    if (channel) {
      setPrefTime(channel.preferred_publish_time || '18:00')
      setPubMode(channel.publish_mode || 'humanized')
      setVariance(channel.publish_variance || 30)
      setPubDays(channel.publish_days ? (Array.isArray(channel.publish_days) ? channel.publish_days : channel.publish_days.split(',')) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
      
      if (channel.schedule_profile) {
        try {
          const sp = typeof channel.schedule_profile === 'string' ? JSON.parse(channel.schedule_profile) : channel.schedule_profile
          if (sp.schedule_mode) {
            setScheduleProfile(sp)
          }
        } catch (e) {}
      }
    }
  }, [channel])

  // Auto-save debounce
  useEffect(() => {
    if (!channel) return
    const timer = setTimeout(() => {
      if (
        channel.preferred_publish_time !== prefTime ||
        channel.publish_mode !== pubMode ||
        channel.publish_variance !== variance ||
        JSON.stringify(channel.publish_days) !== JSON.stringify(pubDays) ||
        JSON.stringify(channel.schedule_profile) !== JSON.stringify(scheduleProfile)
      ) {
        updateAccount(channel.id, {
          preferred_publish_time: prefTime,
          publish_mode: pubMode,
          publish_variance: variance,
          publish_days: Array.isArray(pubDays) ? pubDays.join(',') : pubDays,
          schedule_profile: JSON.stringify(scheduleProfile)
        })
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [prefTime, pubMode, variance, pubDays, scheduleProfile, channel?.id, updateAccount])


  useEffect(() => {
    // Generate deterministic preview schedule
    const generatePreview = () => {
      if (!prefTime) return []
      
      const [hours, minutes] = prefTime.split(':').map(Number)
      
      const days = ['Today', 'Tomorrow', 'Thursday', 'Friday']
      const preview = days.map((dayLabel, index) => {
        let finalHours = hours
        let finalMinutes = minutes
        
        if (pubMode === 'humanized') {
          const randomOffsets = [7, -4, 24, 11, -15, 8]
          const offset = randomOffsets[index % randomOffsets.length]
          const scaledOffset = Math.round((offset / 30) * variance)
          
          finalMinutes += scaledOffset
          
          if (finalMinutes >= 60) {
            finalHours += Math.floor(finalMinutes / 60)
            finalMinutes = finalMinutes % 60
          } else if (finalMinutes < 0) {
            finalHours -= Math.ceil(Math.abs(finalMinutes) / 60)
            finalMinutes = 60 + (finalMinutes % 60)
          }
          if (finalHours >= 24) finalHours = finalHours % 24
          if (finalHours < 0) finalHours = 24 + finalHours
        }
        
        const timeStr = `${finalHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`
        return { label: dayLabel, time: timeStr }
      })
      setPreviewSchedule(preview)
    }
    
    generatePreview()
  }, [prefTime, pubMode, variance, pubDays])

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      
      <div className="flex flex-col gap-4">
        <h2 className="text-[16px] font-bold text-[var(--accent-400)] border-b border-white/10 pb-2">Schedule Mode</h2>
        <div className="grid grid-cols-2 gap-4">
          <label className={`p-4 rounded-[12px] border cursor-pointer transition-all flex flex-col gap-2 ${scheduleProfile.schedule_mode === 'autouploader' ? 'bg-[var(--accent-500)]/10 border-[var(--accent-500)]/50 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'bg-[#0a0f18]/80 border-white/[0.04] hover:border-white/20'}`}>
            <div className="flex items-center gap-3">
              <input type="radio" checked={scheduleProfile.schedule_mode === 'autouploader'} onChange={() => setScheduleProfile({ ...scheduleProfile, schedule_mode: 'autouploader' })} className="hidden" />
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${scheduleProfile.schedule_mode === 'autouploader' ? 'border-[var(--accent-400)]' : 'border-white/30'}`}>
                {scheduleProfile.schedule_mode === 'autouploader' && <div className="w-2 h-2 bg-[var(--accent-400)] rounded-full"></div>}
              </div>
              <span className="text-[14px] font-bold text-white">AutoUploader Schedule</span>
            </div>
            <p className="text-[12px] text-white/50 ml-7">Video stays inside queue. Upload occurs only at scheduled time.</p>
          </label>

          <label className={`p-4 rounded-[12px] border cursor-pointer transition-all flex flex-col gap-2 ${scheduleProfile.schedule_mode === 'youtube' ? 'bg-[var(--accent-500)]/10 border-[var(--accent-500)]/50 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'bg-[#0a0f18]/80 border-white/[0.04] hover:border-white/20'}`}>
            <div className="flex items-center gap-3">
              <input type="radio" checked={scheduleProfile.schedule_mode === 'youtube'} onChange={() => setScheduleProfile({ ...scheduleProfile, schedule_mode: 'youtube' })} className="hidden" />
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${scheduleProfile.schedule_mode === 'youtube' ? 'border-[var(--accent-400)]' : 'border-white/30'}`}>
                {scheduleProfile.schedule_mode === 'youtube' && <div className="w-2 h-2 bg-[var(--accent-400)] rounded-full"></div>}
              </div>
              <span className="text-[14px] font-bold text-white">YouTube Studio Schedule</span>
            </div>
            <p className="text-[12px] text-white/50 ml-7">Upload immediately. Visibility set to Scheduled in YouTube Studio.</p>
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-[16px] font-bold text-[var(--accent-400)] border-b border-white/10 pb-2">Timing Rules</h2>
        
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 flex flex-col gap-5 p-5 rounded-[14px] bg-[#0a0f18]/80 backdrop-blur-xl border border-white/[0.04]">
            
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <span className="text-[14px] font-bold text-white tracking-wide">Preferred Publish Time</span>
                <span className="text-[12px] text-white/40">The base time for scheduling videos.</span>
              </div>
              <input 
                type="time" 
                value={prefTime} 
                onChange={(e) => setPrefTime(e.target.value)}
                className="bg-[#0f1623] border border-white/[0.08] rounded-[8px] px-3 py-1.5 text-white font-mono text-[14px] outline-none focus:border-[var(--accent-500)] transition-colors"
              />
            </div>

            <div className="w-full h-[1px] bg-white/[0.04]"></div>

            <div className="flex flex-col gap-3">
              <span className="text-[14px] font-bold text-white tracking-wide">Publishing Mode</span>
              <div className="flex gap-4">
                <label className={`flex-1 p-3 rounded-[10px] border cursor-pointer transition-all flex items-center gap-3 ${pubMode === 'humanized' ? 'bg-[var(--accent-500)]/10 border-[var(--accent-500)]/30' : 'bg-white/[0.02] border-white/[0.05]'}`}>
                  <input type="radio" name="pubMode" value="humanized" checked={pubMode === 'humanized'} onChange={() => setPubMode('humanized')} className="hidden" />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${pubMode === 'humanized' ? 'border-[var(--accent-400)]' : 'border-white/30'}`}>
                    {pubMode === 'humanized' && <div className="w-2 h-2 bg-[var(--accent-400)] rounded-full"></div>}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[13px] font-bold ${pubMode === 'humanized' ? 'text-[var(--accent-400)]' : 'text-white/70'}`}>Humanized</span>
                    <span className="text-[11px] text-white/40">Adds natural variance</span>
                  </div>
                </label>
                
                <label className={`flex-1 p-3 rounded-[10px] border cursor-pointer transition-all flex items-center gap-3 ${pubMode === 'exact' ? 'bg-[var(--accent-500)]/10 border-[var(--accent-500)]/30' : 'bg-white/[0.02] border-white/[0.05]'}`}>
                  <input type="radio" name="pubMode" value="exact" checked={pubMode === 'exact'} onChange={() => setPubMode('exact')} className="hidden" />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${pubMode === 'exact' ? 'border-[var(--accent-400)]' : 'border-white/30'}`}>
                    {pubMode === 'exact' && <div className="w-2 h-2 bg-[var(--accent-400)] rounded-full"></div>}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[13px] font-bold ${pubMode === 'exact' ? 'text-[var(--accent-400)]' : 'text-white/70'}`}>Exact Time</span>
                    <span className="text-[11px] text-white/40">Strict scheduling</span>
                  </div>
                </label>
              </div>
            </div>

            {pubMode === 'humanized' && (
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-medium text-white/70">Humanize Variance</span>
                  <span className="text-[13px] font-mono text-[var(--accent-400)] font-bold">±{variance} Minutes</span>
                </div>
                <input 
                  type="range" min="5" max="60" step="5" value={variance} onChange={(e) => setVariance(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            )}

            <div className="w-full h-[1px] bg-white/[0.04]"></div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-[14px] font-bold text-white tracking-wide">Publishing Days</span>
                <span className="text-[11px] text-white/40">Select days to allow publishing</span>
              </div>
              <div className="flex gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                  const isSelected = pubDays.includes(day)
                  return (
                    <button 
                      key={day}
                      onClick={() => {
                        if (isSelected) setPubDays(pubDays.filter(d => d !== day))
                        else setPubDays([...pubDays, day])
                      }}
                      className={`flex-1 h-9 rounded-[8px] text-[12px] font-bold transition-all border ${isSelected ? 'bg-[var(--accent-500)]/20 border-[var(--accent-500)]/40 text-[var(--accent-400)]' : 'bg-white/[0.02] border-white/[0.05] text-white/40 hover:bg-white/[0.05]'}`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>

          </div>

          <div className="col-span-1 p-5 rounded-[14px] bg-[#0a0f18]/80 backdrop-blur-xl border border-white/[0.04] flex flex-col relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-500)]/10 blur-[40px] rounded-full pointer-events-none"></div>
            
            <div className="flex items-center gap-2.5 mb-5 relative z-10">
              <CalendarDays size={16} className="text-[var(--accent-400)]" />
              <h3 className="text-[14px] font-bold text-white tracking-wide">Live Preview</h3>
            </div>

            <div className="flex flex-col gap-3 flex-1 relative z-10">
              {previewSchedule.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 px-3 rounded-[8px] bg-white/[0.02] border border-white/[0.02]">
                  <span className="text-[13px] text-white/60 font-medium">{item.label}</span>
                  <span className="text-[14px] font-mono font-bold text-[var(--accent-400)]">{item.time}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 rounded-[8px] bg-[var(--accent-500)]/10 border border-[var(--accent-500)]/20 flex gap-2.5 relative z-10">
              <div className="mt-0.5"><Zap size={12} className="text-[var(--accent-400)]" /></div>
              <p className="text-[11px] text-cyan-100/70 leading-snug">
                {scheduleProfile.schedule_mode === 'youtube' ? 'Video will be uploaded immediately and scheduled on YouTube.' : 'Video will wait in the Local Queue until this exact time.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
