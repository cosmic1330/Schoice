import { useCallback, useContext, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { DatabaseContext } from "../context/DatabaseContext";
import SyncDatabaseHelper from "../classes/SyncDatabaseHelper";
import SyncEngine from "../classes/SyncEngine";
import useSyncDashboardStore from "../store/SyncDashboard.store";
import { getStore } from "../store/Setting.store";
import { StockTableType } from "../types";
import { emit } from "@tauri-apps/api/event";

/**
 * useSyncEngine - Provides a React binding for the Parallel Sync Engine.
 */
export const useSyncEngine = () => {
  const { db, dates } = useContext(DatabaseContext);
  const engine = SyncEngine.getInstance();
  const store = useSyncDashboardStore();

  // Self-healing: Ensure engine has dbHelper if we have a db instance in context
  useEffect(() => {
    if (db && !engine.hasDbHelper()) {
      console.log("[useSyncEngine] Engine helper missing, initializing...");
      engine.setDbHelper(new SyncDatabaseHelper(db));
    }
  }, [db]);

  // Setup listeners for the mapping windows (but not for the worker itsel, which updates locally)
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    
    const setup = async () => {
        const win = getCurrentWindow();
        const label = win.label;
        
        // If we are NOT the worker, we need to listen to events to stay in sync
        if (label !== "sync-worker") {
            console.log(`[useSyncEngine] Window ${label} is monitoring worker events...`);
            unlisten = await store.setupSyncListeners();
        } else {
            console.log(`[useSyncEngine] Window ${label} is the worker host, skipping redundant listeners.`);
        }
    };

    setup();
    
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const start = useCallback(async () => {
    const settingsStore = await getStore();
    const menu = (await settingsStore.get("menu")) as StockTableType[];
    if (menu) {
      // Emit command to worker instead of local execution
      await emit("sync:command_start", { menu, dates });
    }
  }, [dates]);

  const stop = useCallback(async () => {
    await emit("sync:command_stop");
  }, []);

  return {
    ...store,
    start,
    stop,
  };
};
