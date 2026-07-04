import React from 'react'
import { Copy, Download } from 'lucide-react'
import { showToast } from '../common/NotificationToast'

export default function HardwareActions({ hardwareId }) {

  const handleCopy = () => {
    if (hardwareId) {
      navigator.clipboard.writeText(hardwareId)
      showToast('Hardware ID copied successfully.', 'success')
    }
  }

  const handleExport = () => {
    if (!hardwareId) return
    
    const d = new Date()
    // format as YYYY-MM-DD HH:mm
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    
    const content = `====================================

AutoUploader License Request

====================================

Customer Computer

Computer Name :
${window.location.hostname || 'DESKTOP-PC'}

Hardware ID :
${hardwareId}

Application :
AutoUploader Professional

Version :
1.0

Generated :
${dateStr}

====================================

Please send this file to the developer
to receive your lifetime license.

====================================`
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hardware_request.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    showToast('Hardware request exported.', 'success')
  }

  return (
    <div className="flex flex-col gap-2 w-full mt-2">
      <button 
        onClick={handleCopy}
        disabled={!hardwareId}
        className="w-full h-[40px] rounded-lg bg-[var(--accent-500)]/10 border border-[var(--accent-500)]/20 hover:bg-[var(--accent-500)]/20 hover:border-[var(--accent-500)]/40 transition-all flex items-center justify-center gap-2 text-[12px] font-bold text-[var(--accent-400)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Copy size={16} /> Copy Hardware ID
      </button>
      <button 
        onClick={handleExport}
        disabled={!hardwareId}
        className="w-full h-[40px] rounded-lg bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] hover:border-white/[0.2] transition-all flex items-center justify-center gap-2 text-[12px] font-bold text-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download size={16} /> Export Hardware Request
      </button>
    </div>
  )
}
