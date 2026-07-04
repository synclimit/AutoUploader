import { Lock } from 'lucide-react'

export default function FutureReadyTab() {
  const modules = [
    { title: 'Brand Assets', desc: 'Watermarks, channel banners, and intro/outro video defaults.' },
    { title: 'Monetization Defaults', desc: 'Ad placement rules, mid-roll strategies, and sponsorship links.' },
    { title: 'Community & Engagement', desc: 'Auto-reply rules, pinned comment templates, and moderation filters.' },
    { title: 'Livestream Configurations', desc: 'OBS ingest settings, stream keys, and DVR rules.' },
    { title: 'Performance Analytics', desc: 'Realtime CTR tracking and A/B test definitions.' },
    { title: 'Performance Defaults', desc: 'Rendering optimization, bitrate rules, and encoding presets.' }
  ]

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-2 mb-2">
        <h2 className="text-[16px] font-bold text-white">Future Modules</h2>
        <p className="text-[13px] text-white/50 leading-relaxed max-w-2xl">
          These configuration modules are reserved for upcoming updates. They will unlock automatically when the respective backend engines are deployed in future sprints.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {modules.map((m, i) => (
          <div key={i} className="flex flex-col gap-3 p-6 rounded-[16px] bg-[#0a0f18]/40 border border-white/[0.02] relative overflow-hidden opacity-50 grayscale select-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-2 z-10">
              <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/5">
                <Lock size={16} className="text-white/40" />
              </div>
              <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest bg-black/40 backdrop-blur-md px-3 py-1 rounded-[6px]">Coming Soon</span>
            </div>
            
            <h3 className="text-[14px] font-bold text-white/50">{m.title}</h3>
            <p className="text-[12px] text-white/30 leading-relaxed">{m.desc}</p>
            
            <div className="mt-4 flex flex-col gap-3">
              <div className="w-full h-[40px] rounded-[10px] bg-white/[0.01] border border-white/[0.02]"></div>
              <div className="w-2/3 h-[40px] rounded-[10px] bg-white/[0.01] border border-white/[0.02]"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
