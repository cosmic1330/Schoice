import Database from "@tauri-apps/plugin-sql";
import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useState } from "react";

export default function useDatabaseDates(db: Database | null) {
  const [dates, setDates] = useState<string[]>([]);
  const [weekDates, setWeekDates] = useState<string[]>([]);
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
      // 抓取日線日期
      const dailyRes = (await db.select(
        "SELECT DISTINCT t FROM daily_deal ORDER BY t DESC;"
      )) as { t: string }[];

      // 抓取週線日期
      const weeklyRes = (await db.select(
        "SELECT DISTINCT t FROM weekly_deal ORDER BY t DESC;"
      )) as { t: string }[];

      if (dailyRes && Array.isArray(dailyRes)) {
        setDates(dailyRes.map((item) => item.t));
      }
      
      if (weeklyRes && Array.isArray(weeklyRes)) {
        setWeekDates(weeklyRes.map((item) => item.t));
      }
    } catch (error) {
      console.error("useDatabaseDates: 查詢日期失敗", error);
      setDates([]);
      setWeekDates([]);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    fetchDates();
  }, [fetchDates]);

  useEffect(() => {
    let unlisten: any;
    const setupListener = async () => {
      unlisten = await listen<string>("sync:status_change", (event) => {
        if (event.payload === "success" || event.payload === "stopped") {
          fetchDates();
        }
      });
    };
    setupListener();
    return () => {
      if (unlisten) unlisten();
    };
  }, [fetchDates]);

  return { dates, weekDates, fetchDates, isLoading };
}
