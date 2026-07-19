import { create } from 'zustand'
import { showToast } from '../../components/common/NotificationToast'
import apiClient from '../../api/client'

export type AccountStatus = 'ACTIVE' | 'WARNING' | 'LIMITED' | 'Disconnected' | 'Pending' | 'Connected' | 'Expired' | 'Error'

export interface ProfileTemplate {
  titleTemplates: string[]
  descriptionBlocks: string[]
  keywords: string[]
  tags: string[]
  playlist: string
  category: string
}

export interface PipelineHealth {
  status: string
  last_scan: string | null
  last_import: string | null
  imported_count: number
  error_count: number
  last_error: string | null
  last_scan_status: string
  last_scan_count: number
  watch_folder_path: string
  daily_limit: number | string
  today_intake: number
  remaining_today: number | string
  packages_found: number | string
  execution_log: any[]
}

export interface WatchFolderHealth {
  account_id: string
  channel_name: string
  pipelines: Record<string, PipelineHealth>
}

export interface AccountList {
  id: string
  channel_name: string
  youtube_name: string | null
  avatar_url?: string | null
  profile_name: string | null
  source_type: string
  region: string
  authentication_status: string
}

export interface AccountDetail {
  id: string
  channel_name: string
  youtube_name: string | null
  avatar_url?: string | null
  profile_id: string | null
  profile_name: string | null
  source_type: string
  region: string
  watch_folder: string | null
  watch_folder_enabled: boolean
  authentication_status: string
  schema_version: number
  created_at: string
}

export interface AccountsState {
  accounts: AccountList[]
  selectedAccount: AccountDetail | null
  stats: { title: string; value: string; color: string }[]
  logs: string[]
  isLoading: boolean
  error: string | null

  watchFolderHealth: Record<string, WatchFolderHealth>
  isScanning: boolean
  healthPollingInterval: any

  fetchAccounts: () => Promise<void>
  fetchAccount: (id: string) => Promise<void>
  createAccount: (data: any) => Promise<void>
  updateAccount: (id: string, updates: any) => Promise<void>
  deleteAccount: (id: string) => Promise<void>
  setSelectedAccount: (account: AccountDetail | null) => void
  bindProfile: (id: string, profileId: string) => Promise<void>
  updateWatchFolder: (id: string, path: string, enabled: boolean) => Promise<void>
  disconnectAccount: (id: string) => Promise<void>
  refreshOAuthToken: (id: string) => Promise<void>
  fetchAllWatchFolderHealth: () => Promise<void>
  scanWatchFolder: (accountId?: string, pipelineType?: string) => Promise<void>
  startHealthPolling: () => void
  stopHealthPolling: () => void
}

export const useAccountsStore = create<AccountsState>((set, get) => ({
  accounts: [],
  selectedAccount: null,
  stats: [],
  logs: [],
  isLoading: false,
  error: null,

  watchFolderHealth: {},
  isScanning: false,
  healthPollingInterval: null,

  fetchAccounts: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.get('/channels', { validateStatus: () => true });
      console.log("HTTP Status:", 200); // Or extract from a full axios wrapper if we had it
      console.log("Raw JSON:", response);
      
      if (!Array.isArray(response)) {
          console.error("Validation Error:", "Response is not an array");
          set({ error: "Invalid response format", isLoading: false })
          return;
      }
      
      console.log("Mapped JSON:", response);
      console.log("Returned Count:", response.length);
      
      set({ accounts: response, isLoading: false })
    } catch (err: any) {
      console.error("HTTP Status:", err.response?.status || 'Unknown');
      console.error("Error:", err.message);
      set({ error: err.message, isLoading: false })
    }
  },

  fetchAccount: async (id: string) => {
    const cached = get().accounts.find(a => a.id === id)
    if (cached) {
      set({ selectedAccount: cached as unknown as AccountDetail, isLoading: true, error: null })
    } else {
      set({ isLoading: true, error: null })
    }
    try {
      const data = await apiClient.get(`/channels/${id}`)
      set({ selectedAccount: data, isLoading: false })
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
    }
  },

  createAccount: async (data: any) => {
    set({ isLoading: true, error: null })
    try {
      const newAcc = await apiClient.post('/channels', data)
      showToast('Account Created', 'success')
      await get().fetchAccounts()
      await get().fetchAccount(newAcc.id)
      set({ isLoading: false })
    } catch (err: any) {
      showToast(err.message, 'error')
      set({ error: err.message, isLoading: false })
    }
  },

  updateAccount: async (id: string, updates: any) => {
    set({ isLoading: true, error: null })
    try {
      const updated = await apiClient.put(`/channels/${id}`, updates)
      showToast('Account Updated', 'success')
      await get().fetchAccounts()
      set({ selectedAccount: updated, isLoading: false })
    } catch (err: any) {
      showToast(err.message, 'error')
      set({ error: err.message, isLoading: false })
    }
  },

  deleteAccount: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      await apiClient.delete(`/channels/${id}`)
      showToast('Account Deleted', 'info')
      await get().fetchAccounts()
      const { selectedAccount } = get()
      if (selectedAccount?.id === id) {
        set({ selectedAccount: null })
      }
      set({ isLoading: false })
    } catch (err: any) {
      showToast(err.message, 'error')
      set({ error: err.message, isLoading: false })
    }
  },

  bindProfile: async (id: string, profileId: string) => {
    try {
      await get().updateAccount(id, { profile_id: profileId })
      showToast('Profile Assigned', 'success')
    } catch (err) {
      // errors handled by updateAccount
    }
  },

  updateWatchFolder: async (id: string, path: string, enabled: boolean) => {
    try {
      await get().updateAccount(id, { watch_folder: path, watch_folder_enabled: enabled })
      showToast('Watch Folder Updated', 'success')
    } catch (err) {
      // errors handled by updateAccount
    }
  },

  disconnectAccount: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const updated = await apiClient.post(`/channels/${id}/disconnect`)
      showToast('YouTube Channel Disconnected', 'info')
      await get().fetchAccounts()
      set({ selectedAccount: updated, isLoading: false })
    } catch (err: any) {
      showToast(err.message, 'error')
      set({ error: err.message, isLoading: false })
    }
  },

  refreshOAuthToken: async (id: string) => {
    try {
      await apiClient.post(`/channels/${id}/refresh`)
      showToast('OAuth Token Refreshed', 'success')
    } catch (err: any) {
      showToast(err.message || 'Failed to refresh token', 'error')
    }
  },

  setSelectedAccount: (account) => set({ selectedAccount: account }),

  fetchAllWatchFolderHealth: async () => {
    try {
      const data = await apiClient.get('/watch-folder/health')
      const healthMap: Record<string, WatchFolderHealth> = {}
      if (data.accounts) {
        for (const record of data.accounts) {
          healthMap[record.account_id] = record
        }
      }
      set({ watchFolderHealth: healthMap })
    } catch (err) {
      console.error('Failed to fetch watch folder health', err)
    }
  },

  scanWatchFolder: async (accountId?: string, pipelineType?: string) => {
    if (get().isScanning) return
    console.log('[Store] scanWatchFolder triggered')
    set({ isScanning: true })
    try {
      let url = '/watch-folder/scan'
      const query = []
      if (accountId) query.push(`account_id=${accountId}`)
      if (pipelineType) query.push(`pipeline_type=${pipelineType}`)
      if (query.length > 0) url += `?${query.join('&')}`
      
      await apiClient.post(url)
      
      // Artificial delay for UI visibility
      await new Promise(resolve => setTimeout(resolve, 800))
      
      console.log('[Store] scanWatchFolder successful, showing toast')
      showToast('Scan Complete', 'success')
      await get().fetchAllWatchFolderHealth()
    } catch (err: any) {
      console.error('[Store] scanWatchFolder error:', err)
      showToast('Scan Failed', 'error')
    } finally {
      set({ isScanning: false })
    }
  },

  startHealthPolling: () => {
    const currentInterval = get().healthPollingInterval
    if (currentInterval) return // Already polling
    
    get().fetchAllWatchFolderHealth()
    const interval = setInterval(() => {
      get().fetchAllWatchFolderHealth()
    }, 30000)
    
    set({ healthPollingInterval: interval })
  },

  stopHealthPolling: () => {
    const currentInterval = get().healthPollingInterval
    if (currentInterval) {
      clearInterval(currentInterval)
      set({ healthPollingInterval: null })
    }
  },
}))
