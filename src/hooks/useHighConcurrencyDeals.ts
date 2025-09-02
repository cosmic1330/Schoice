import { dateFormat } from "@ch20026103/anysis";
import { Mode } from "@ch20026103/anysis/dist/esm/stockSkills/utils/dateFormat";
import { fetch } from "@tauri-apps/plugin-http";
import { error, info } from "@tauri-apps/plugin-log";
import pLimit from "p-limit";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import SqliteDataManager from "../classes/SqliteDataManager";
import { DatabaseContext } from "../context/DatabaseContext";
import useSchoiceStore from "../store/Schoice.store";
import { getStore } from "../store/Setting.store";
import {
  DealTableOptions,
  SkillsTableOptions,
  StockTableType,
  TaType,
  TimeSharingDealTableOptions,
  TimeSharingSkillsTableOptions,
  UrlTaPerdOptions,
  UrlType,
} from "../types";
import analyzeIndicatorsData, {
  IndicatorsDateTimeType,
} from "../utils/analyzeIndicatorsData";
import checkTimeRange from "../utils/checkTimeRange";
import generateDealDataDownloadUrl from "../utils/generateDealDataDownloadUrl";

export enum Status {
  Download = "Download",
  Idle = "Idle",
}

export default function useHighConcurrencyDeals() {
  const [status, setStatus] = useState(Status.Idle);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { db, fetchDates, dates } = useContext(DatabaseContext);
  const { changeDataCount, changeUpdateProgress } = useSchoiceStore();
  const [menu, setMenu] = useState<StockTableType[]>([]);

  // 通用重試函式
  async function withRetry<T>(fn: () => Promise<T>, retries = 5): Promise<T> {
    let lastError;
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        // 若是被取消則直接丟出
        if (err instanceof Error && err.message === "Cancel") throw err;
        if (i < retries - 1) {
          await new Promise((res) => setTimeout(res, 700)); // 可調整重試間隔
        }
      }
    }
    throw lastError;
  }

  const getIndicatorFetch = useCallback(
    async (
      signal: AbortSignal,
      stock: StockTableType,
      perd: UrlTaPerdOptions
    ): Promise<TaType> => {
      return withRetry(async () => {
        try {
          const response = await fetch(
            generateDealDataDownloadUrl({
              type: UrlType.Indicators,
              id: stock.stock_id,
              perd,
            }),
            {
              method: "GET",
              signal,
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36",
              },
            }
          );
          if (!response.ok) {
            throw new Error(
              `getIndicatorFetch: ${perd} error! status: ${response.status}`
            );
          }
          const text = await response.text();
          const taData = analyzeIndicatorsData(
            text,
            perd === UrlTaPerdOptions.Hour
              ? IndicatorsDateTimeType.DateTime
              : IndicatorsDateTimeType.Date
          );
          if (!taData || taData.length === 0) {
            throw new Error(`getIndicatorFetch: ${perd} no data!`);
          }
          return taData;
        } catch (error: any) {
          console.log(error);
          if (error?.message?.indexOf("Request canceled") !== -1) {
            throw new Error("Cancel");
          }
          throw error;
        }
      });
    },
    []
  );

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    sessionStorage.setItem("schoice:update:stop", "true");
    setStatus(Status.Idle);
    info("Update stopped");
  }, [abortControllerRef.current]);

  const run = useCallback(async () => {
    if (status !== Status.Idle) return;
    // case pre:取消之前的請求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (sessionStorage.getItem("schoice:update:stop") === "true") {
      sessionStorage.removeItem("schoice:update:stop");
    }
    setStatus(Status.Download);
    if (!db) {
      error("Database not initialized");
      return;
    }

    // case 1-1: 移除大於第二筆日期的資料(刪除最後一筆資料)
    const sqliteDataManager = new SqliteDataManager(db);

    // case 1-2: 為新的請求創建一個新的 AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const { signal } = abortController;

    if (menu.length === 0) {
      info("Menu is empty, fetching from Cloud Store...");
      return;
    }

    // 取得設定
    const reverse = localStorage.getItem("schoice:fetch:reverse");
    const previousDownloaded = localStorage.getItem(
      "schoice:update:downloaded"
    );
    // date[0] 為現在日期
    if (
      previousDownloaded &&
      dates[0] === dateFormat(new Date().getTime(), Mode.TimeStampToString)
    ) {
      info(`Previous downloaded stock ID: ${previousDownloaded}`);
      const index = menu.findIndex(
        (stock) => stock.stock_id === previousDownloaded
      );
      if (reverse === "false") {
        menu.splice(0, index + 1);
      } else {
        menu.splice(index + 1, menu.length - index - 1);
      }
    }
    const limit = pLimit(5);

    // case 1-3: 反轉資料
    if (reverse === "false") {
      menu.reverse();
      localStorage.setItem("schoice:fetch:reverse", "true");
      info("Reverse menu");
    } else {
      localStorage.setItem("schoice:fetch:reverse", "false");
      info("No reverse menu");
    }

    const workMenu = [...menu];
    console.log(
      "run start, workMenu length:",
      workMenu.length,
      "previousDownloaded:",
      previousDownloaded
    );

    for (let i = 0; i < workMenu.length; i++) {
      const stock = workMenu[i];
      console.log("processing", i + 1, "/", workMenu.length, stock.stock_id);

      // 檢查是否手動停止
      if (sessionStorage.getItem("schoice:update:stop") === "true") {
        break;
      }

      // 上次是在盤中請求則刪除前筆資料
      const preFetchTime = localStorage.getItem(
        `schoice:fetch:time:${stock.stock_id}`
      );
      const isInTime = checkTimeRange(preFetchTime);
      if (isInTime || !preFetchTime) {
        info(
          `Delete latest daily deal for stock ${stock.stock_id} ${stock.stock_name}: ${dates[1]}`
        );
        await sqliteDataManager.deleteLatestDailyDeal({
          stock_id: stock.stock_id,
          t: dates[1],
        });
      }
      // 上次不是在盤中請求且請求日期等於今天
      else if (
        !isInTime &&
        preFetchTime &&
        preFetchTime.split(",")[0] ===
          new Date()
            .toLocaleString("en-US", {
              timeZone: "Asia/Taipei",
            })
            .split(",")[0]
      ) {
        continue; // 跳過今天的請求
      }

      // 隨機等待
      const delay = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
      console.log(
        `等待 ${delay}ms 後請求 ${stock.stock_id} ${stock.stock_name}...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));

      // case 1-4: 寫入股票代號資料
      try {
        sqliteDataManager.saveStockTable(stock);
      } catch (error) {}

      // case 1-4: 寫入交易資料與基本面資料
      try {
        const [daily, weekly, hourly] = await Promise.allSettled([
          limit(() => getIndicatorFetch(signal, stock, UrlTaPerdOptions.Day)),
          limit(() => getIndicatorFetch(signal, stock, UrlTaPerdOptions.Week)),
          limit(() => getIndicatorFetch(signal, stock, UrlTaPerdOptions.Hour)),
        ]);
        if (
          daily.status === "rejected" &&
          weekly.status === "rejected" &&
          hourly.status === "rejected"
        ) {
          throw new Error("All fetch failed");
        }

        // 紀錄請求時間
        const taiwanTime = new Date().toLocaleString("en-US", {
          timeZone: "Asia/Taipei",
        });
        localStorage.setItem(
          `schoice:fetch:time:${stock.stock_id}`,
          taiwanTime
        );

        // daily
        if (daily.status === "fulfilled") {
          const dailyData = daily.value as TaType;

          const daily_date = dailyData.map((item) =>
            dateFormat(item.t, Mode.NumberToString)
          );
          const sqlite_daily_deal = await sqliteDataManager.getStockDates(
            stock,
            DealTableOptions.DailyDeal
          );
          const sqlite_daily_deal_date_set = new Set(
            sqlite_daily_deal.map((item) => item.t)
          );
          const sqlite_daily_skills = await sqliteDataManager.getStockDates(
            stock,
            SkillsTableOptions.DailySkills
          );
          const sqlite_daily_skills_date_set = new Set(
            sqlite_daily_skills.map((item) => item.t)
          );
          const lose_daily_deal_set = new Set(
            daily_date.filter((item) => !sqlite_daily_deal_date_set.has(item))
          );
          const lose_daily_skills_set = new Set(
            daily_date.filter((item) => !sqlite_daily_skills_date_set.has(item))
          );

          if (lose_daily_deal_set.size > 0 || lose_daily_skills_set.size > 0) {
            sqliteDataManager.processor(
              dailyData,
              stock,
              {
                dealType: DealTableOptions.DailyDeal,
                skillsType: SkillsTableOptions.DailySkills,
              },
              {
                lose_deal_set: lose_daily_deal_set,
                lose_skills_set: lose_daily_skills_set,
              }
            );
          }
        }

        // weekly
        if (weekly.status === "fulfilled") {
          const weeklyData = weekly.value as TaType;
          const weekly_date = weeklyData.map((item) =>
            dateFormat(item.t, Mode.NumberToString)
          );
          const sqlite_weekly_deal = await sqliteDataManager.getStockDates(
            stock,
            DealTableOptions.WeeklyDeal
          );
          const sqlite_weekly_deal_date_set = new Set(
            sqlite_weekly_deal.map((item) => item.t)
          );
          const sqlite_weekly_skills = await sqliteDataManager.getStockDates(
            stock,
            SkillsTableOptions.WeeklySkills
          );
          const sqlite_weekly_skills_date_set = new Set(
            sqlite_weekly_skills.map((item) => item.t)
          );
          const lose_weekly_deal_set = new Set(
            weekly_date.filter((item) => !sqlite_weekly_deal_date_set.has(item))
          );
          const lose_weekly_skills_set = new Set(
            weekly_date.filter(
              (item) => !sqlite_weekly_skills_date_set.has(item)
            )
          );

          if (
            lose_weekly_deal_set.size > 0 ||
            lose_weekly_skills_set.size > 0
          ) {
            sqliteDataManager.processor(
              weeklyData,
              stock,
              {
                dealType: DealTableOptions.WeeklyDeal,
                skillsType: SkillsTableOptions.WeeklySkills,
              },
              {
                lose_deal_set: lose_weekly_deal_set,
                lose_skills_set: lose_weekly_skills_set,
              }
            );
          }
        }
        // hourly
        if (hourly.status === "fulfilled") {
          const hourlyData = hourly.value as TaType;
          const hourly_date = hourlyData.map((item) => item.t);
          const sqlite_hourly_deal =
            await sqliteDataManager.getStockTimeSharing(
              stock,
              TimeSharingDealTableOptions.HourlyDeal
            );
          const sqlite_hourly_deal_date_set = new Set(
            sqlite_hourly_deal.map((item) => item.ts)
          );
          const sqlite_hourly_skills =
            await sqliteDataManager.getStockTimeSharing(
              stock,
              TimeSharingSkillsTableOptions.HourlySkills
            );
          const sqlite_hourly_skills_date_set = new Set(
            sqlite_hourly_skills.map((item) => item.ts)
          );
          const lose_hourly_deal_set = new Set(
            hourly_date.filter((item) => !sqlite_hourly_deal_date_set.has(item))
          );
          const lose_hourly_skills_set = new Set(
            hourly_date.filter(
              (item) => !sqlite_hourly_skills_date_set.has(item)
            )
          );
          if (
            lose_hourly_deal_set.size > 0 ||
            lose_hourly_skills_set.size > 0
          ) {
            sqliteDataManager.timeSharingProcessor(
              hourlyData,
              stock,
              {
                dealType: TimeSharingDealTableOptions.HourlyDeal,
                skillsType: TimeSharingSkillsTableOptions.HourlySkills,
              },
              {
                lose_deal_set: lose_hourly_deal_set,
                lose_skills_set: lose_hourly_skills_set,
              }
            );
          }
        }
      } catch (e) {
        error(
          `Error fetching data for stock ${stock.stock_id} ${stock.stock_name}: ${e}`
        );
      }
      changeUpdateProgress(i + 1);
      localStorage.setItem("schoice:update:downloaded", stock.stock_id);
    }

    toast.success("Update Success ! 🎉");
    if (fetchDates) fetchDates();
    sqliteDataManager.getLatestDailyDealCount().then((result) => {
      changeDataCount(result.count);
      changeUpdateProgress(0);
    });

    setStatus(Status.Idle);
  }, [db, status, dates, fetchDates, menu]);

  useEffect(() => {
    getStore().then((store) => {
      store.get("menu").then((menu) => {
        const menuList = menu as StockTableType[];
        setMenu(menuList);
      });
    });
  }, []);

  return { run, stop, status };
}
