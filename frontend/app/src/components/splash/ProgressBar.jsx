import React from 'react'
import { useSplashStore } from '../../store/splashStore'

export default function ProgressBar() {
  const progress = useSplashStore((s) => s.progress)

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-white/[0.05] overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-r-full"
        style={{
          width: `${progress}%`,
          transition: 'width 200ms ease-out'
        }}
      />
    </div>
  )
}
