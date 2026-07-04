import { create } from 'zustand';
import axios from 'axios';

const API_BASE = '/api/v1/analytics';

export const useAnalyticsStore = create((set, get) => ({
    dashboardData: {},
    overviewData: {},
    chartsData: {},
    videosData: {},
    operationsData: {},
    
    isLoading: false,
    error: null,
    lastSync: null,
    isRefreshing: false,

    fetchDashboard: async (accountId: string, forceRefresh = false) => {
        try {
            if (!forceRefresh) set({ isLoading: true, error: null });
            else set({ isRefreshing: true, error: null });
            
            const res = await axios.get(`${API_BASE}/dashboard/${accountId}?force_refresh=${forceRefresh}`);
            if (res.data && res.data.status === 'success') {
                set((state) => ({
                    dashboardData: {
                        ...state.dashboardData,
                        [accountId]: res.data.data
                    },
                    lastSync: new Date().toISOString()
                }));
            }
        } catch (err: any) {
            set({ error: err.response?.data?.detail || err.message });
        } finally {
            set({ isLoading: false, isRefreshing: false });
        }
    },

    fetchOverview: async (accountId: string, forceRefresh = false) => {
        try {
            if (!forceRefresh) set({ isLoading: true, error: null });
            else set({ isRefreshing: true, error: null });

            const res = await axios.get(`${API_BASE}/overview/${accountId}?force_refresh=${forceRefresh}`);
            if (res.data && res.data.status === 'success') {
                set((state) => ({
                    overviewData: {
                        ...state.overviewData,
                        [accountId]: res.data.data
                    },
                    lastSync: new Date().toISOString()
                }));
            }
        } catch (err: any) {
            set({ error: err.response?.data?.detail || err.message });
        } finally {
            set({ isLoading: false, isRefreshing: false });
        }
    },
    
    fetchCharts: async (accountId: string, days: number = 28, forceRefresh = false) => {
        try {
            const res = await axios.get(`${API_BASE}/charts/${accountId}?days=${days}&force_refresh=${forceRefresh}`);
            if (res.data && res.data.status === 'success') {
                set((state) => ({
                    chartsData: {
                        ...state.chartsData,
                        [`${accountId}_${days}`]: res.data.data
                    }
                }));
            }
        } catch (err: any) {
            set({ error: err.response?.data?.detail || err.message });
        }
    },
    
    fetchVideos: async (accountId: string, pageToken = null, limit = 50) => {
        try {
            const url = `${API_BASE}/videos/${accountId}?limit=${limit}${pageToken ? `&page_token=${pageToken}` : ''}`;
            const res = await axios.get(url);
            if (res.data && res.data.status === 'success') {
                set((state) => ({
                    videosData: {
                        ...state.videosData,
                        [accountId]: res.data.data
                    }
                }));
            }
        } catch (err: any) {
            set({ error: err.response?.data?.detail || err.message });
        }
    },

    fetchOperations: async (accountId: string) => {
        try {
            const res = await axios.get(`${API_BASE}/operations/${accountId}`);
            if (res.data && res.data.status === 'success') {
                set((state) => ({
                    operationsData: {
                        ...state.operationsData,
                        [accountId]: res.data.data
                    }
                }));
            }
        } catch (err: any) {
            console.error("Operations fetch error:", err);
        }
    }
}));
