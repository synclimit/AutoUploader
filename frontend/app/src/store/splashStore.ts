import { create } from 'zustand'
import apiClient from '../api/client'

export const useSplashStore = create((set) => ({
  loading: true,
  progress: 0,
  status: 'Initializing Application...',
  ready: false,
  error: null,
  licenseValid: false,
  licenseData: null,

  setProgress: (progress) => set({ progress }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error, status: error ? 'Error' : 'Ready' }),
  setReady: (ready) => set({ ready, loading: !ready }),
  setLicense: (isValid, data) => set({ licenseValid: isValid, licenseData: data }),
  recheckLicense: async () => {
    try {
      const res = await apiClient.get('/license/status')
      set({ licenseValid: res?.valid === true, licenseData: res })
    } catch (e) {
      set({ licenseValid: false, licenseData: { valid: false, status: 'Error connecting to license service' } })
    }
  }
}))
