import React, { useState } from 'react'
import { FileUp, X, Upload } from 'lucide-react'
import { showToast } from '../common/NotificationToast'

export default function LicenseImportDialog({ isOpen, onClose, onImportSuccess }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  if (!isOpen) return null

  const handleFile = async (file) => {
    if (!file) return
    if (!file.name.endsWith('.lic')) {
      showToast('Invalid file format. Please upload a .lic file.', 'error')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      // Dynamic import to avoid circular dependencies if any
      const apiClient = (await import('../../api/client')).default
      
      const res = await apiClient.post('/license/import', formData)

      // The API client interceptor returns response.data.data on success, which is the status object
      if (res.valid || res.success || res.data?.success) {
        showToast('License activated successfully.', 'success')
        onImportSuccess()
      } else {
        showToast(res.message || res.data?.message || res.status || 'Invalid License.', 'error')
      }
    } catch (err) {
      console.error(err)
      showToast('Error importing license file', 'error')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-[#0c1322] border border-white/[0.08] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
          <h2 className="text-[14px] font-bold text-white">Import License</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-4">
          <p className="text-[12px] text-white/60 text-center">
            Please select or drag and drop your <strong className="text-[var(--accent-400)]">license.lic</strong> file provided by the developer.
          </p>
          
          <label 
            className={`w-full h-[140px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
              isDragging ? 'border-[var(--accent-500)] bg-[var(--accent-500)]/10' : 'border-white/[0.1] bg-white/[0.02] hover:border-[var(--accent-500)]/50 hover:bg-white/[0.05]'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFile(e.dataTransfer.files[0])
              }
            }}
          >
            <input 
              type="file" 
              accept=".lic" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0])
                }
              }}
            />
            {isUploading ? (
              <div className="w-6 h-6 border-2 border-[var(--accent-400)] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <FileUp size={24} className={isDragging ? 'text-[var(--accent-400)]' : 'text-white/30'} />
                <span className="text-[12px] font-medium text-white/50">Click or drag file here</span>
              </>
            )}
          </label>
        </div>
      </div>
    </div>
  )
}
