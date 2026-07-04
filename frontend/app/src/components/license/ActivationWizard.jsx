import React, { useState } from 'react'
import { Key, Upload } from 'lucide-react'
import ActivationStatusCard from './ActivationStatusCard'
import HardwareCard from './HardwareCard'
import LicenseImportDialog from './LicenseImportDialog'

export default function ActivationWizard({ statusData, checkLicense }) {
  const [isImportOpen, setIsImportOpen] = useState(false)

  return (
    <div className="flex-1 w-full h-full flex items-center justify-center bg-[#05080e] relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent-500)]/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="w-full max-w-[480px] z-10 flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col items-center justify-center gap-3 text-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.3)]">
            <Key size={32} className="text-white" />
          </div>
          <h1 className="text-[24px] font-bold text-white tracking-tight">AutoUploader Activation</h1>
          <p className="text-[13px] text-white/50 px-8">
            This is a premium software. Please activate your Lifetime License to unlock all features.
          </p>
        </div>

        <ActivationStatusCard statusData={statusData} />
        
        <HardwareCard hardwareId={statusData?.hardware_id} />

        {/* Import License Section */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-full h-[1px] bg-white/[0.05] my-2"></div>
          <p className="text-[12px] font-bold text-white/60 uppercase tracking-widest">Import License</p>
          <button 
            onClick={() => setIsImportOpen(true)}
            className="w-full h-[44px] rounded-xl bg-[var(--accent-500)]/20 border border-[var(--accent-500)]/30 text-[var(--accent-400)] font-bold text-[13px] hover:bg-[var(--accent-500)]/30 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all flex items-center justify-center gap-2"
          >
            <Upload size={16} /> Choose license.lic
          </button>
        </div>

        {/* Need Help Section */}
        <div className="mt-4 p-5 rounded-xl border border-white/[0.05] bg-[#05080e]/50 flex flex-col gap-3">
          <h3 className="text-[13px] font-bold text-white/80">Need Help?</h3>
          <ol className="text-[12px] text-white/50 flex flex-col gap-2 list-decimal list-inside">
            <li>Copy Hardware ID or Export Hardware Request</li>
            <li>Send it to Developer</li>
            <li>Receive <span className="text-[var(--accent-400)]">license.lic</span></li>
            <li>Import License</li>
          </ol>
        </div>

      </div>

      <LicenseImportDialog 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onImportSuccess={() => {
          setIsImportOpen(false)
          checkLicense()
        }}
      />
    </div>
  )
}
