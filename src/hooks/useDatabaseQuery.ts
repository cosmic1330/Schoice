import { error } from "@tauri-apps/plugin-log";
import { useCallback, useContext, useRef } from "react";
import { DatabaseContext } from "../context/DatabaseContext";
import DatabasePerformanceMonitor from "../utils/DatabasePerformanceMonitor";

// 查詢節流機制
const pendingQueries = new Map<string, Promise<any>>();

export default function useDatabaseQuery() {
  const { db } = useContext(DatabaseContext);
  const abortController = useRef<AbortController | null>(null);
  const monitor = DatabasePerformanceMonitor.getInstance();

  const query = useCallback(
    async (sqlQuery: string) => {
      try {
        if (!db) return;

        // 檢查是否有相同的查詢正在進行中
        if (pendingQueries.has(sqlQuery)) {
          return pendingQueries.get(sqlQuery);
        }

        // 取消之前的查詢
        if (abortController.current) {
          abortController.current.abort();
        }
        abortController.current = new AbortController();

        // 開始性能監控
        const stopMonitoring = monitor.startQuery(sqlQuery);

        const queryPromise = db
          .select(sqlQuery)
          .then((res) => {
            pendingQueries.delete(sqlQuery);
            stopMonitoring(); // 結束性能監控
            return res as any[];
          })
          .catch((e) => {
            pendingQueries.delete(sqlQuery);
            stopMonitoring(); // 結束性能監控
            if (e.name !== "AbortError") {
              error(`Error executing query: ${e}`);
            }
            return [];
          });

        pendingQueries.set(sqlQuery, queryPromise);
        return queryPromise;
      } catch (e) {
        error(`Error executing query: ${e}`);
        return [];
      }
    },
    [db, monitor]
  );

  return query;
}
