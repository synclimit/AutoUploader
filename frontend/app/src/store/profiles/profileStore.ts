import { create } from 'zustand'
import { showToast } from '../../components/common/NotificationToast'
import apiClient from '../../api/client'

export interface ProfileTemplate {
  id: string
  type: string
  content: string
  created_at: string
}

export interface ProfileList {
  id: string
  name: string
  content_type: string
}

export interface ProfileDetail {
  id: string
  name: string
  description: string | null
  content_type: string
  metadata_strategy: string
  title_templates: ProfileTemplate[]
  description_templates: ProfileTemplate[]
  tag_templates: ProfileTemplate[]
}

export interface ProfileStoreState {
  profiles: ProfileList[]
  activeProfile: ProfileDetail | null
  isLoading: boolean
  error: string | null

  fetchProfiles: () => Promise<void>
  fetchProfile: (id: string) => Promise<void>
  createProfile: (data: any) => Promise<void>
  updateProfile: (id: string, data: any) => Promise<void>
  deleteProfile: (id: string) => Promise<void>
  bulkImportTemplates: (profileId: string, type: string, mode: string, templates: string[]) => Promise<void>
  deleteTemplate: (profileId: string, templateId: string, type: string) => Promise<void>
  duplicateProfile: (id: string) => Promise<void>
  setDefaultProfile: (id: string) => Promise<void>
}

export const useProfileStore = create<ProfileStoreState>((set, get) => ({
  profiles: [],
  activeProfile: null,
  isLoading: false,
  error: null,

  fetchProfiles: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await apiClient.get('/profiles')
      set({ profiles: data, isLoading: false })
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
    }
  },

  fetchProfile: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const data = await apiClient.get(`/profiles/${id}`)
      set({ activeProfile: data, isLoading: false })
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
    }
  },

  createProfile: async (data: any) => {
    set({ isLoading: true, error: null })
    try {
      const newProfile = await apiClient.post('/profiles', data)
      showToast('Profile Created', 'success')
      await get().fetchProfiles()
      set({ activeProfile: newProfile, isLoading: false })
    } catch (err: any) {
      showToast(err.message, 'error')
      set({ error: err.message, isLoading: false })
    }
  },

  updateProfile: async (id: string, data: any) => {
    set({ isLoading: true, error: null })
    try {
      const updatedProfile = await apiClient.put(`/profiles/${id}`, data)
      showToast('Profile Updated', 'success')
      await get().fetchProfiles()
      set({ activeProfile: updatedProfile, isLoading: false })
    } catch (err: any) {
      showToast(err.message, 'error')
      set({ error: err.message, isLoading: false })
    }
  },

  deleteProfile: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      await apiClient.delete(`/profiles/${id}`)
      showToast('Profile Deleted', 'info')
      await get().fetchProfiles()
      set({ activeProfile: null, isLoading: false })
    } catch (err: any) {
      showToast(err.message, 'error')
      set({ error: err.message, isLoading: false })
    }
  },

  bulkImportTemplates: async (profileId: string, type: string, mode: string, templates: string[]) => {
    try {
      const data = await apiClient.post(`/profiles/${profileId}/templates/bulk`, { type, mode, templates })
      
      showToast(`${data.imported_count} Templates Imported`, 'success')
      if (data.skipped_count > 0) {
        setTimeout(() => {
            showToast(`${data.skipped_count} Duplicate Templates Skipped`, 'warning')
        }, 300)
      }
      
      // Update active profile templates
      const active = get().activeProfile
      if (active && active.id === profileId) {
        const key = `${type}_templates` as keyof ProfileDetail
        set({
          activeProfile: {
            ...active,
            [key]: data.templates
          }
        })
      }
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  },

  deleteTemplate: async (profileId: string, templateId: string, type: string) => {
    try {
      await apiClient.delete(`/profiles/${profileId}/templates/${templateId}`)
      showToast('Template Deleted', 'info')
      
      const active = get().activeProfile
      if (active && active.id === profileId) {
        const key = `${type}_templates` as keyof ProfileDetail
        set({
          activeProfile: {
            ...active,
            [key]: (active[key] as ProfileTemplate[]).filter(t => t.id !== templateId)
          }
        })
      }
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  },

  duplicateProfile: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const newProfile = await apiClient.post(`/profiles/${id}/duplicate`)
      showToast('Profile Duplicated', 'success')
      await get().fetchProfiles()
      set({ activeProfile: newProfile, isLoading: false })
    } catch (err: any) {
      showToast(err.message, 'error')
      set({ error: err.message, isLoading: false })
    }
  },

  setDefaultProfile: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const updatedProfile = await apiClient.post(`/profiles/${id}/default`)
      showToast('Profile set as Default', 'success')
      await get().fetchProfiles()
      set({ activeProfile: updatedProfile, isLoading: false })
    } catch (err: any) {
      showToast(err.message, 'error')
      set({ error: err.message, isLoading: false })
    }
  }
}))
