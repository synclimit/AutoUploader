import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ActiveModule = 'Dashboard' | 'Upload' | 'Review' | 'Channels' | 'Analytics' | 'Settings' | 'Journal'

export interface AppState {
  activeModule: ActiveModule
  sidebarCollapsed: boolean
  selectedWorkspace: string
  theme: 'dark' | 'light'
  userName: string

  journalContext: { sessionId?: string, channelId?: string } | null

  setActiveModule: (module: ActiveModule) => void
  setJournalContext: (context: { sessionId?: string, channelId?: string } | null) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSelectedWorkspace: (workspace: string) => void
  setTheme: (theme: 'dark' | 'light') => void
  setUserName: (name: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeModule: 'Dashboard',
      journalContext: null,
      sidebarCollapsed: false,
      selectedWorkspace: 'DJ Remix Factory',
      theme: 'dark',
      userName: 'Admin',

      setActiveModule: (module) => set({ activeModule: module }),
      setJournalContext: (context) => set({ journalContext: context }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setSelectedWorkspace: (workspace) => set({ selectedWorkspace: workspace }),
      setTheme: (theme) => set({ theme }),
      setUserName: (name) => set({ userName: name }),
    }),
    {
      name: 'au-app-store', // localStorage key
      partialize: (state) => ({ activeModule: state.activeModule, userName: state.userName }), // Persist module & userName
    }
  )
)
