import { create } from 'zustand'
import apiClient from '../../api/client'

interface DashboardState {
  statistics: {
    pending_review: number
    queued: number
    scheduled: number
    uploading: number
    completed: number
    failed: number
  }
  connected_channels: {
    connected_channels: number
    authenticated_channels: number
    disconnected_channels: number
  }
  attention: {
    pending_review: any[]
    failed: any[]
  }
  analytics: {
    period: string
    labels: string[]
    uploads: number[]
    completed: number[]
    failed: number[]
  }
  engine: {
    status: string
    uptime: string
    worker_count: number
    queue_size: number
    active_uploads: number
    scheduler_status: string
    watch_folder_status: string
    last_poll: string
  }
  history: {
    latest_completed: any[]
    latest_failed: any[]
    last_upload_time: string | null
  }
  notification: {
    healthy: boolean
    message: string
  }
  meta: {
    timestamp: string
    version: string
  }
  timeFilter: string
  setTimeFilter: (filter: string) => void
  isLoading: boolean
  error: string | null
  fetchDashboardData: () => Promise<void>
}

const defaultStats = {
  pending_review: 0, queued: 0, scheduled: 0, uploading: 0, completed: 0, failed: 0
}

const defaultChannels = {
  connected_channels: 0, authenticated_channels: 0, disconnected_channels: 0
}

const defaultAttention = {
  pending_review: [], failed: []
}

const defaultAnalytics = {
  period: "7d", labels: [], uploads: [], completed: [], failed: []
}

const defaultEngine = {
  status: "unknown", uptime: "0h 0m", worker_count: 0, queue_size: 0, active_uploads: 0, scheduler_status: "unknown", watch_folder_status: "unknown", last_poll: ""
}

const defaultHistory = {
  latest_completed: [], latest_failed: [], last_upload_time: null
}

const defaultNotification = {
  healthy: true, message: "System Healthy"
}

const defaultMeta = {
  timestamp: "", version: "1.0"
}

export const useDashboardStore = create<DashboardState>((set) => ({
  statistics: defaultStats,
  connected_channels: defaultChannels,
  attention: defaultAttention,
  analytics: defaultAnalytics,
  engine: defaultEngine,
  history: defaultHistory,
  notification: defaultNotification,
  meta: defaultMeta,
  timeFilter: '28d',
  setTimeFilter: (filter: string) => set({ timeFilter: filter }),
  isLoading: false,
  error: null,

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null })
    try {
      const data: any = await apiClient.get('/dashboard')
      if (data) {
        set({
          statistics: data.statistics || defaultStats,
          connected_channels: data.connected_channels || defaultChannels,
          attention: data.attention || defaultAttention,
          analytics: data.analytics || defaultAnalytics,
          engine: data.engine || defaultEngine,
          history: data.history || defaultHistory,
          notification: data.notification || defaultNotification,
          meta: data.meta || defaultMeta,
          isLoading: false
        })
      } else {
        set({ error: 'Failed to load dashboard data', isLoading: false })
      }
    } catch (error: any) {
      set({ error: error.message || 'Error fetching dashboard data', isLoading: false })
    }
  }
}))

if (typeof window !== 'undefined') {
  ;(window as any).dashboardStore = useDashboardStore
}
