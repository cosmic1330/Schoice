import { create } from "zustand";

export type SyncStatus = 'idle' | 'scanning' | 'syncing' | 'cooling' | 'paused' | 'stopped' | 'success' | 'error';

export interface SyncLog {
  id: string;
  msg: string;
  type: 'info' | 'error' | 'wait' | 'success';
  time: string;
}

export interface SyncStats {
  rpm: number;
  successRate: number;
  total: number;
  completed: number;
  remainingTime: string;
}

export type HealthStatus = 'fresh' | 'stale' | 'gap' | 'missing' | 'syncing' | 'error' | 'idle';

interface SyncDashboardState {
  // Engine State
  syncStatus: SyncStatus;
  syncStats: SyncStats;
  syncLogs: SyncLog[];
  syncHealthMap: Record<string, HealthStatus>;
  
  // Actions
  setSyncStatus: (status: SyncStatus) => void;
  setSyncStats: (stats: Partial<SyncStats>) => void;
  addSyncLog: (log: Omit<SyncLog, 'id' | 'time'>) => void;
  clearSyncLogs: () => void;
  updateHealthMap: (updates: Record<string, HealthStatus>) => void;
  resetHealthMap: () => void;
  setTotalCount: (total: number) => void;
}

const useSyncDashboardStore = create<SyncDashboardState>((set) => ({
  syncStatus: 'idle',
  syncStats: {
    rpm: 0,
    successRate: 0,
    total: 0,
    completed: 0,
    remainingTime: '00:00:00',
  },
  syncLogs: [],
  syncHealthMap: {},

  setSyncStatus: (status: SyncStatus) => set({ syncStatus: status }),
  
  setSyncStats: (stats: Partial<SyncStats>) =>
    set((state) => ({ syncStats: { ...state.syncStats, ...stats } })),
    
  addSyncLog: (log) =>
    set((state) => ({
      syncLogs: [
        {
          ...log,
          id: Math.random().toString(36).substring(2, 9),
          time: new Date().toLocaleTimeString(),
        },
        ...state.syncLogs.slice(0, 99), // Keep last 100
      ],
    })),
    
  clearSyncLogs: () => set({ syncLogs: [] }),
  
  updateHealthMap: (updates) =>
    set((state) => ({
      syncHealthMap: { ...state.syncHealthMap, ...updates },
    })),
    
  resetHealthMap: () => set({ syncHealthMap: {} }),

  setTotalCount: (total: number) => 
    set((state) => ({ syncStats: { ...state.syncStats, total } })),
}));

export default useSyncDashboardStore;
