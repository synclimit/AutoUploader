import React from 'react'
import { useSplashStore } from '../../store/splashStore'
import { RefreshCw } from 'lucide-react'

export default function LoadingStatus() {
  const status = useSplashStore((s) => s.status)
  const error = useSplashStore((s) => s.error)

  return (
    <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center justify-center gap-1 z-20">
      
      {error ? (
        <div className="flex flex-col items-center gap-4">
          <div className="text-[13px] font-bold text-red-400">
            {error}
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 text-[11px] font-medium flex items-center gap-2 transition-colors"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      ) : (
        <div className="text-[11px] font-medium text-white/50 animate-pulse tracking-wide">
          {status}
        </div>
      )}

      {/* Footer Info */}
      <div className="absolute bottom-[-16px] left-8 text-[10px] text-white/20 font-medium tracking-widest uppercase">
        © Ryanz Pitstop
      </div>
      <div className="absolute bottom-[-16px] right-8 text-[10px] text-white/20 font-medium tracking-widest uppercase">
        Version 1.0.0
      </div>
      
    </div>
  )
}
