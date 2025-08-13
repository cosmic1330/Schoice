import { error, info } from "@tauri-apps/plugin-log";
import Database from "@tauri-apps/plugin-sql";
import { useEffect, useState } from "react";

export default function useDatabase() {
  const [db, setDb] = useState<Database | null>(null);

  useEffect(() => {
    const initializeDb = async () => {
      try {
        // 載入 SQLite 資料庫
        const database = await Database.load("sqlite:schoice.db");
        setDb(database);
        info("資料庫初始化成功");
      } catch (e) {
        error(`資料庫初始化失敗: ${e}`);
      }
    };

    initializeDb();
  }, []);
  return db;
}
