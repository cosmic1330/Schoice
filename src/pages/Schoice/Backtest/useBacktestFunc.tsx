import { dateFormat } from "@ch20026103/anysis";
import { StockType } from "@ch20026103/anysis/dist/esm/stockSkills/types";
import { Mode } from "@ch20026103/anysis/dist/esm/stockSkills/utils/dateFormat";
import { useCallback, useContext, useRef } from "react";
import { stockDailyQueryBuilder } from "../../../classes/StockDailyQueryBuilder";
import { stockHourlyQueryBuilder } from "../../../classes/StockHourlyQueryBuilder";
import { stockWeeklyQueryBuilder } from "../../../classes/StockWeeklyQueryBuilder";
import { DatabaseContext } from "../../../context/DatabaseContext";
import useDatabaseQuery from "../../../hooks/useDatabaseQuery";
import { PromptItem } from "../../../types";

export enum BacktestType {
  Buy = "buy",
  Sell = "sell",
}

export default function useBacktestFunc() {
  const { dates } = useContext(DatabaseContext);
  const data_memory = useRef<{
    date?: number;
    data?: { [stock_id: string]: StockType };
  }>({ date: undefined, data: {} });
  const buy_memory = useRef<string[] | null>(null);
  const sell_memory = useRef<string[] | null>(null);
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

  const get = useCallback(
    async (
      stockId: string,
      date: number,
      inWait: boolean | undefined,
      { select, type }: { select: PromptItem; type: BacktestType }
    ): Promise<StockType | null> => {
      try {
        if (!select) throw new Error("select is null");
        if (
          select.value.daily.length === 0 &&
          select.value.weekly.length === 0 &&
          select.value.hourly.length === 0
        ) {
          throw new Error("No conditions provided");
        }
        const date_index = dates.findIndex(
          (d) => d === dateFormat(date, Mode.NumberToString)
        );
        if (date_index === -1) {
          throw new Error(`Date not found in dates array: ${date}`);
        }

        // 已取得對應資料
        if (
          data_memory.current.date === date &&
          buy_memory.current &&
          type === BacktestType.Buy &&
          (buy_memory.current.includes(stockId) || inWait)
        ) {
          const data = data_memory.current.data;
          if (data && data[stockId]) {
            return data[stockId];
          }
        } else if (
          data_memory.current.date === date &&
          sell_memory.current &&
          type === BacktestType.Sell &&
          (sell_memory.current.includes(stockId) || inWait)
        ) {
          const data = data_memory.current.data;
          if (data && data[stockId]) {
            return data[stockId];
          }
        }

        // 缺少資料，重新查詢
        if (data_memory.current.date !== date) {
          const sql = `SELECT * FROM daily_deal WHERE t="${dateFormat(
            date,
            Mode.NumberToString
          )}"`;
          const stocks_data = await query(sql);
          if (stocks_data) {
            const data = stocks_data.reduce((acc, cur) => {
              acc[cur.stock_id] = cur;
              return acc;
            }, {} as { [stock_id: string]: { stock_id: string } });
            data_memory.current = { date, data };
            sell_memory.current = null;
            buy_memory.current = null;
          } else {
            data_memory.current = { date, data: {} }; // 保證 data 不為 undefined
            sell_memory.current = null;
            buy_memory.current = null;
          }
        }

        // 如果類型還未取得符合條件的股票
        if (
          (type === BacktestType.Buy && buy_memory.current === null) ||
          (type === BacktestType.Sell && sell_memory.current === null)
        ) {
          let dailySQL = "";
          if (select.value.daily.length > 0) {
            const customDailyConditions = select.value.daily.map((prompt) =>
              stockDailyQueryBuilder.generateExpression(prompt).join(" ")
            );
            const sqlDailyQuery = stockDailyQueryBuilder.generateSqlQuery({
              conditions: customDailyConditions,
              dates: dates.filter((_, index) => index >= date_index),
            });
            dailySQL = sqlDailyQuery;
          }

          let weeklySQL = "";
          if (select.value.weekly.length > 0) {
            const customWeeklyConditions = select.value.weekly.map((prompt) =>
              stockWeeklyQueryBuilder.generateExpression(prompt).join(" ")
            );
            const weeklyDateResults = await getWeekDates(dates[date_index]);
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
            const hourlyDateResults = await getHourDates(dates[date_index]);
            if (hourlyDateResults) {
              const sqlHourlyQuery = stockHourlyQueryBuilder.generateSqlQuery({
                conditions: customHourlyConditions,
                dates: hourlyDateResults.map((result) => result.ts),
              });
              hourlySQL = sqlHourlyQuery;
            }
          }

          // 合併查詢
          const combinedSQL = [dailySQL, weeklySQL, hourlySQL]
            .filter((sql) => sql)
            .join("\nINTERSECT\n");
          const res: { stock_id: string }[] | undefined = await query(
            combinedSQL
          );
          if (res) {
            const ids = res.map((item) => item.stock_id);
            const memory = type === BacktestType.Buy ? buy_memory : sell_memory;
            memory.current = ids;
            if (ids.includes(stockId)) {
              return data_memory.current.data?.[stockId] as StockType;
            }
            throw new Error(
              `Stock ID ${stockId} not found in the filtered results`
            );
          }
          throw new Error("No results found for the given conditions");
        }
        throw new Error(
          `No data found for the given stockId: ${stockId} in date: ${date}`
        );
      } catch (error) {
        return null;
      }
    },
    [dates, query, data_memory.current]
  );

  return get;
}
