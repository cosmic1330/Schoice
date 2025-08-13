import Database from "@tauri-apps/plugin-sql";
import { useCallback, useEffect, useState } from "react";

export default function useDatabaseDates(db: Database | null) {
  const [dates, setDates] = useState<string[]>([]);

  const fetchDates = useCallback(async () => {
    let res = (await db?.select(
      "SELECT DISTINCT t FROM daily_deal ORDER BY t DESC;"
    )) as { t: string }[];
    setDates(res?.map((item) => item.t) || []);
  }, [db]);

  useEffect(() => {
    fetchDates();
  }, [fetchDates]);

  return { dates, fetchDates };
}
