import { create } from 'zustand'
import apiClient from '../../api/client'

export interface UploadTask {
  id: string
  account_id: string
  profile_id: string | null
  status: string
  metadata_source: string
  source_type: string
  package_folder: string
  video_path: string
  thumbnail_path: string | null
  metadata_path: string | null
  timestamps_path: string | null
  title: string | null
  description: string | null
  retry_count: number
  failure_reason: string | null
  created_at: string
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
}

export interface QueueStoreState {
  tasks: UploadTask[]
  activeTask: UploadTask | null
  filters: {
    status?: string[]
    source_type?: string
    account_id?: string
    profile_id?: string
    keyword?: string
    sort_by?: string
    sort_order?: string
  }
  loading: boolean
  error: string | null
  logs: any[]

  setFilters: (filters: any) => void
  fetchTasks: () => Promise<void>
  fetchTask: (id: string) => Promise<void>
  createTask: (data: Partial<UploadTask>) => Promise<void>
  updateTask: (id: string, updates: Partial<UploadTask>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  approveTask: (id: string) => Promise<void>
  cancelTask: (id: string) => Promise<void>
  retryTask: (id: string) => Promise<void>
  scheduleTask: (id: string, scheduled_at: string) => Promise<void>
  setActiveTask: (task: UploadTask | null) => void
  setLogs: (logs: any[]) => void
  fetchTaskLogs: (id: string) => Promise<void>
}

export const useQueueStore = create<QueueStoreState>((set, get) => ({
  tasks: [],
  activeTask: null,
  filters: {},
  loading: false,
  error: null,
  logs: [],

  setFilters: (filters) => set({ filters }),
  
  fetchTasks: async () => {
    // Only set loading to true if we don't have tasks (first load)
    if (get().tasks.length === 0) set({ loading: true, error: null })
    try {
      const queryParams = new URLSearchParams()
      const f = get().filters
      if (f.status && f.status.length > 0) {
        f.status.forEach((statusVal: string) => {
          queryParams.append('status', statusVal)
        })
      }
      if (f.source_type) {
        queryParams.append('source_type', f.source_type)
      }
      if (f.account_id) {
        queryParams.append('account_id', f.account_id)
      }
      if (f.keyword) {
        queryParams.append('keyword', f.keyword)
      }
      if (f.sort_by) {
        queryParams.append('sort_by', f.sort_by)
      }
      if (f.sort_order) {
        queryParams.append('sort_order', f.sort_order)
      }

      const queryString = queryParams.toString()
      const url = queryString ? `/queue?${queryString}` : '/queue'
      
      const data = await apiClient.get(url)
      
      const activeTask = get().activeTask
      let newActiveTask = activeTask
      
      if (activeTask) {
        const found = data.find((t: UploadTask) => t.id === activeTask.id)
        if (found) newActiveTask = found
      } else if (data.length > 0) {
        newActiveTask = data[0]
      }
      
      set({ tasks: data, loading: false, activeTask: newActiveTask })
      
      // Also fetch logs if we have an active task
      if (newActiveTask) {
        get().fetchTaskLogs(newActiveTask.id)
      }
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  fetchTask: async (id) => {
    try {
      const data = await apiClient.get(`/queue/${id}`)
      set({ activeTask: data })
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  createTask: async (data) => {
    set({ loading: true, error: null })
    try {
      await apiClient.post('/queue', data)
      await get().fetchTasks()
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  updateTask: async (id, updates) => {
    try {
      await apiClient.put(`/queue/${id}`, updates)
      await get().fetchTasks()
      if (get().activeTask?.id === id) {
        await get().fetchTask(id)
      }
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  deleteTask: async (id) => {
    try {
      await apiClient.delete(`/queue/${id}`)
      await get().fetchTasks()
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  approveTask: async (id) => {
    try {
      const updated = await apiClient.post(`/queue/${id}/approve`)
      set((s) => ({
        tasks: s.tasks.map((t) => t.id === id ? updated : t),
        activeTask: s.activeTask?.id === id ? updated : s.activeTask,
      }))
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  cancelTask: async (id) => {
    try {
      const updated = await apiClient.post(`/queue/${id}/cancel`)
      set((s) => ({
        tasks: s.tasks.map((t) => t.id === id ? updated : t),
        activeTask: s.activeTask?.id === id ? updated : s.activeTask,
      }))
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  retryTask: async (id) => {
    try {
      await apiClient.post(`/queue/${id}/retry`)
      await get().fetchTasks()
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  scheduleTask: async (id, scheduled_at) => {
    try {
      const updated = await apiClient.post(`/queue/${id}/schedule`, { scheduled_at })
      set((s) => ({
        tasks: s.tasks.map((t) => t.id === id ? updated : t),
        activeTask: s.activeTask?.id === id ? updated : s.activeTask,
      }))
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  setActiveTask: (task) => {
    set({ activeTask: task })
    if (task) get().fetchTaskLogs(task.id)
  },
  
  setLogs: (logs) => set({ logs }),

  fetchTaskLogs: async (id) => {
    try {
      const data = await apiClient.get(`/queue/${id}/logs`)
      set({ logs: data })
    } catch (error: any) {
      console.error(error)
    }
  }
}))
