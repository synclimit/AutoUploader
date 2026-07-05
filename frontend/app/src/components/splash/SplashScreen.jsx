import React from 'react'
import AnimatedLogo from './AnimatedLogo'
import LoadingStatus from './LoadingStatus'
import ProgressBar from './ProgressBar'
import BackgroundParticles from './BackgroundParticles'

export default function SplashScreen() {
  return (
    <div className="w-full h-full bg-gradient-to-b from-[#05080E] via-[#08111D] to-[#0B1626] flex flex-col items-center justify-center relative overflow-hidden">
      
      <BackgroundParticles />
      
      <div className="flex flex-col items-center gap-6 z-10 -mt-10">
        <AnimatedLogo />
        
        <div className="flex flex-col items-center gap-1 mt-2">
          <h1 className="text-[28px] font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight leading-none mb-1">
            Ryanz Pitstop
          </h1>
          <p className="text-[11px] text-[#8C9BB4] font-medium tracking-widest uppercase">
            Professional Edition
          </p>
        </div>
      </div>

      <LoadingStatus />
      
      <ProgressBar />
      
    </div>
  )
}
