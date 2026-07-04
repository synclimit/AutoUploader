import { useEffect, useState } from 'react'
import ChannelListPanel from './ChannelListPanel'
import ChannelDetailWorkspace from './ChannelDetailWorkspace'
import AddChannelWizard from '../wizard/AddChannelWizard'
import { useAccountsStore } from '../../../store/accounts/accountsStore'

export default function ChannelsWorkspace() {
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const { 
    accounts, 
    fetchAccounts, 
    selectedAccount, 
    fetchAccount,
    setSelectedAccount,
    isLoading
  } = useAccountsStore()

  useEffect(() => {
    fetchAccounts()
    const { startHealthPolling, stopHealthPolling } = useAccountsStore.getState()
    startHealthPolling()
    
    // Auto refresh when returning to the app from browser
    const handleFocus = () => {
      fetchAccounts()
      const { fetchAllWatchFolderHealth } = useAccountsStore.getState()
      fetchAllWatchFolderHealth()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
      stopHealthPolling()
    }
  }, [])

  const handleSelect = (id) => {
    fetchAccount(id)
  }

  // To match the UI props, we map accounts
  const mappedChannels = accounts.map(acc => ({
    id: acc.id,
    name: acc.channel_name,
    avatar: acc.avatar_url || null,
    initials: acc.channel_name.substring(0, 2).toUpperCase(),
    color: 'bg-indigo-600',
    status: acc.authentication_status,
    watchFolder: '',
    uploadPreset: acc.source_type,
    subscribers: acc.subscribers,
  }))

  const selectedChannel = selectedAccount ? {
    id: selectedAccount.id,
    name: selectedAccount.channel_name,
    avatar: selectedAccount.avatar_url || null,
    initials: selectedAccount.channel_name.substring(0, 2).toUpperCase(),
    status: selectedAccount.authentication_status,
    watchFolder: selectedAccount.watch_folder || 'Not Configured',
    uploadPreset: selectedAccount.source_type,
    ...selectedAccount
  } : null

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-row relative bg-[#05080e]">
      
      {/* 28% Left Panel Navigation */}
      <ChannelListPanel 
        channels={mappedChannels}
        selectedChannelId={selectedAccount?.id}
        onSelect={handleSelect}
        onAddChannel={() => setIsWizardOpen(true)}
      />

      {/* 72% Right Detail Workspace */}
      <ChannelDetailWorkspace 
        channel={selectedChannel}
      />

      {/* Add Channel Wizard Overlay */}
      {isWizardOpen && (
        <AddChannelWizard onClose={() => setIsWizardOpen(false)} />
      )}

    </div>
  )
}
