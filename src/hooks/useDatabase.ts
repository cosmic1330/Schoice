import { error, info } from "@tauri-apps/plugin-log";
import Database from "@tauri-apps/plugin-sql";
import { useEffect, useState } from "react";

export default function useDatabase() {
  const [db, setDb] = useState<Database | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const initializeDb = async () => {
      // 防止重複初始化
      if (isInitializing || db) {
        console.log("資料庫已在初始化中或已初始化", {
          isInitializing,
          db: !!db,
        });
        return;
      }

      setIsInitializing(true);

      try {
        console.log("開始初始化資料庫...");
        // 載入 SQLite 資料庫
        const database = await Database.load("sqlite:schoice.db");
        console.log("資料庫載入成功:", database);

        // 測試資料庫連線
        await database.select("SELECT 1");
        console.log("資料庫連線測試成功");

        setDb(database);
        info("資料庫初始化成功");
        console.log("資料庫狀態已設定為:", database);
      } catch (e) {
        console.error("資料庫初始化失敗:", e);
        error(`資料庫初始化失敗: ${e}`);
        setDb(null);

        // 延遲重試機制
        setTimeout(() => {
          console.log("嘗試重新初始化資料庫...");
          setIsInitializing(false);
        }, 2000);
      } finally {
        if (db) {
          setIsInitializing(false);
        }
      }
    };

    initializeDb();
  }, []);

  return db;
}
