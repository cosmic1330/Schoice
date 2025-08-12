import { useCallback, useContext } from "react";
import { PromptItem } from "../types";
import { stockDailyQueryBuilder } from "../classes/StockDailyQueryBuilder";
import { stockWeeklyQueryBuilder } from "../classes/StockWeeklyQueryBuilder";
import { stockHourlyQueryBuilder } from "../classes/StockHourlyQueryBuilder";
import { dateFormat } from "@ch20026103/anysis";
import { Mode } from "@ch20026103/anysis/dist/esm/stockSkills/utils/dateFormat";
import useDatabaseQuery from "./useDatabaseQuery";
import useSchoiceStore from "../store/Schoice.store";
import { DatabaseContext } from "../context/DatabaseContext";

export default function useFindStocksByPrompt() {
  const { dates } = useContext(DatabaseContext);
  const { todayDate, filterStocks } = useSchoiceStore();
  const query = useDatabaseQuery();

  const getWeekDates = useCallback(
    async (date: string) => {
      try {
        const queryWeekDate = `
        WITH RECURSIVE dates AS (
          SELECT t
          FROM weekly_deal
          WHERE t <= "${date}"
          GROUP BY t
          ORDER BY t DESC
          LIMIT 4
        )
        SELECT t FROM dates
        ORDER BY t DESC;
      `;
        const weeklyDates = await query(queryWeekDate);
        return weeklyDates;
      } catch (error) {
        return [];
      }
    },
    [query]
  );

  const getHourDates = useCallback(
    async (date: string) => {
      try {
        const num = dateFormat(date, Mode.StringToNumber) * 10000 + 1400;
        // 取得明天的timestamp
        const queryHourDate = `
        SELECT DISTINCT ts
        FROM hourly_deal
        WHERE ts <= ${num}
        ORDER BY ts DESC
        LIMIT 24;
      `;
        const hourlyDates: { ts: number }[] | undefined = await query(
          queryHourDate
        );
        return hourlyDates || [];
      } catch (error) {
        return [];
      }
    },
    [query]
  );

  const getPromptSqlScripts = useCallback(
    async (select: PromptItem, stockIds?: string[]) => {
      if (
        select.value.daily.length === 0 &&
        select.value.weekly.length === 0 &&
        select.value.hourly.length === 0
      ) {
        return [];
      }

      let dailySQL = "";
      if (select.value.daily.length > 0) {
        const customDailyConditions = select.value.daily.map((prompt) =>
          stockDailyQueryBuilder.generateExpression(prompt).join(" ")
        );
        const sqlDailyQuery = stockDailyQueryBuilder.generateSqlQuery({
          conditions: customDailyConditions,
          dates: dates.filter((_, index) => index >= todayDate),
          stockIds,
        });
        dailySQL = sqlDailyQuery;
      }

      let weeklySQL = "";
      if (select.value.weekly.length > 0) {
        const customWeeklyConditions = select.value.weekly.map((prompt) =>
          stockWeeklyQueryBuilder.generateExpression(prompt).join(" ")
        );
        const weeklyDateResults = await getWeekDates(dates[todayDate]);
        if (weeklyDateResults) {
          const sqlWeeklyQuery = stockWeeklyQueryBuilder.generateSqlQuery({
            conditions: customWeeklyConditions,
            dates: weeklyDateResults.map((result) => result.t), // 直接傳入查詢到的週資料日期
            weeksRange: weeklyDateResults.length,
          });
          weeklySQL = sqlWeeklyQuery;
        }
      }

      let hourlySQL = "";
      if (select.value.hourly?.length > 0) {
        const customHourlyConditions = select.value.hourly.map((prompt) =>
          stockHourlyQueryBuilder.generateExpression(prompt).join(" ")
        );
        const hourlyDateResults = await getHourDates(dates[todayDate]);
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
    [dates, todayDate, filterStocks, getWeekDates, getHourDates]
  );

  const getCombinedSqlScript = useCallback((sqls: string[]) => {
    // 合併查詢
    return sqls.filter((sql) => sql).join("\nINTERSECT\n");
  }, []);

  const getStocksData = useCallback(
    async (date: string, ids: string[]) => {
      try {
        const sql = `SELECT * FROM daily_deal 
            JOIN fundamental ON daily_deal.stock_id = fundamental.stock_id 
            JOIN stock ON daily_deal.stock_id = stock.id 
            WHERE t="${date}" 
            AND daily_deal.stock_id IN ('${ids.join("','")}')`;
        const res = await query(sql);
        return res;
      } catch (error) {
        console.error("getStocksData error", error);
      }
    },
    [query]
  );

  return {
    getPromptSqlScripts,
    getCombinedSqlScript,
    getStocksData,
  };
}
