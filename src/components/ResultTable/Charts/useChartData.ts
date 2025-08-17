import { useContext, useEffect, useMemo, useState } from "react";
import { DatabaseContext } from "../../../context/DatabaseContext";
import useQueryCache from "../../../hooks/useQueryCache";
import DatabasePerformanceMonitor from "../../../utils/DatabasePerformanceMonitor";

interface UseChartDataOptions {
  stock_id: string;
  t: string;
  tableName: "daily_skills" | "weekly_skills" | "hourly_skills";
  dealTableName: "daily_deal" | "weekly_deal" | "hourly_deal";
  indicators: Array<{ key: string; color?: string }>;
  limit: number;
  timeColumn?: string; // 時間欄位名稱，默認為 't'
  transformTime?: (t: string) => string | number; // 時間轉換函數
}

export default function useChartData({
  stock_id,
  t,
  tableName,
  dealTableName,
  indicators,
  limit,
  timeColumn = "t",
  transformTime,
}: UseChartDataOptions) {
  const { db } = useContext(DatabaseContext);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { getCachedQuery } = useQueryCache();

  // 使用 useMemo 穩定 monitor 參照
  const monitor = useMemo(() => DatabasePerformanceMonitor.getInstance(), []);

  // 使用 useMemo 穩定 indicatorFields 計算
  const indicatorFields = useMemo(() => {
    return indicators
      .map((item) =>
        item.key === "c" ||
        item.key === "o" ||
        item.key === "h" ||
        item.key === "l" ||
        item.key === "v"
          ? item.key // 成交資料欄位不需要 NULLIF
          : `NULLIF(${item.key}, 0) AS ${item.key}`
      )
      .join(", ");
  }, [indicators]);

  useEffect(() => {
    if (!stock_id || !db || !t) {
      setData([]);
      return;
    }

    setLoading(true);

    const timeValue = transformTime ? transformTime(t) : t;
    const cacheKey = `${tableName}_${stock_id}_${timeValue}_${limit}`;

    const sqlQuery = `
      SELECT ${tableName}.${timeColumn}, ${indicatorFields} 
      FROM ${tableName} 
      JOIN ${dealTableName} ON ${tableName}.${timeColumn} = ${dealTableName}.${timeColumn} 
        AND ${tableName}.stock_id = ${dealTableName}.stock_id 
      WHERE ${tableName}.stock_id = ${stock_id} 
        AND ${tableName}.${timeColumn} <= '${timeValue}' 
      ORDER BY ${tableName}.${timeColumn} DESC 
      LIMIT ${limit}
    `;

    const stopMonitoring = monitor.startQuery(sqlQuery);

    getCachedQuery(cacheKey, () => db.select(sqlQuery))
      .then((res: any) => {
        const formatData = res.reverse();
        setData(formatData);
      })
      .catch((error) => {
        console.error(`Failed to load ${tableName} chart data:`, error);
        setData([]);
      })
      .finally(() => {
        stopMonitoring();
        setLoading(false);
      });
  }, [
    stock_id,
    db,
    t,
    tableName,
    dealTableName,
    limit,
    timeColumn,
    transformTime,
    getCachedQuery,
    indicatorFields,
    monitor,
  ]);

  return { data, loading };
}
