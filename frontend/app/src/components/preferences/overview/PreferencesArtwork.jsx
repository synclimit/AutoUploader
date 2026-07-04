import { Settings2, Database, Network, SlidersHorizontal, Share2, Cloud, Sparkles } from 'lucide-react'

export default function PreferencesArtwork({ config }) {
  const concurrent = config?.upload_concurrent || 3;
  const retry = config?.upload_retry || 0;
  
  // Calculate dynamic glow and particle count
  const particleCount = Math.max(1, concurrent * 2);
  const glowOpacity = 0.4 + (retry * 0.05);

  return (
    <div 
      className="absolute top-0 right-0 w-[65%] h-[550px] pointer-events-none z-0 mix-blend-screen overflow-hidden opacity-[0.2]"
      style={{
        maskImage: 'radial-gradient(ellipse 80% 80% at 75% 35%, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 75% 35%, black 40%, transparent 100%)'
      }}
    >
      {/* Ambient background light */}
      <div className="absolute top-[5%] right-[5%] w-[450px] h-[450px] bg-[var(--accent-400)]/20 blur-[120px] rounded-full" style={{ opacity: glowOpacity }}></div>
      <div className="absolute top-[25%] right-[25%] w-[350px] h-[350px] bg-blue-500/15 blur-[100px] rounded-full"></div>

      <svg className="w-full h-full scale-105" viewBox="0 0 900 700" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow_intense" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow_soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="15" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* --- DECORATIVE BACKGROUND GRID --- */}
        <g opacity="0.15">
          <path d="M0,50 L900,50 M0,100 L900,100 M0,150 L900,150 M0,200 L900,200 M0,250 L900,250 M0,300 L900,300 M0,350 L900,350 M0,400 L900,400 M0,450 L900,450 M0,500 L900,500 M0,550 L900,550 M0,600 L900,600 M0,650 L900,650" stroke="var(--accent-400)" strokeWidth="0.5" strokeDasharray="2 6" />
          <path d="M50,0 L50,700 M100,0 L100,700 M150,0 L150,700 M200,0 L200,700 M250,0 L250,700 M300,0 L300,700 M350,0 L350,700 M400,0 L400,700 M450,0 L450,700 M500,0 L500,700 M550,0 L550,700 M600,0 L600,700 M650,0 L650,700 M700,0 L700,700 M750,0 L750,700 M800,0 L800,700 M850,0 L850,700" stroke="var(--accent-400)" strokeWidth="0.5" strokeDasharray="2 6" />
        </g>

        {/* --- MAIN CONNECTING LINES --- */}
        <g opacity={glowOpacity} filter="url(#glow_soft)">
          <path d="M700,200 C600,200 550,300 450,300 C350,300 300,400 150,400" stroke="var(--accent-400)" strokeWidth="3" strokeLinecap="round" />
          <path d="M800,350 C700,350 650,250 550,250 C450,250 400,400 250,400" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
          <path d="M750,450 C650,450 550,300 450,300" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 6" />
          <path d="M850,150 C750,150 700,250 600,250" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* --- CENTRAL CONFIG NODE (SLIDERS) --- */}
        <g transform="translate(650, 180)">
          <circle cx="30" cy="30" r="90" fill="var(--accent-400)" opacity="0.08" filter="url(#glow_soft)" />
          <rect x="0" y="0" width="60" height="60" rx="14" fill="var(--bg-primary)" stroke="var(--accent-400)" strokeWidth="2" opacity="0.9" />
          <line x1="10" y1="15" x2="50" y2="15" stroke="var(--accent-400)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          <circle cx="20" cy="15" r="4" fill="var(--accent-400)" filter="url(#glow_intense)" />
          <line x1="10" y1="30" x2="50" y2="30" stroke="var(--accent-400)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          <circle cx="40" cy="30" r="4" fill="var(--accent-400)" filter="url(#glow_intense)" />
          <line x1="10" y1="45" x2="50" y2="45" stroke="var(--accent-400)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          <circle cx="25" cy="45" r="4" fill="var(--accent-400)" filter="url(#glow_intense)" />
        </g>

        {/* --- SECONDARY NODE (CLOUD SYNC) --- */}
        <g transform="translate(450, 300)">
          <circle cx="25" cy="25" r="70" fill="#60a5fa" opacity="0.06" filter="url(#glow_soft)" />
          <rect x="0" y="0" width="50" height="50" rx="12" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.5" opacity="0.9" />
          <path d="M15,30 Q20,20 30,25 Q40,20 40,30 Q45,35 35,40 L20,40 Q10,35 15,30 Z" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="50" cy="25" r="3" fill="#fff" filter="url(#glow_intense)" />
        </g>

        {/* --- TERTIARY NODE (AI/SPARKLES) --- */}
        <g transform="translate(550, 250)">
          <circle cx="15" cy="15" r="50" fill="#a78bfa" opacity="0.06" filter="url(#glow_soft)" />
          <rect x="0" y="0" width="30" height="30" rx="8" fill="#0f172a" stroke="#a78bfa" strokeWidth="1.5" opacity="0.9" />
          <path d="M15,8 L17,13 L22,15 L17,17 L15,22 L13,17 L8,15 L13,13 Z" fill="#a78bfa" filter="url(#glow_intense)" />
        </g>

        {/* --- QUATERNARY NODE (DATABASE) --- */}
        <g transform="translate(250, 400)">
          <circle cx="20" cy="20" r="50" fill="#2dd4bf" opacity="0.05" filter="url(#glow_soft)" />
          <rect x="0" y="0" width="40" height="40" rx="10" fill="#0f172a" stroke="#2dd4bf" strokeWidth="1.5" opacity="0.9" />
          <ellipse cx="20" cy="15" rx="10" ry="4" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
          <path d="M10,15 L10,25 A10,4 0 0,0 30,25 L30,15" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
          <circle cx="20" cy="20" r="4" fill="#2dd4bf" filter="url(#glow_intense)" opacity="0.8" />
        </g>

        {/* --- DYNAMIC FLOATING PARTICLES --- */}
        <g>
          {/* Main Accent Particles controlled by Concurrent Uploads */}
          {Array.from({ length: particleCount }).map((_, i) => {
            // Generate deterministic but scattered positions based on index
            const cx = 300 + ((i * 137) % 500);
            const cy = 100 + ((i * 93) % 400);
            const r = 2 + (i % 3);
            const delay = (i % 5) * 0.2;
            return (
              <circle 
                key={`p-${i}`}
                cx={cx} 
                cy={cy} 
                r={r} 
                fill="var(--accent-400)" 
                filter="url(#glow_intense)" 
                className="animate-pulse"
                style={{ animationDelay: `${delay}s`, animationDuration: `${2 + (i%2)}s` }}
              />
            )
          })}
          
          <circle cx="350" cy="350" r="2" fill="#60a5fa" filter="url(#glow_intense)" />
          <circle cx="750" cy="350" r="4" fill="#2dd4bf" opacity="0.6" filter="url(#glow_intense)" />
          <circle cx="600" cy="400" r="2" fill="#a78bfa" opacity="0.8" filter="url(#glow_intense)" />
          <path d="M550,180 L560,180 M555,175 L555,185" stroke="var(--accent-400)" strokeWidth="1.5" opacity="0.6" />
          <path d="M300,280 L310,280 M305,275 L305,285" stroke="#60a5fa" strokeWidth="1.5" opacity="0.6" />
        </g>
      </svg>
    </div>
  )
}
