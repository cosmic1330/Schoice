import { useCallback, useContext } from "react";
import { stockDailyQueryBuilder } from "../classes/StockDailyQueryBuilder";
import { stockHourlyQueryBuilder } from "../classes/StockHourlyQueryBuilder";
import { stockWeeklyQueryBuilder } from "../classes/StockWeeklyQueryBuilder";
import { DatabaseContext } from "../context/DatabaseContext";
import useSchoiceStore from "../store/Schoice.store";
import { PromptItem } from "../types";
import useDatabaseQuery from "./useDatabaseQuery";

export default function useFindStocksByPrompt() {
  const { dates, weekDates, dbType } = useContext(DatabaseContext);
  const dateIndex = useSchoiceStore((state) => state.dateIndex);
  const filterStocks = useSchoiceStore((state) => state.filterStocks);
  const weekIndex = useSchoiceStore((state) => state.weekIndex);
  const query = useDatabaseQuery();

  const getWeekDates = useCallback(() => {
    try {
      if (weekIndex < 0 || weekIndex >= weekDates.length) return [];

      // 直接從 Context 中的 weekDates 陣列切片取得最近 4 週的日期
      // weekDates 已是 DESC 排序，所以索引增加代表日期往回推
      const selectedDates = weekDates.slice(weekIndex, weekIndex + 4);

      return selectedDates.map((date) => ({ t: date }));
    } catch (error) {
      console.error("getWeekDates error", error);
      return [];
    }
  }, [weekDates, weekIndex]);

  const getHourDates = useCallback(
    async (date: string) => {
      try {
        // 針對不同資料庫類型處理日期時間格式
        // SQLite 通常使用 YYYY-MM-DD1400 或 YYYYMMDD1400
        // Postgres (雲端) 則嚴格要求 YYYY-MM-DD 14:00:00
        const num = dbType === "postgres" 
          ? `${date} 14:00:00` 
          : `${date}1400`;

        const queryHourDate = `
        SELECT DISTINCT ts
        FROM hourly_deal
        WHERE ts <= '${num}'
        ORDER BY ts DESC
        LIMIT 24;
      `;
        const hourlyDates: { ts: string }[] | undefined =
          await query(queryHourDate);
        return hourlyDates || [];
      } catch (error) {
        return [];
      }
    },
    [query, dbType],
  );

  const getPromptSqlScripts = useCallback(
    async (select: PromptItem, stockIds?: string[]) => {
      if (
        select.conditions.daily.length === 0 &&
        select.conditions.weekly.length === 0 &&
        select.conditions.hourly.length === 0
      ) {
        return [];
      }

      let dailySQL = "";
      if (select.conditions.daily.length > 0) {
        const customDailyConditions = select.conditions.daily.map((prompt) =>
          stockDailyQueryBuilder.generateExpression(prompt).join(" "),
        );
        const sqlDailyQuery = stockDailyQueryBuilder.generateSqlQuery({
          conditions: customDailyConditions,
          dates: dates.filter((_, index) => index >= dateIndex),
          stockIds,
        });
        dailySQL = sqlDailyQuery;
      }

      let weeklySQL = "";
      if (select.conditions.weekly.length > 0) {
        const customWeeklyConditions = select.conditions.weekly.map((prompt) =>
          stockWeeklyQueryBuilder.generateExpression(prompt).join(" "),
        );

        const weeklyDateResults = await getWeekDates();

        if (weeklyDateResults && weeklyDateResults.length > 0) {
          const sqlWeeklyQuery = stockWeeklyQueryBuilder.generateSqlQuery({
            conditions: customWeeklyConditions,
            dates: weeklyDateResults.map((result) => result.t),
          });
          weeklySQL = sqlWeeklyQuery;
        }
      }

      let hourlySQL = "";
      if (select.conditions.hourly?.length > 0) {
        const customHourlyConditions = select.conditions.hourly.map((prompt) =>
          stockHourlyQueryBuilder.generateExpression(prompt).join(" "),
        );
        const hourlyDateResults = await getHourDates(dates[dateIndex]);
        if (hourlyDateResults) {
          const sqlHourlyQuery = stockHourlyQueryBuilder.generateSqlQuery({
            conditions: customHourlyConditions,
            dates: hourlyDateResults.map((result) => result.ts),
            stockIds,
          });
          hourlySQL = sqlHourlyQuery;
        }
      }

      return [dailySQL, weeklySQL, hourlySQL];
    },
    [dates, dateIndex, filterStocks, getWeekDates, getHourDates, weekIndex],
  );

  const getCombinedSqlScript = useCallback((sqls: string[]) => {
    // 過濾出有效的 SQL 查詢
    const validSqls = sqls.filter((sql) => sql && sql.trim());

    // 如果只有一個有效的 SQL，直接返回
    if (validSqls.length === 1) {
      return validSqls[0];
    }

    // 如果有多個有效的 SQL，使用 INTERSECT 合併
    return validSqls.join("\nINTERSECT\n");
  }, []);

  const getOneDateDailyDataByStockId = useCallback(
    async (date: string, id: string) => {
      try {
        const sql = `SELECT * FROM daily_deal
            WHERE t='${date}' 
            AND daily_deal.stock_id = '${id}'`;
        const res = await query(sql);
        return res;
      } catch (error) {
        console.error("getStocksData error", error);
        return [];
      }
    },
    [query],
  );

  return {
    getPromptSqlScripts,
    getCombinedSqlScript,
    getOneDateDailyDataByStockId,
  };
}
