import { useCallback, useContext } from "react";
import { stockDailyQueryBuilder } from "../classes/StockDailyQueryBuilder";
import { stockHourlyQueryBuilder } from "../classes/StockHourlyQueryBuilder";
import { stockWeeklyQueryBuilder } from "../classes/StockWeeklyQueryBuilder";
import { DatabaseContext } from "../context/DatabaseContext";
import useSchoiceStore from "../store/Schoice.store";
import { PromptItem } from "../types";
import useDatabaseQuery from "./useDatabaseQuery";

export default function useFindStocksByPrompt() {
  const { dates } = useContext(DatabaseContext);
  const { todayDate, filterStocks } = useSchoiceStore();
  const query = useDatabaseQuery();

  const getWeekDates = useCallback(
    async (date: string) => {
      try {
        // 查詢週線數據的實際日期，按照週的間隔來選取
        const queryWeekDate = `
        SELECT DISTINCT t
        FROM weekly_deal
        WHERE t <= '${date}'
        ORDER BY t DESC
        LIMIT 20;
      `;
        const allWeeklyDates = await query(queryWeekDate);

        if (!allWeeklyDates || allWeeklyDates.length === 0) {
          return [];
        }

        // 從所有週線日期中選取符合週間隔的日期
        // 通常週線數據是每週五或每週最後交易日，間隔約7天
        const selectedDates = [];
        const dates = allWeeklyDates.map((item: any) => item.t);

        selectedDates.push(dates[0]); // 最近的一週

        let lastSelectedDate = new Date(dates[0]);
        for (let i = 1; i < dates.length && selectedDates.length < 4; i++) {
          const currentDate = new Date(dates[i]);
          const daysDiff =
            (lastSelectedDate.getTime() - currentDate.getTime()) /
            (1000 * 60 * 60 * 24);

          // 如果日期間隔大於等於6天，認為是不同的週
          if (daysDiff >= 6) {
            selectedDates.push(dates[i]);
            lastSelectedDate = currentDate;
          }
        }

        return selectedDates.map((date) => ({ t: date }));
      } catch (error) {
        console.error("getWeekDates error", error);
        return [];
      }
    },
    [query]
  );

  const getHourDates = useCallback(
    async (date: string) => {
      try {
        const num = `${date} 14:00:00`;
        // 取得明天的timestamp
        const queryHourDate = `
        SELECT DISTINCT ts
        FROM hourly_deal
        WHERE ts <= '${num}'
        ORDER BY ts DESC
        LIMIT 24;
      `;
        const hourlyDates: { ts: string }[] | undefined = await query(
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
        select.conditions.daily.length === 0 &&
        select.conditions.weekly.length === 0 &&
        select.conditions.hourly.length === 0
      ) {
        return [];
      }

      let dailySQL = "";
      if (select.conditions.daily.length > 0) {
        const customDailyConditions = select.conditions.daily.map((prompt) =>
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
      if (select.conditions.weekly.length > 0) {
        const customWeeklyConditions = select.conditions.weekly.map((prompt) =>
          stockWeeklyQueryBuilder.generateExpression(prompt).join(" ")
        );

        const weeklyDateResults = await getWeekDates(dates[todayDate]);

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
    [query]
  );

  return {
    getPromptSqlScripts,
    getCombinedSqlScript,
    getOneDateDailyDataByStockId,
  };
}
