import { create } from "zustand";
import { listen } from "@tauri-apps/api/event";

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
  setupSyncListeners: () => Promise<(() => void)>;
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
        ...state.syncLogs.slice(-99), // Keep last 100, but take from end
        {
          ...log,
          id: Math.random().toString(36).substring(2, 9),
          time: new Date().toLocaleTimeString(),
        },
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

  setupSyncListeners: async () => {
    const unlistens = await Promise.all([
      listen<SyncStatus>("sync:status_change", (event) => {
        useSyncDashboardStore.getState().setSyncStatus(event.payload);
      }),
      listen<SyncLog>("sync:log_added", (event) => {
        useSyncDashboardStore.getState().addSyncLog(event.payload);
      }),
      listen<Partial<SyncStats>>("sync:stats_update", (event) => {
        useSyncDashboardStore.getState().setSyncStats(event.payload);
      }),
      listen<Record<string, HealthStatus>>("sync:health_map_update", (event) => {
        useSyncDashboardStore.getState().updateHealthMap(event.payload);
      }),
      listen<number>("sync:total_count_update", (event) => {
        useSyncDashboardStore.getState().setTotalCount(event.payload);
      }),
    ]);

    return () => {
      unlistens.forEach((unlisten) => unlisten());
    };
  },
}));

export default useSyncDashboardStore;
