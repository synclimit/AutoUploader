import { create } from 'zustand'
import apiClient from '../../api/client'

export type HistoryFilter = 'SUCCESS' | 'FAILED' | 'RETRYING' | 'HIGH VIEWS' | 'LOW CTR' | 'M3 Playlist Builder' | 'ALL'

export interface HistoryItem {
  id: string
  title: string
  channel: string
  status: 'SUCCESS' | 'FAILED' | 'RETRYING'
  views: string
  duration: string
  date: string
  time: string
  source: string
  retry: string
  mode: string
  ctr?: string
  uploadDate?: string
  thumbnail?: string
}

export interface HistoryState {
  historyItems: HistoryItem[]
  filters: {
    quickFilter: HistoryFilter
    dateRange: string
    workspace: string
  }
  stats: { title: string; value: string; change: string; color: string }[]
  logs: string[]

  isLoading: boolean
  error: string | null

  setHistoryItems: (items: HistoryItem[]) => void
  addHistoryItem: (item: HistoryItem) => void
  removeHistoryItem: (id: string) => void
  setQuickFilter: (filter: HistoryFilter) => void
  setDateRange: (range: string) => void
  setWorkspace: (workspace: string) => void
  resetFilters: () => void
  fetchHistoryData: () => Promise<void>
}

const QUICK_FILTERS_LIST = ['SUCCESS', 'FAILED', 'RETRYING', 'HIGH VIEWS', 'LOW CTR', 'M3 Playlist Builder']

const defaultFilters = {
  quickFilter: 'ALL' as HistoryFilter,
  dateRange: 'Last 7 Days',
  workspace: 'DJ Remix Factory',
}

export const useHistoryStore = create<HistoryState>((set) => ({
  historyItems: [],
  stats: [],
  logs: [],
  filters: defaultFilters,
  isLoading: false,
  error: null,

  setHistoryItems: (items) => set({ historyItems: items }),
  addHistoryItem: (item) => set((state) => ({ historyItems: [item, ...state.historyItems] })),
  removeHistoryItem: (id) => set((state) => ({ historyItems: state.historyItems.filter((i) => i.id !== id) })),
  setQuickFilter: (filter) => set((state) => ({ filters: { ...state.filters, quickFilter: filter } })),
  setDateRange: (range) => set((state) => ({ filters: { ...state.filters, dateRange: range } })),
  setWorkspace: (workspace) => set((state) => ({ filters: { ...state.filters, workspace } })),
  resetFilters: () => set({ filters: defaultFilters }),

  fetchHistoryData: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await apiClient.get('/history')
      set({ 
        historyItems: data.items,
        stats: data.stats,
        logs: data.logs,
        isLoading: false
      })
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
    }
  },
}))
