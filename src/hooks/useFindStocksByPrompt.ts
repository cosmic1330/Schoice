import { dateFormat } from "@ch20026103/anysis";
import { Mode } from "@ch20026103/anysis/dist/esm/stockSkills/utils/dateFormat";
import { useCallback, useContext } from "react";
import { stockDailyQueryBuilder } from "../classes/StockDailyQueryBuilder";
import { stockHourlyQueryBuilder } from "../classes/StockHourlyQueryBuilder";
import { stockWeeklyQueryBuilder } from "../classes/StockWeeklyQueryBuilder";
import { DatabaseContext } from "../context/DatabaseContext";
import useSchoiceStore from "../store/Schoice.store";
import { StorePrompt } from "../types";
import useDatabaseQuery from "./useDatabaseQuery";

/**
 * 統一條件格式，支援 daily/weekly/hourly
 */
export type PromptCondition = {
  type: "daily" | "weekly" | "hourly";
  prompt: StorePrompt;
};

/**
 * 查詢股票條件組合的 hook
 * 用法：
 *   const { getPromptSqlScripts, getCombinedSqlScript } = useFindStocksByPrompt();
 *   const sqls = await getPromptSqlScripts([ { type: 'weekly', prompt: ... }, ... ]);
 *   const finalSql = getCombinedSqlScript(sqls, 'INTERSECT');
 */
export default function useFindStocksByPrompt() {
  const { dates } = useContext(DatabaseContext);
  const { todayDate } = useSchoiceStore();
  const query = useDatabaseQuery();

  /**
   * 取得最近幾週的週資料日期
   */
  const getWeekDates = useCallback(
    async (date: string, count = 4) => {
      try {
        const queryWeekDate = `
          SELECT DISTINCT t
          FROM weekly_deal
          WHERE t <= "${date}"
          ORDER BY t DESC
          LIMIT 20;
        `;
        const allWeeklyDates = await query(queryWeekDate);
        if (!allWeeklyDates || allWeeklyDates.length === 0) {
          return [];
        }
        const selectedDates = [];
        const dateList = allWeeklyDates.map((item: any) => item.t);
        selectedDates.push(dateList[0]);
        let lastSelectedDate = new Date(dateList[0]);
        for (
          let i = 1;
          i < dateList.length && selectedDates.length < count;
          i++
        ) {
          const currentDate = new Date(dateList[i]);
          const daysDiff =
            (lastSelectedDate.getTime() - currentDate.getTime()) /
            (1000 * 60 * 60 * 24);
          if (daysDiff >= 6) {
            selectedDates.push(dateList[i]);
            lastSelectedDate = currentDate;
          }
        }
        return selectedDates;
      } catch (error) {
        console.error("getWeekDates error", error);
        return [];
      }
    },
    [query]
  );

  /**
   * 取得最近幾小時的時資料 timestamp
   */
  const getHourDates = useCallback(
    async (date: string, count = 6) => {
      try {
        const num = dateFormat(date, Mode.StringToNumber) * 10000 + 1400;
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
        if (!hourlyDates || hourlyDates.length === 0) return [];
        return hourlyDates.map((item) => item.ts);
      } catch (error) {
        return [];
      }
    },
    [query]
  );

  /**
   * 傳入條件陣列，產生對應 SQL 陣列
   * @param conditions PromptCondition[]
   * @param stockIds 可選，限制股票 id
   */
  const getPromptSqlScripts = useCallback(
    async (conditions: PromptCondition[], stockIds?: string[]) => {
      const sqls: string[] = [];
      for (const cond of conditions) {
        if (cond.type === "daily") {
          const expr = stockDailyQueryBuilder.generateExpression(cond.prompt);
          const sql = stockDailyQueryBuilder.generateSqlQuery({
            conditions: [expr],
            dates: dates.filter((_, index) => index >= todayDate),
            stockIds,
          });
          sqls.push(sql);
        } else if (cond.type === "weekly") {
          const expr = stockWeeklyQueryBuilder.generateExpression(cond.prompt);
          const weekDates = await getWeekDates(dates[todayDate], 4);
          if (weekDates.length > 0) {
            const sql = stockWeeklyQueryBuilder.generateSqlQuery({
              conditions: [expr],
              dates: [weekDates[0]],
              weeksRange: 1,
            });
            sqls.push(sql);
          }
        } else if (cond.type === "hourly") {
          const expr = stockHourlyQueryBuilder.generateExpression(cond.prompt);
          const hourDates = await getHourDates(dates[todayDate], 6);
          if (hourDates.length > 0) {
            const sql = stockHourlyQueryBuilder.generateSqlQuery({
              conditions: [expr],
              dates: [hourDates[0]],
              stockIds,
              hoursRange: 1,
            });
            sqls.push(sql);
          }
        }
      }
      return sqls;
    },
    [dates, todayDate, getWeekDates, getHourDates]
  );

  /**
   * 組合多個 SQL 查詢
   * @param sqls SQL 陣列
   * @param combineType 'INTERSECT' | 'UNION'
   */
  const getCombinedSqlScript = useCallback(
    (sqls: string[], combineType: "INTERSECT" | "UNION" = "INTERSECT") => {
      const validSqls = sqls.filter((sql) => sql && sql.trim());
      if (validSqls.length === 1) return validSqls[0];
      if (combineType === "INTERSECT") return validSqls.join("\nINTERSECT\n");
      if (combineType === "UNION") return validSqls.join("\nUNION\n");
      return validSqls.join("\nINTERSECT\n");
    },
    []
  );

  /**
   * 查詢單一股票單一天的日資料
   */
  const getOneDateDailyDataByStockId = useCallback(
    async (date: string, id: string) => {
      try {
        const sql = `SELECT * FROM daily_deal WHERE t="${date}" AND daily_deal.stock_id = '${id}'`;
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
    getPromptSqlScripts, // (conditions: PromptCondition[], stockIds?) => Promise<string[]>
    getCombinedSqlScript, // (sqls: string[], combineType?) => string
    getOneDateDailyDataByStockId,
  };
}
