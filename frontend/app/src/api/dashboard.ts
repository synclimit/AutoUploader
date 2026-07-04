import apiClient from './client';

export interface DashboardTask {
  title: string;
  video_id: string;
  platform: string;
  status: string;
}

export interface DashboardStatistics {
  pending_review: number;
  queued: number;
  scheduled: number;
  uploading: number;
  failed: number;
  completed: number;
}

export interface EngineState {
  status: string;
  processed_tasks: number;
  polling_interval_seconds: number;
}

export interface DashboardData {
  statistics: DashboardStatistics;
  engine_state: EngineState;
  recent_tasks: DashboardTask[];
}

export const DashboardAPI = {
  get: async (): Promise<DashboardData> => {
    return await apiClient.get<any, DashboardData>('/dashboard');
  }
};
