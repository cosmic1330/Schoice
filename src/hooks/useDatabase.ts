import { error, info } from "@tauri-apps/plugin-log";
import Database from "@tauri-apps/plugin-sql";
import { useCallback, useEffect, useState } from "react";
import getPostgresInstance from "../database/postgres";

// Wrapper function to intercept and log database queries
const wrapDatabaseWithLogging = (db: Database, dbType: string): Database => {
  return new Proxy(db, {
    get(target, prop, receiver) {
      const originalValue = Reflect.get(target, prop, receiver);

      // Intercept 'execute' and 'select' methods
      if (prop === "execute" || prop === "select") {
        return async (...args: any[]) => {
          const sql = args[0];
          // Truncate long SQL queries for cleaner logs if needed, but for now log full
          let logSql = sql;
          if (logSql.length > 200) {
            logSql = logSql.substring(0, 200) + "...";
          }
          const params = args[1];
          const queryId = Math.random().toString(36).substring(7); // Basic ID for correlation

          info(
            `[DB][${dbType}][${String(
              prop
            )}][${queryId}] START SQL: ${logSql} ${
              params ? `| Params: ${JSON.stringify(params)}` : ""
            }`
          );

          try {
            const start = performance.now();
            const result = await originalValue.apply(target, args);
            const duration = performance.now() - start;
            info(
              `[DB][${dbType}][${String(
                prop
              )}][${queryId}] END Success (${duration.toFixed(2)}ms)`
            );
            return result;
          } catch (e: any) {
            error(
              `[DB][${dbType}][${String(prop)}][${queryId}] END Error: ${e}`
            );
            throw e;
          }
        };
      }

      return originalValue;
    },
  });
};

export default function useDatabase() {
  const [db, setDb] = useState<Database | null>(null);
  const [dbType, setDbType] = useState<"sqlite" | "postgres">("sqlite");
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // 初始化資料庫
  const initializeDb = useCallback(
    async (type: "sqlite" | "postgres") => {
      // 防止重複初始化
      // 注意：這裡不擋 db 存在的情況，因為可能是切換資料庫
      if (isInitializing) {
        return;
      }

      setIsInitializing(true);
      // 如果 db 已經存在，代表是切換過程，設定 isSwitching
      if (db) {
        setIsSwitching(true);
      }

      // setDb(null); // 切換前先清空，避免狀態不一致 -> 改為無縫切換，保留舊實例直到新連接完成

      try {
        if (type === "postgres") {
          console.log("嘗試連接 PostgreSQL...");
          // 設定 5 秒超時
          const postgresPromise = getPostgresInstance();
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("Postgres connection timeout")),
              5000
            )
          );

          const postgresDb = await Promise.race([
            postgresPromise,
            timeoutPromise,
          ]);

          // Wrap with logging
          const wrappedDb = wrapDatabaseWithLogging(postgresDb, "postgres");
          await wrappedDb.select("SELECT 1"); // 測試連線 (using wrapped db to log check)

          console.log("PostgreSQL 連線成功");
          setDb(wrappedDb);
          setDbType("postgres");
          localStorage.setItem("schoice:db_type", "postgres");
          info("PostgreSQL 資料庫初始化成功");
        } else {
          console.log("開始初始化 SQLite 資料庫...");
          const database = await Database.load("sqlite:schoice.db");

          // Wrap with logging
          const wrappedDb = wrapDatabaseWithLogging(database, "sqlite");
          await wrappedDb.select("SELECT 1"); // 測試連線

          console.log("SQLite 資料庫連線成功");
          setDb(wrappedDb);
          setDbType("sqlite");
          localStorage.setItem("schoice:db_type", "sqlite");
          info("SQLite 資料庫初始化成功");
        }
      } catch (e: any) {
        console.error(`${type} 資料庫初始化失敗:`, e);
        error(`${type} 資料庫初始化失敗: ${e}`);

        // 如果是 Postgres 失敗，自動降級回 SQLite (這是一個友好的 fallback，雖然使用者可能明確選了 Postgres)
        // 或者保持 null 讓 UI 顯示錯誤。根據之前的邏輯，我們保留一個 fallback 機制比較好
        if (type === "postgres") {
          console.log("Postgres 失敗，嘗試 fallback 到 SQLite...");
          // 遞歸呼叫自己 fallback
          // 注意：這裡不要 await initializeDb("sqlite") 避免複雜遞歸狀態，直接設定為 sqlite 下次 effect 執行
          // 但為了 UX，直接在這裡執行 sqlite 初始化邏輯比較快
          try {
            const database = await Database.load("sqlite:schoice.db");
            const wrappedDb = wrapDatabaseWithLogging(database, "sqlite");

            setDb(wrappedDb);
            setDbType("sqlite");
            localStorage.setItem("schoice:db_type", "sqlite"); // 自動改回 sqlite setting? 或者保留設定但當次用 sqlite?
            // 這裡選擇自動改回 sqlite 以免下次打開又卡住
            info("Fallback 到 SQLite 成功");
          } catch (err) {
            setDb(null);
          }
        } else {
          setDb(null);
          // SQLite 也失敗就真的沒救了，重試邏輯可以保留在 effect 或是 UI 手動重試
        }
        throw e; // 重拋錯誤，讓 switchDatabase 的呼叫端可以捕獲並顯示跳窗
      } finally {
        setIsInitializing(false);
        setIsSwitching(false);
      }
    },
    [isInitializing, db]
  );

  const switchDatabase = useCallback(
    async (type: "sqlite" | "postgres") => {
      await initializeDb(type);
      // 可以選擇 reload window 確保徹底清除狀態，但如果是 React 狀態管理得當，不需要 reload
      // window.location.reload();
    },
    [initializeDb]
  );

  useEffect(() => {
    // 讀取設定，預設 sqlite
    const savedType =
      (localStorage.getItem("schoice:db_type") as "sqlite" | "postgres") ||
      "sqlite";
    if (!db && !isInitializing) {
      initializeDb(savedType).catch(() => {
        // 初始載入失敗時靜默處理，因為 initializeDb 內部已有 fallback 邏輯
      });
    }
  }, []); // 只在 mount 時執行一次自動初始化

  return { db, dbType, switchDatabase, isSwitching };
}
