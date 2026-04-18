import { useCallback, useContext, useEffect } from "react";
import { DatabaseContext } from "../context/DatabaseContext";
import SyncDatabaseHelper from "../classes/SyncDatabaseHelper";
import SyncEngine from "../classes/SyncEngine";
import useSyncDashboardStore from "../store/SyncDashboard.store";
import { getStore } from "../store/Setting.store";
import { StockTableType } from "../types";

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

  const start = useCallback(async () => {
    const settingsStore = await getStore();
    const menu = (await settingsStore.get("menu")) as StockTableType[];
    if (menu) {
      engine.start(menu, dates);
    }
  }, [dates, engine]);

  const stop = useCallback(() => {
    engine.stop();
  }, [engine]);

  return {
    ...store,
    start,
    stop,
  };
};
