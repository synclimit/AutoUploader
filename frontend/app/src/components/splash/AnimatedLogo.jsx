import React from 'react'
import { Rocket } from 'lucide-react'

export default function AnimatedLogo() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Inline styles for custom animations to avoid touching global css */}
      <style>{`
        @keyframes logoPop {
          0% { transform: scale(0.9); }
          40% { transform: scale(1.0); }
          70% { transform: scale(1.03); }
          100% { transform: scale(1.0); }
        }
        @keyframes glowPulse {
          0% { opacity: 0; }
          40% { opacity: 0.35; }
          70% { opacity: 0.20; }
          100% { opacity: 0.35; }
        }
        .animate-logo-pop {
          animation: logoPop 700ms ease-in-out forwards;
        }
        .animate-glow-pulse {
          animation: glowPulse 3s ease-in-out infinite alternate;
        }
      `}</style>
      
      {/* Glow Behind Logo */}
      <div className="absolute w-[120px] h-[120px] bg-[var(--accent-500)] rounded-full blur-[40px] animate-glow-pulse pointer-events-none"></div>
      
      {/* Logo Container */}
      <div className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.2)] animate-logo-pop">
        <Rocket size={40} className="text-white" />
      </div>
    </div>
  )
}
