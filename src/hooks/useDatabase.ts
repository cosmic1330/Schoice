import { error, info } from "@tauri-apps/plugin-log";
import Database from "@tauri-apps/plugin-sql";
import { useEffect, useState } from "react";

// Wrapper function to intercept and log database queries
const wrapDatabaseWithLogging = (db: Database): Database => {
  return new Proxy(db, {
    get(target, prop, receiver) {
      const originalValue = Reflect.get(target, prop, receiver);

      // Intercept 'execute' and 'select' methods
      if (prop === "execute" || prop === "select") {
        return async (...args: any[]) => {
          let sql = args[0];
          const params = args[1];

          let logSql = sql;
          if (logSql.length > 200) {
            logSql = logSql.substring(0, 200) + "...";
          }
          const queryId = Math.random().toString(36).substring(7);

          info(
            `[DB][sqlite][${String(
              prop,
            )}][${queryId}] START SQL: ${logSql} ${
              params ? `| Params: ${JSON.stringify(params)}` : ""
            }`,
          );

          try {
            const start = performance.now();
            const result = await originalValue.apply(target, args);
            const duration = performance.now() - start;
            info(
              `[DB][sqlite][${String(
                prop,
              )}][${queryId}] END Success (${duration.toFixed(2)}ms)`,
            );
            return result;
          } catch (e: any) {
            error(
              `[DB][sqlite][${String(prop)}][${queryId}] END Error: ${e}`,
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

  useEffect(() => {
    let active = true;
    localStorage.removeItem("schoice:db_type");

    const initialize = async () => {
      try {
        const database = await Database.load("sqlite:schoice.db");
        const wrappedDb = wrapDatabaseWithLogging(database);
        await wrappedDb.select("SELECT 1");
        if (active) setDb(wrappedDb);
        info("SQLite 資料庫初始化成功");
      } catch (exception) {
        if (active) setDb(null);
        error(`SQLite 資料庫初始化失敗: ${exception}`);
      }
    };

    void initialize();
    return () => {
      active = false;
    };
  }, []);

  return { db };
}
