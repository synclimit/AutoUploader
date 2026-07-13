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
  
  // Global Upload State
  isUploading: boolean
  uploadProgress: number
  uploadFiles: (account_id: string, files: File[]) => Promise<void>
}

export const useQueueStore = create<QueueStoreState>((set, get) => ({
  tasks: [],
  activeTask: null,
  filters: {},
  loading: false,
  error: null,
  logs: [],
  isUploading: false,
  uploadProgress: 0,

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
        queryParams.append('channel_id', f.account_id)
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
      
      const mappedData = data.map((t: any) => ({ ...t, account_id: t.channel_id || t.account_id }))
      
      const activeTask = get().activeTask
      let newActiveTask = activeTask
      
      if (activeTask) {
        const found = mappedData.find((t: UploadTask) => t.id === activeTask.id)
        if (found) newActiveTask = found
      } else if (mappedData.length > 0) {
        newActiveTask = mappedData[0]
      }
      
      set({ tasks: mappedData, loading: false, activeTask: newActiveTask })
      
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
      const mappedData = { ...data, account_id: data.channel_id || data.account_id }
      set((s) => ({ 
        activeTask: mappedData,
        tasks: s.tasks.map(t => t.id === id ? mappedData : t)
      }))
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
      const updated = await apiClient.put(`/queue/${id}`, updates)
      set((s) => ({
        tasks: s.tasks.map((t) => t.id === id ? updated : t),
        activeTask: s.activeTask?.id === id ? updated : s.activeTask,
      }))
    } catch (error: any) {
      set({ error: error.message })
      throw error;
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
  },
  
  uploadFiles: async (account_id, files) => {
    set({ isUploading: true, uploadProgress: 0 });
    try {
      const formData = new FormData();
      formData.append('channel_id', account_id);

      Array.from(files).forEach(file => {
        // @ts-ignore - customPath added by directory reader
        const path = file.customPath || file.webkitRelativePath || file.name;
        formData.append('files', file, path);
      });

      const response = await apiClient.post('/import/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 0,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            set({ uploadProgress: percentCompleted });
          }
        }
      });
      
      const { showToast } = await import('../../components/common/NotificationToast');
      let message = 'Import finished.';
      if (response && response.imported !== undefined) {
        message = `Imported: ${response.imported}, Duplicates: ${response.duplicates}, Errors: ${response.errors}`;
      }
      showToast(message, 'success', 4000);
    } catch (err: any) {
      console.error('Import Error:', err);
      const { showToast } = await import('../../components/common/NotificationToast');
      showToast(`Import failed: ${err.message}`, 'error', 4000);
    } finally {
      set({ isUploading: false });
      await get().fetchTasks();
    }
  }
}))
