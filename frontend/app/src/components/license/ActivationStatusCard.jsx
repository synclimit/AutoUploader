import React from 'react'
import { ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react'

export default function ActivationStatusCard({ statusData }) {
  const isValid = statusData?.valid
  const statusMessage = statusData?.status || 'Checking...'
  const errorMsg = statusData?.error

  let Icon = ShieldAlert
  let colorClass = 'text-yellow-400'
  let bgClass = 'bg-yellow-400/10 border-yellow-400/20'

  if (isValid) {
    Icon = ShieldCheck
    colorClass = 'text-green-400'
    bgClass = 'bg-green-400/10 border-green-400/20'
  } else if (statusMessage.includes('Corrupted') || statusMessage.includes('Invalid')) {
    Icon = ShieldX
    colorClass = 'text-red-400'
    bgClass = 'bg-red-400/10 border-red-400/20'
  }

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-4 transition-all ${bgClass}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bgClass.split(' ')[0]} ${colorClass}`}>
        <Icon size={20} />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className={`text-[14px] font-bold ${colorClass}`}>
          {isValid ? 'Activated' : statusMessage}
        </h3>
        <p className="text-[12px] text-white/60">
          {isValid 
            ? 'Lifetime license verified. All features are unlocked.' 
            : errorMsg || 'Please import a valid license to use Raynz PitStop.'}
        </p>
      </div>
    </div>
  )
}
