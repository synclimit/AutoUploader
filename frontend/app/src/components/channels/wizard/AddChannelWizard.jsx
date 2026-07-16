import { useState, useEffect, useRef } from 'react'
import { X, PlaySquare, Folder, CheckCircle2, ChevronRight, ExternalLink, Loader2, UploadCloud, FileJson } from 'lucide-react'
import apiClient from '../../../api/client'
import { useAccountsStore } from '../../../store/accounts/accountsStore'
import { showToast } from '../../common/NotificationToast'

export default function AddChannelWizard({ onClose }) {
  const [step, setStep] = useState(1)
  
  // Form State
  const [channelName, setChannelName] = useState('')
  const [accountId, setAccountId] = useState(null)
  
  // Credential State
  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const [isCreating, setIsCreating] = useState(false)
  const fetchAccounts = useAccountsStore(s => s.fetchAccounts)
  const fileInputRef = useRef(null)
  
  // Status polling for OAuth completion
  const pollInterval = useRef(null)

  useEffect(() => {
    if (step === 3 && accountId) {
      pollInterval.current = setInterval(async () => {
        try {
          const acc = await apiClient.get(`/channels/${accountId}`)
          // Our channel logic sets health_status to 'READY' if successful
          if (acc.health_status === 'READY' || acc.authentication_status === 'Connected') {
            clearInterval(pollInterval.current)
            setStep(4) // Move to finish
          }
        } catch (e) {
          console.error(e)
        }
      }, 2000)
    }
    
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current)
    }
  }, [step, accountId])

  const handleCreateAccount = async () => {
    if (!channelName.trim()) return
    setIsCreating(true)
    try {
      const acc = await apiClient.post('/channels', { channel_name: channelName })
      setAccountId(acc.id)
      setStep(2)
    } catch (e) {
      console.error("Failed to create channel:", e)
      showToast("Failed to create channel alias", "error")
    } finally {
      setIsCreating(false)
    }
  }

  const handleFileChange = (e) => {
    const files = e.target.files || (e.dataTransfer && e.dataTransfer.files)
    if (files && files.length > 0) {
      setSelectedFile(files[0])
      setUploadSuccess(false)
    }
    if (e.target) e.target.value = null // reset so same file can be selected again
  }
  
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }
  
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    handleFileChange(e)
  }

  const handleUploadCredential = async () => {
    if (!selectedFile || !accountId) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      const res = await apiClient.post(`/oauth/channels/${accountId}/credential/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      // apiClient automatically throws an error if success is false or HTTP status is not 2xx
      setUploadSuccess(true)
      showToast("Credential uploaded and validated successfully", "success")
      setStep(3)
    } catch (e) {
      console.error("Upload failed:", e)
      showToast(e.message || "Failed to upload client_secret.json", "error")
    } finally {
      setIsUploading(false)
    }
  }

  const handleConnectGoogle = async () => {
    try {
      const data = await apiClient.get(`/oauth/channels/${accountId}/url`)
      // apiClient automatically unwraps response.data.data
      if (data && data.auth_url) {
        await apiClient.post('/system/open-url', { url: data.auth_url })
      } else if (data && data.data && data.data.auth_url) {
        // Fallback just in case interceptor didn't strip it
        await apiClient.post('/system/open-url', { url: data.data.auth_url })
      } else {
        throw new Error(data?.message || "Failed to get auth URL")
      }
    } catch (e) {
      console.error("Failed to get auth URL:", e)
      showToast(e.message || "Failed to initialize Google Login. Check client_secret.json.", "error")
    }
  }

  const handleFinish = async () => {
    await fetchAccounts()
    onClose()
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#05080e]/80 backdrop-blur-sm">
      <div className="w-[520px] rounded-[24px] bg-[#0a0f1a]/95 border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col">
        
        {/* Glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] bg-[var(--accent-500)]/10 blur-[80px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="h-[64px] shrink-0 border-b border-white/[0.05] flex items-center justify-between px-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-500)]/10 flex items-center justify-center">
              <PlaySquare size={14} className="text-[var(--accent-400)]" />
            </div>
            <span className="font-bold text-white text-[15px]">Tambah Saluran Baru</span>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-transparent hover:border-white/[0.08] hover:bg-white/[0.05] flex items-center justify-center transition-colors text-white/50 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-white/5 flex">
          <div className={`h-full bg-[var(--accent-400)] transition-all duration-300 ${step === 1 ? 'w-1/4' : step === 2 ? 'w-2/4' : step === 3 ? 'w-3/4' : 'w-full'}`}></div>
        </div>

        {/* Content Area */}
        <div className="p-8 flex flex-col relative z-10 min-h-[320px]" data-cache="v3">
          
          {step === 1 && (
            <div className="flex flex-col h-full animate-fade-in">
              <h2 className="text-[20px] font-bold text-white mb-2">Name your channel</h2>
              <p className="text-[13px] text-white/50 mb-8">This is just for your reference inside Raynz PitStop.</p>
              
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-white/50 uppercase">Channel Alias</label>
                <input 
                  type="text" 
                  autoFocus
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="e.g. DJ Remix Main Channel"
                  className="w-full h-[48px] px-4 rounded-[12px] bg-[#05080e]/80 border border-white/[0.08] text-[14px] text-white outline-none focus:border-[var(--accent-500)]/50 focus:shadow-[0_0_15px_rgba(34,211,238,0.1)] transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && channelName.trim() && !isCreating) {
                      handleCreateAccount()
                    }
                  }}
                />
              </div>

              <div className="mt-auto pt-8 flex justify-end">
                <button 
                  onClick={handleCreateAccount}
                  disabled={!channelName.trim() || isCreating}
                  className="h-[44px] px-6 rounded-[12px] bg-[var(--accent-500)] hover:bg-[var(--accent-400)] text-[#05080e] font-bold text-[14px] transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? <Loader2 size={16} className="animate-spin" /> : "Continue"} <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col h-full animate-fade-in">
              <h2 className="text-[20px] font-bold text-white mb-2">Upload Client Secret</h2>
              <p className="text-[13px] text-white/50 mb-4 flex items-center gap-2">
                Provide the client_secret.json file downloaded from Google Cloud Console.
                <a 
                  href="https://console.cloud.google.com/apis/credentials" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[var(--accent-500)] hover:text-[var(--accent-400)] inline-flex items-center gap-1 font-medium bg-[var(--accent-500)]/10 px-2 py-0.5 rounded transition-colors"
                >
                  Open Console <ExternalLink size={12} />
                </a>
              </p>
              <div 
                className="flex flex-col items-center justify-center p-6 rounded-[16px] border border-white/[0.08] bg-white/[0.02] gap-4 cursor-pointer hover:border-blue-500/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-2 pointer-events-none">
                  <FileJson size={32} className="text-blue-400" />
                </div>
                
                <input 
                  type="file" 
                  accept=".json"
                  className="hidden"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
                
                <div 
                  className="h-[44px] px-6 rounded-[10px] border border-blue-500/30 bg-blue-500/10 text-blue-400 font-bold text-[14px] flex items-center gap-2 pointer-events-none"
                >
                  <UploadCloud size={16} /> Browse JSON File
                </div>
                
                {selectedFile && (
                  <div className="text-[13px] text-green-400 font-medium flex items-center gap-1">
                    <CheckCircle2 size={14} /> {selectedFile.name}
                  </div>
                )}
              </div>

              <div className="mt-auto pt-8 flex justify-end">
                <button 
                  onClick={handleUploadCredential}
                  disabled={!selectedFile || isUploading}
                  className="h-[44px] px-6 rounded-[12px] bg-[var(--accent-500)] hover:bg-[var(--accent-400)] text-[#05080e] font-bold text-[14px] transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : "Validate JSON"} <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col h-full animate-fade-in">
              <h2 className="text-[20px] font-bold text-white mb-2">Connect to YouTube</h2>
              <p className="text-[13px] text-white/50 mb-8">Securely connect your YouTube channel using Google OAuth. Raynz PitStop will use API v3 for reliable uploads.</p>
              
              <div className="flex flex-col items-center justify-center p-6 rounded-[16px] border border-white/[0.08] bg-white/[0.02] gap-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                  <PlaySquare size={32} className="text-red-500" />
                </div>
                <button 
                  onClick={handleConnectGoogle}
                  className="h-[44px] px-6 rounded-[10px] border border-red-500/30 bg-red-500/10 text-red-400 font-bold text-[14px] hover:bg-red-500/20 transition-colors flex items-center gap-2"
                >
                  Connect with Google <ExternalLink size={16} />
                </button>
                <span className="text-[12px] text-white/40 text-center px-4 mt-2">
                  A secure popup will open. Once you complete the login, this window will automatically continue.
                </span>
                
                <div className="mt-2 flex items-center gap-2 text-[var(--accent-400)]/70 text-[12px]">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Waiting for authentication...</span>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col h-full animate-fade-in">
              <h2 className="text-[20px] font-bold text-white mb-2">Setup Complete</h2>
              <p className="text-[13px] text-white/50 mb-8">Your channel has been successfully connected and is ready for manual uploads.</p>
              
              <div className="flex flex-col items-center justify-center p-6 rounded-[16px] border border-green-500/20 bg-green-500/5 gap-4">
                 <CheckCircle2 size={48} className="text-green-400" />
                 <span className="text-white font-bold">Channel is Ready</span>
              </div>

              <div className="mt-auto pt-6 flex justify-end">
                <button 
                  onClick={handleFinish}
                  className="h-[44px] px-6 rounded-[12px] bg-green-500 hover:bg-green-400 text-[#05080e] font-bold text-[14px] transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(74,222,128,0.2)]"
                >
                  Go to Dashboard <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
