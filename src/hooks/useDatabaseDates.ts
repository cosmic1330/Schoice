import Database from "@tauri-apps/plugin-sql";
import { useCallback, useEffect, useState } from "react";

export default function useDatabaseDates(db: Database | null) {
  const [dates, setDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDates = useCallback(async () => {
    if (!db) {
      console.log("useDatabaseDates: 資料庫尚未準備好");
      return;
    }

    if (isLoading) {
      console.log("useDatabaseDates: 正在載入中，跳過重複請求");
      return;
    }

    setIsLoading(true);

    try {
      const res = (await db.select(
        "SELECT DISTINCT t FROM daily_deal ORDER BY t DESC;"
      )) as { t: string }[];

      if (res && Array.isArray(res)) {
        const dateArray = res.map((item) => item.t);
        setDates(dateArray);
      } else {
        console.warn("useDatabaseDates: 查詢結果不是預期的陣列格式", res);
        setDates([]);
      }
    } catch (error) {
      console.error("useDatabaseDates: 查詢日期失敗", error);
      setDates([]);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    fetchDates();
  }, [fetchDates]);

  return { dates, fetchDates, isLoading };
}
