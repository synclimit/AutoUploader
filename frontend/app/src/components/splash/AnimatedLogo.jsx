import React from 'react'
import { Rocket } from 'lucide-react'

export default function AnimatedLogo() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Inline styles for custom animations to avoid touching global css */}
      <style>{`
        @keyframes speedZoom {
          0% { transform: scale(0.8) translateY(10px); opacity: 0; filter: blur(5px); }
          50% { transform: scale(1.05) translateY(-2px); opacity: 1; filter: blur(0px); }
          100% { transform: scale(1.0) translateY(0); opacity: 1; filter: blur(0px); }
        }
        @keyframes enginePulse {
          0% { transform: scale(1.0); filter: drop-shadow(0 0 10px rgba(34,211,238,0.2)); }
          50% { transform: scale(1.03); filter: drop-shadow(0 0 25px rgba(34,211,238,0.6)); }
          100% { transform: scale(1.0); filter: drop-shadow(0 0 10px rgba(34,211,238,0.2)); }
        }
        @keyframes sweepLine {
          0% { transform: translateX(-150%) skewX(-45deg); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translateX(150%) skewX(-45deg); opacity: 0; }
        }
        .animate-speed-zoom {
          animation: speedZoom 800ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .animate-engine-pulse {
          animation: enginePulse 2s ease-in-out infinite alternate;
          animation-delay: 800ms; /* starts after speedZoom finishes */
        }
        .sweep-container {
          position: relative;
          overflow: hidden;
          border-radius: 20px;
        }
        .sweep-container::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 50%;
          height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent);
          transform: translateX(-150%) skewX(-45deg);
          animation: sweepLine 3s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
      
      {/* Background Ambient Glow */}
      <div className="absolute w-[140px] h-[140px] bg-[var(--accent-500)] rounded-full blur-[50px] opacity-30 animate-engine-pulse pointer-events-none"></div>
      
      {/* Logo Container */}
      <div className="relative z-10 w-32 h-32 flex items-center justify-center animate-speed-zoom sweep-container">
        <img 
          src="/favicon.png" 
          alt="Ryanz Pitstop Logo" 
          className="w-full h-full object-contain drop-shadow-[0_4px_15px_rgba(0,0,0,0.5)] animate-engine-pulse"
        />
      </div>
    </div>
  )
}
