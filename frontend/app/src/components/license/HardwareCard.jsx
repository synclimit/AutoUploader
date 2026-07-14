import React from 'react'
import HardwareActions from './HardwareActions'

export default function HardwareCard({ hardwareId }) {

  return (
    <div className="p-5 rounded-xl border border-white/[0.05] bg-white/[0.02] flex flex-col gap-4">
      <div className="flex flex-col gap-1 text-center">
        <h3 className="text-[13px] font-bold text-white/80 uppercase tracking-widest">Hardware ID</h3>
      </div>

      {!hardwareId ? (
         <div className="flex-1 h-[48px] rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col items-center justify-center p-4 gap-1">
           <span className="text-[12px] font-bold text-red-400">Unable to generate Hardware ID.</span>
           <span className="text-[11px] text-red-400/70">Please restart Raynz PitStop.</span>
         </div>
      ) : (
         <div className="flex items-center gap-3">
           <div className="flex-1 h-[48px] rounded-xl bg-[#05080e] border border-white/[0.08] flex items-center justify-center px-4">
             <span className="text-[16px] font-mono font-bold text-[var(--accent-400)] tracking-wider">
               {hardwareId}
             </span>
           </div>
         </div>
      )}

      <HardwareActions hardwareId={hardwareId} />
    </div>
  )
}
