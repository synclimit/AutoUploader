import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ActiveModule = 'Dashboard' | 'Upload' | 'Review' | 'Channels' | 'Analytics' | 'Settings'

export interface AppState {
  activeModule: ActiveModule
  sidebarCollapsed: boolean
  selectedWorkspace: string
  theme: 'dark' | 'light'
  userName: string

  setActiveModule: (module: ActiveModule) => void
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
      sidebarCollapsed: false,
      selectedWorkspace: 'DJ Remix Factory',
      theme: 'dark',
      userName: 'Admin',

      setActiveModule: (module) => set({ activeModule: module }),
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
