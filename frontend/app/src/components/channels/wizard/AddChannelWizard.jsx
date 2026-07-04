import { useState, useEffect, useRef } from 'react'
import { X, PlaySquare, Folder, CheckCircle2, ChevronRight, ExternalLink, Loader2 } from 'lucide-react'
import apiClient from '../../../api/client'
import { useAccountsStore } from '../../../store/accounts/accountsStore'
import { showToast } from '../../common/NotificationToast'

export default function AddChannelWizard({ onClose }) {
  const [step, setStep] = useState(1)
  
  // Form State
  const [channelName, setChannelName] = useState('')
  const [accountId, setAccountId] = useState(null)
  const [watchFolder, setWatchFolder] = useState('')
  
  const [isCreating, setIsCreating] = useState(false)
  const fetchAccounts = useAccountsStore(s => s.fetchAccounts)
  
  // Status polling for OAuth completion
  const pollInterval = useRef(null)

  useEffect(() => {
    if (step === 2 && accountId) {
      pollInterval.current = setInterval(async () => {
        try {
          const acc = await apiClient.get(`/accounts/${accountId}`)
          if (acc.authentication_status === 'Pending Confirmation' || acc.authentication_status === 'Connected' || acc.authentication_status === 'AUTHENTICATED') {
            clearInterval(pollInterval.current)
            setStep(3)
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
      const acc = await apiClient.post('/accounts', { channel_name: channelName })
      setAccountId(acc.id)
      setStep(2)
    } catch (e) {
      console.error("Failed to create account:", e)
    } finally {
      setIsCreating(false)
    }
  }

  const handleConnectGoogle = async () => {
    try {
      const data = await apiClient.get(`/accounts/${accountId}/auth-url`)
      if (data.auth_url) {
        await apiClient.post('/system/open-url', { url: data.auth_url })
      }
    } catch (e) {
      console.error("Failed to get auth URL:", e)
      showToast(e.message || "Failed to initialize Google Login. Check client_secret.json.", "error")
    }
  }

  const handleBrowseFolder = async () => {
    try {
      const data = await apiClient.get('/system/browse-folder')
      if (data.path) {
        setWatchFolder(data.path)
      }
    } catch (e) {
      console.error("Failed to browse folder:", e)
    }
  }

  const handleFinish = async () => {
    if (watchFolder && accountId) {
      try {
        await apiClient.put(`/accounts/${accountId}`, { 
          watch_folder: watchFolder, 
          watch_folder_enabled: true 
        })
      } catch (e) {
        console.error("Failed to update watch folder:", e)
      }
    }
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
            <span className="font-bold text-white text-[15px]">Add New Channel</span>
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
          <div className={`h-full bg-[var(--accent-400)] transition-all duration-300 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`}></div>
        </div>

        {/* Content Area */}
        <div className="p-8 flex flex-col relative z-10 min-h-[320px]">
          
          {step === 1 && (
            <div className="flex flex-col h-full animate-fade-in">
              <h2 className="text-[20px] font-bold text-white mb-2">Name your channel</h2>
              <p className="text-[13px] text-white/50 mb-8">This is just for your reference inside AutoUploader.</p>
              
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

              <div className="mt-auto flex justify-end">
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
              <h2 className="text-[20px] font-bold text-white mb-2">Connect to YouTube</h2>
              <p className="text-[13px] text-white/50 mb-8">Securely connect your YouTube channel using Google OAuth. AutoUploader will use API v3 for reliable uploads.</p>
              
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

          {step === 3 && (
            <div className="flex flex-col h-full animate-fade-in">
              <h2 className="text-[20px] font-bold text-white mb-2">Assign Watch Folder</h2>
              <p className="text-[13px] text-white/50 mb-8">Videos dropped into this folder will automatically be queued for this channel.</p>
              
              <div className="p-4 rounded-[12px] border border-white/[0.08] bg-[#05080e]/60 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Folder size={16} className="text-[var(--accent-400)]" />
                    <span className="text-[13px] font-bold text-white">Watch Folder</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-[40px] px-3 rounded-[8px] bg-white/[0.03] border border-white/[0.05] flex items-center truncate" title={watchFolder || "Not selected..."}>
                    <span className={`text-[13px] font-mono truncate ${watchFolder ? 'text-white' : 'text-white/40'}`}>
                      {watchFolder || "Not selected..."}
                    </span>
                  </div>
                  <button 
                    onClick={handleBrowseFolder}
                    className="h-[40px] px-4 rounded-[8px] bg-[var(--accent-500)]/10 border border-[var(--accent-500)]/30 text-[var(--accent-400)] font-bold text-[12px] hover:bg-[var(--accent-500)]/20 transition-colors"
                  >
                    Browse
                  </button>
                </div>
              </div>

              <div className="mt-auto pt-6 flex justify-end">
                <button 
                  onClick={handleFinish}
                  className="h-[44px] px-6 rounded-[12px] bg-green-500 hover:bg-green-400 text-[#05080e] font-bold text-[14px] transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(74,222,128,0.2)]"
                >
                  <CheckCircle2 size={16} /> Finish Setup
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
