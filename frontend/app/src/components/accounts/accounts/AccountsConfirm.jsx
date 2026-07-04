import { useEffect, useState } from 'react'
import { useAccountsStore } from '../../../store/accounts/accountsStore'
import { useAppStore } from '../../../store/app/appStore'
import apiClient from '../../../api/client'
import { showToast } from '../../common/NotificationToast'

export default function AccountsConfirm() {
  const [status, setStatus] = useState('Confirming your YouTube Channel...')
  const setActiveModule = useAppStore(s => s.setActiveModule)
  const fetchAccounts = useAccountsStore(s => s.fetchAccounts)
  const fetchAccount = useAccountsStore(s => s.fetchAccount)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const accountId = params.get('accountId')
    const channelId = params.get('channelId')
    const channelName = params.get('channelName')
    const avatarUrl = params.get('avatarUrl')

    if (!accountId || !channelId) {
      setStatus('Invalid confirmation link.')
      return
    }

    const confirmChannel = async () => {
      try {
        await apiClient.post(`/accounts/${accountId}/confirm-channel`, {
          channel_id: channelId,
          channel_name: channelName,
          avatar_url: avatarUrl || null
        })
        
        showToast('YouTube Channel Connected!', 'success')
        setStatus('Successfully connected! Redirecting to Accounts...')
        
        await fetchAccounts()
        await fetchAccount(accountId)
        
        setTimeout(() => {
          try {
            window.close()
          } catch (e) {}
          setStatus('Authentication successful! You can safely close this browser tab and return to AutoUploader.')
        }, 1500)
      } catch (err) {
        setStatus(`Failed to confirm channel: ${err.message}`)
      }
    }

    confirmChannel()
  }, [setActiveModule, fetchAccounts, fetchAccount])

  return (
    <div className="h-screen w-screen bg-[var(--bg-primary)] flex items-center justify-center text-white">
      <div className="bg-[#141821] border border-[var(--accent-500)]/20 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--accent-500)]/10 border border-[var(--accent-500)]/20 flex items-center justify-center text-[var(--accent-400)] text-3xl mx-auto mb-4">
          <svg className="w-8 h-8 animate-spin text-cyan-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">OAuth Authorization</h2>
        <p className="text-white/60 text-sm">{status}</p>
        
        {status.includes('Failed') && (
          <button 
            onClick={() => {
              if (window.opener) {
                window.close()
              } else {
                window.history.replaceState({}, '', '/')
                setActiveModule('Channels')
              }
            }}
            className="mt-6 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/70 transition-colors"
          >
            {window.opener ? 'Close Window' : 'Return to Accounts'}
          </button>
        )}
      </div>
    </div>
  )
}
