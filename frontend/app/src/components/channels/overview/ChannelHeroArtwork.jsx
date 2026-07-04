import { CloudUpload, PlaySquare, Laptop, Folder, Network } from 'lucide-react'

export default function ChannelHeroArtwork() {
  return (
    <div 
      className="absolute top-0 right-0 w-[55%] h-[400px] pointer-events-none z-0 mix-blend-screen overflow-hidden"
      style={{
        maskImage: 'radial-gradient(ellipse 80% 80% at 55% 45%, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 55% 45%, black 40%, transparent 100%)'
      }}
    >
      {/* Ambient background light */}
      <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-[var(--accent-500)]/10 blur-[100px] rounded-full"></div>
      <div className="absolute top-[10%] right-[30%] w-[300px] h-[300px] bg-blue-600/10 blur-[80px] rounded-full"></div>

      <svg className="w-full h-full scale-110" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow_intense" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow_soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="15" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="lineGradMain" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* --- DECORATIVE BACKGROUND GRID --- */}
        <g opacity="0.1">
          <path d="M0,50 L800,50 M0,100 L800,100 M0,150 L800,150 M0,200 L800,200 M0,250 L800,250 M0,300 L800,300 M0,350 L800,350 M0,400 L800,400 M0,450 L800,450 M0,500 L800,500 M0,550 L800,550" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="2 4" />
          <path d="M50,0 L50,600 M100,0 L100,600 M150,0 L150,600 M200,0 L200,600 M250,0 L250,600 M300,0 L300,600 M350,0 L350,600 M400,0 L400,600 M450,0 L450,600 M500,0 L500,600 M550,0 L550,600 M600,0 L600,600 M650,0 L650,600 M700,0 L700,600 M750,0 L750,600" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="2 4" />
        </g>

        {/* --- MAIN FLOW LINES (NETWORK & DATA STREAMS) --- */}
        <g opacity="0.4" filter="url(#glow_soft)">
          <path d="M150,450 C250,450 350,250 500,250 C600,250 700,150 800,150" stroke="url(#lineGradMain)" strokeWidth="6" strokeLinecap="round" />
          <path d="M250,550 C350,550 400,300 550,300 C650,300 700,180 800,180" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
          <path d="M50,350 C200,350 300,150 450,150 C550,150 600,100 800,100" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        </g>

        {/* Inner solid cores for flow lines */}
        <g opacity="0.8">
          <path d="M150,450 C250,450 350,250 500,250 C600,250 700,150 800,150" stroke="#fff" strokeWidth="1" strokeLinecap="round" />
          <path d="M250,550 C350,550 400,300 550,300 C650,300 700,180 800,180" stroke="#e0f2fe" strokeWidth="0.5" strokeLinecap="round" />
        </g>

        {/* --- ORBITAL DATA RINGS --- */}
        <g transform="translate(500, 250)">
          <ellipse cx="0" cy="0" rx="140" ry="60" fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.3" transform="rotate(-15)" strokeDasharray="4 8" />
          <ellipse cx="0" cy="0" rx="200" ry="80" fill="none" stroke="#60a5fa" strokeWidth="0.5" opacity="0.2" transform="rotate(-25)" />
          {/* Particles on rings */}
          <circle cx="120" cy="-30" r="3" fill="#fff" filter="url(#glow_intense)" opacity="0.8" />
          <circle cx="-100" cy="40" r="2" fill="#22d3ee" filter="url(#glow_intense)" opacity="0.9" />
          <circle cx="-160" cy="-60" r="1.5" fill="#60a5fa" opacity="0.6" />
          <circle cx="180" cy="70" r="2.5" fill="#2dd4bf" opacity="0.7" filter="url(#glow_intense)" />
        </g>

        {/* --- NODE: LAPTOP / WORKSTATION --- */}
        <g transform="translate(180, 420)">
          {/* Base Glow */}
          <circle cx="20" cy="20" r="40" fill="#3b82f6" opacity="0.1" filter="url(#glow_soft)" />
          <rect x="0" y="0" width="40" height="30" rx="4" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.5" opacity="0.9" />
          {/* Screen content */}
          <rect x="4" y="4" width="32" height="22" rx="2" fill="#1e293b" />
          <path d="M6,8 L30,8 M6,12 L20,12 M6,16 L25,16" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          {/* Laptop Base */}
          <path d="M-5,32 L45,32 L50,36 L-10,36 Z" fill="#60a5fa" opacity="0.7" />
          {/* Connection outgoing */}
          <circle cx="20" cy="20" r="4" fill="#fff" filter="url(#glow_intense)" opacity="0.8" />
          <text x="-25" y="-15" fill="#60a5fa" fontSize="12" fontFamily="monospace" opacity="0.8">LOCAL_NODE</text>
        </g>

        {/* --- NODE: MEDIA FILES (FLOATING PANELS) --- */}
        <g transform="translate(340, 310)">
          <circle cx="25" cy="25" r="45" fill="#8b5cf6" opacity="0.1" filter="url(#glow_soft)" />
          {/* Back file */}
          <rect x="10" y="0" width="30" height="40" rx="3" fill="#0f172a" stroke="#a78bfa" strokeWidth="1" opacity="0.6" transform="rotate(15 25 20)" />
          {/* Front file */}
          <rect x="0" y="10" width="30" height="40" rx="3" fill="#0f172a" stroke="#c4b5fd" strokeWidth="1.5" opacity="0.9" />
          <path d="M10,25 L20,15 L30,25 Z" fill="none" stroke="#c4b5fd" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="10" cy="18" r="2" fill="#c4b5fd" />
          {/* Data dot */}
          <circle cx="15" cy="30" r="3" fill="#fff" filter="url(#glow_intense)" opacity="0.9" />
        </g>

        {/* --- NODE: CLOUD UPLOAD HUB --- */}
        <g transform="translate(450, 200)">
          <circle cx="50" cy="50" r="80" fill="#22d3ee" opacity="0.08" filter="url(#glow_soft)" />
          <circle cx="50" cy="50" r="50" fill="none" stroke="#22d3ee" strokeWidth="1" strokeDasharray="2 6" className="animate-spin-slow" style={{ transformOrigin: '50px 50px' }} />
          
          {/* Cloud Base */}
          <path d="M30,60 C20,60 15,50 20,40 C20,30 30,20 45,25 C50,15 65,15 75,25 C85,25 90,40 85,50 C90,55 85,60 75,60 Z" fill="#0f172a" stroke="#22d3ee" strokeWidth="2" opacity="0.9" />
          
          {/* Upload Arrow */}
          <path d="M50,55 L50,30 M40,40 L50,30 L60,40" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow_intense)" />
          
          {/* Inner details */}
          <circle cx="50" cy="50" r="100" fill="none" stroke="#22d3ee" strokeWidth="0.5" opacity="0.2" />
          <text x="50" y="-10" fill="#22d3ee" fontSize="13" fontFamily="monospace" opacity="0.9" textAnchor="middle" letterSpacing="2">CLOUD_ENGINE</text>
        </g>

        {/* --- NODE: YOUTUBE SERVER --- */}
        <g transform="translate(680, 100)">
          <circle cx="30" cy="20" r="60" fill="#ef4444" opacity="0.1" filter="url(#glow_soft)" />
          {/* Youtube Button Shape */}
          <rect x="0" y="0" width="60" height="40" rx="10" fill="#0f172a" stroke="#f87171" strokeWidth="2" opacity="0.9" />
          <path d="M25,12 L25,28 L38,20 Z" fill="#fff" filter="url(#glow_intense)" />
          
          {/* Data transmission beams */}
          <path d="M0,20 L-50,20 M-10,10 L-40,10 M-10,30 L-40,30" stroke="#f87171" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
          
          <text x="30" y="-15" fill="#fca5a5" fontSize="12" fontFamily="monospace" opacity="0.8" textAnchor="middle">YT_API</text>
        </g>

        {/* --- FLOATING GEOMETRIC PARTICLES & STREAKS --- */}
        <g>
          {/* Data Streaks */}
          <path d="M200,500 L250,500" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" opacity="0.8" filter="url(#glow_intense)" />
          <path d="M300,350 L380,350" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" opacity="0.6" filter="url(#glow_intense)" />
          <path d="M550,150 L600,150" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" opacity="0.9" filter="url(#glow_intense)" />
          
          {/* Plus signs / Crosses */}
          <path d="M100,200 L110,200 M105,195 L105,205" stroke="#22d3ee" strokeWidth="1.5" opacity="0.5" />
          <path d="M400,100 L408,100 M404,96 L404,104" stroke="#60a5fa" strokeWidth="1" opacity="0.4" />
          <path d="M700,350 L712,350 M706,344 L706,356" stroke="#f87171" strokeWidth="1.5" opacity="0.3" />

          {/* Glowing Dots */}
          <circle cx="350" cy="450" r="3" fill="#22d3ee" filter="url(#glow_intense)" />
          <circle cx="450" cy="350" r="2" fill="#fff" opacity="0.8" filter="url(#glow_soft)" />
          <circle cx="650" cy="220" r="4" fill="#60a5fa" opacity="0.6" filter="url(#glow_intense)" />
          <circle cx="550" cy="80" r="2" fill="#2dd4bf" opacity="0.8" filter="url(#glow_soft)" />
          
          {/* Square Nodes */}
          <rect x="280" y="480" width="6" height="6" fill="none" stroke="#22d3ee" strokeWidth="1.5" transform="rotate(45 283 483)" opacity="0.6" />
          <rect x="580" y="280" width="8" height="8" fill="none" stroke="#60a5fa" strokeWidth="1" transform="rotate(15 584 284)" opacity="0.4" />
        </g>
      </svg>
    </div>
  )
}
