import { create } from 'zustand'
import apiClient from '../../api/client'
import { showToast } from '../../components/common/NotificationToast'

export interface SettingCardData {
  title: string
  value: string
  color: string
}

export interface ConfigRowData {
  label: string
  description: string
  type: string
  value: string | boolean | number
  options?: string[]
  backendKey?: string
}

export interface ConfigSectionData {
  title: string
  status: string
  id: string
  description: string
  rows: ConfigRowData[]
}

export interface MonitorCardData {
  title: string
  value: string
}

export interface SettingsState {
  categories: string[]
  selectedCategory: string
  systemCards: SettingCardData[]
  configSections: ConfigSectionData[]
  monitorCards: MonitorCardData[]
  logs: string[]
  config: any

  setSelectedCategory: (category: string) => void
  setSystemCards: (cards: SettingCardData[]) => void
  setConfigSections: (sections: ConfigSectionData[]) => void
  setMonitorCards: (cards: MonitorCardData[]) => void
  setLogs: (logs: string[]) => void
  updateLocalSetting: (key: string, value: any) => void

  fetchSettings: () => Promise<void>
  updateSettings: (updates: any) => Promise<void>
}

const defaultCategories = [
  'General',
  'Upload Engine',
  'AI Integration',
  'Notifications',
  'Performance',
  'Appearance',
  'Advanced'
]

const defaultSystemCards: SettingCardData[] = [
  { title: 'Upload Engine', value: 'ACTIVE', color: 'text-green-300' },
  { title: 'AI Metadata', value: 'CONNECTED', color: 'text-cyan-300' },
  { title: 'Scheduler', value: 'RUNNING', color: 'text-orange-300' },
  { title: 'Storage Usage', value: '72%', color: 'text-purple-300' },
]

const defaultMonitorCards: MonitorCardData[] = [
  { title: 'Queue Health', value: 'Stable' },
  { title: 'API Status', value: 'Online' },
  { title: 'Retry Engine', value: 'Running' },
  { title: 'Watch Engine', value: 'Scanning' },
  { title: 'Cache Usage', value: '72%' },
  { title: 'Storage', value: '428 GB' },
]

const defaultLogs = [
  '[20:01] Scheduler config updated',
  '[20:02] Workspace metadata synced',
  '[20:03] Retry engine restarted',
  '[20:05] Gemini API reconnected',
]

export const useSettingsStore = create<SettingsState>((set, get) => ({
  categories: defaultCategories,
  selectedCategory: 'General',
  systemCards: defaultSystemCards,
  configSections: [],
  monitorCards: defaultMonitorCards,
  logs: defaultLogs,
  config: null,

  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSystemCards: (cards) => set({ systemCards: cards }),
  setConfigSections: (sections) => set({ configSections: sections }),
  setMonitorCards: (cards) => set({ monitorCards: cards }),
  setLogs: (logs) => set({ logs }),
  updateLocalSetting: (key, value) => set((state) => ({ config: { ...state.config, [key]: value } })),

  fetchSettings: async () => {
    try {
      const data = await apiClient.get('/settings')
      
      // Map backend GlobalSettings to frontend ConfigSections
      const sections: ConfigSectionData[] = [
        {
          title: 'General',
          status: 'Ready',
          id: 'general-config',
          description: 'Global system preferences',
          rows: [
            { label: 'Language', description: 'System language', type: 'select', value: data.general_language, options: ['en', 'id', 'es'], backendKey: 'general_language' },
            { label: 'Auto Launch', description: 'Launch on startup', type: 'toggle', value: data.general_launch, backendKey: 'general_launch' },
            { label: 'Auto Update', description: 'Automatically apply updates', type: 'toggle', value: data.general_update, backendKey: 'general_update' },
          ]
        },
        {
          title: 'Upload Engine',
          status: 'Active',
          id: 'upload-config',
          description: 'Upload queue behavior',
          rows: [
            { label: 'Concurrent Uploads', description: 'Number of parallel uploads', type: 'select', value: data.upload_concurrent.toString(), options: ['1', '2', '3', '4', '5'], backendKey: 'upload_concurrent' },
            { label: 'Max Retries', description: 'Max retry attempts on failure', type: 'select', value: data.upload_retry.toString(), options: ['1', '3', '5', '10'], backendKey: 'upload_retry' },
          ]
        },
        {
          title: 'AI Integration',
          status: 'Connected',
          id: 'ai-config',
          description: 'AI Metadata settings',
          rows: [
            { label: 'Enable Gemini', description: 'Use Gemini for metadata', type: 'toggle', value: data.ai_enabled, backendKey: 'ai_enabled' },
            { label: 'AI Temperature', description: 'Creativity level', type: 'select', value: data.ai_temperature, options: ['0.3', '0.5', '0.7', '1.0'], backendKey: 'ai_temperature' },
          ]
        },
        {
          title: 'Notifications',
          status: 'Enabled',
          id: 'notif-config',
          description: 'System alerts and sounds',
          rows: [
            { label: 'Desktop Notifications', description: 'Show OS notifications', type: 'toggle', value: data.notif_desktop, backendKey: 'notif_desktop' },
            { label: 'Sound Effects', description: 'Play sounds on events', type: 'toggle', value: data.notif_sound, backendKey: 'notif_sound' },
            { label: 'Notify on Success', description: 'Alert when upload finishes', type: 'toggle', value: data.notif_success, backendKey: 'notif_success' },
            { label: 'Notify on Failure', description: 'Alert when upload fails', type: 'toggle', value: data.notif_fail, backendKey: 'notif_fail' },
          ]
        },
        {
          title: 'Performance',
          status: 'Optimized',
          id: 'perf-config',
          description: 'System resource usage',
          rows: [
            { label: 'Performance Mode', description: 'Resource profile', type: 'select', value: data.perf_mode, options: ['eco', 'balanced', 'performance'], backendKey: 'perf_mode' },
            { label: 'Background Workers', description: 'Number of worker threads', type: 'select', value: data.perf_workers.toString(), options: ['1', '2', '4', '8'], backendKey: 'perf_workers' },
            { label: 'Use GPU Acceleration', description: 'Hardware acceleration', type: 'toggle', value: data.perf_gpu, backendKey: 'perf_gpu' },
          ]
        },
        {
          title: 'Appearance',
          status: 'Active',
          id: 'app-config',
          description: 'UI Customization',
          rows: [
            { label: 'Theme', description: 'Color scheme', type: 'select', value: data.general_theme, options: ['dark', 'light', 'system'], backendKey: 'general_theme' },
            { label: 'Density', description: 'UI Spacing', type: 'select', value: data.app_density, options: ['compact', 'comfortable', 'spacious'], backendKey: 'app_density' },
            { label: 'Accent Color', description: 'Primary brand color', type: 'select', value: data.app_color, options: ['cyan', 'purple', 'blue', 'green'], backendKey: 'app_color' },
            { label: 'Enable Animations', description: 'UI motion effects', type: 'toggle', value: data.app_anim, backendKey: 'app_anim' },
            { label: 'Compact Mode', description: 'Minimize sidebar', type: 'toggle', value: data.app_compact, backendKey: 'app_compact' },
          ]
        },
        {
          title: 'Advanced',
          status: 'Warning',
          id: 'adv-config',
          description: 'Developer & debug options',
          rows: [
            { label: 'Developer Mode', description: 'Enable advanced tools', type: 'toggle', value: data.adv_dev, backendKey: 'adv_dev' },
            { label: 'Verbose Logging', description: 'Detailed system logs', type: 'toggle', value: data.adv_logs, backendKey: 'adv_logs' },
          ]
        }
      ]

      set({ configSections: sections, config: data })
    } catch (err: any) {
      showToast('Failed to fetch settings', 'error')
    }
  },

  updateSettings: async (updates: any) => {
    try {
      // First hit backend
      await apiClient.put('/settings', updates)
      showToast('Settings saved', 'success')
      // Refresh local state to reflect changes
      await get().fetchSettings()
    } catch (err: any) {
      showToast('Failed to save settings', 'error')
    }
  }
}))
