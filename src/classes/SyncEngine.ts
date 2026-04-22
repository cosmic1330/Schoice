import {
  Boll,
  Cmf,
  dateFormat,
  Dmi,
  Ema,
  Ichimoku,
  Kd,
  Ma,
  Macd,
  Mfi,
  Obv,
  ObvEma,
  Rsi,
} from "@ch20026103/anysis";
import { Mode } from "@ch20026103/anysis/dist/esm/stockSkills/utils/dateFormat";
import { emit, listen } from "@tauri-apps/api/event";
import { error, info } from "@tauri-apps/plugin-log";
import useSyncDashboardStore, {
  HealthStatus,
} from "../store/SyncDashboard.store";
import { fetchStockExtData, fetchStockProfile } from "../tools/stockScraper";
import {
  DealTableOptions,
  DealTableType,
  SkillsTableOptions,
  SkillsTableType,
  StockTableType,
  TaListType,
  TimeSharingDealTableOptions,
  TimeSharingSkillsTableOptions,
  UrlTaPerdOptions,
  UrlType,
} from "../types";
import {
  analyzeIndicatorsData,
  IndicatorsDateTimeType,
} from "../utils/analyzeIndicatorsData";
import generateDealDataDownloadUrl from "../utils/generateDealDataDownloadUrl";
import {
  fetchWithLog as fetch,
  getCoolDownRemainingMillis,
} from "../utils/logFetch";
import SyncDatabaseHelper from "./SyncDatabaseHelper";

/**
 * TokenBucket - Simple rate limiter to ensure smooth request flow.
 */
class TokenBucket {
  private tokens: number;
  private lastFill: number;
  private readonly capacity: number;
  private readonly fillRate: number; // tokens per ms

  constructor(capacity: number, fillRatePerSecond: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.fillRate = fillRatePerSecond / 1000;
    this.lastFill = Date.now();
  }

  async consume(tokens: number = 1): Promise<void> {
    while (this.tokens < tokens) {
      this.refill();
      if (this.tokens < tokens) {
        const waitTime = (tokens - this.tokens) / this.fillRate;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
    this.tokens -= tokens;
  }

  private refill() {
    const now = Date.now();
    const elapsed = now - this.lastFill;
    this.tokens = Math.min(
      this.capacity,
      this.tokens + elapsed * this.fillRate,
    );
    this.lastFill = now;
  }
}

/**
 * yieldControl - Helper to release the main thread to UI tasks.
 */
const yieldControl = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * SyncEngine - The Orchestrator for data synchronization.
 */
export default class SyncEngine {
  private static instance: SyncEngine;
  private dbHelper: SyncDatabaseHelper | null = null;
  private limiter = new TokenBucket(15, 5); // 稍微放寬限制以支持 batch=3 的併發感
  private abortController: AbortController | null = null;
  private isRunning = false;

  private constructor() {}

  public static getInstance(): SyncEngine {
    if (!SyncEngine.instance) {
      SyncEngine.instance = new SyncEngine();
    }
    return SyncEngine.instance;
  }

  public setDbHelper(helper: SyncDatabaseHelper) {
    this.dbHelper = helper;
  }

  public hasDbHelper(): boolean {
    return !!this.dbHelper;
  }

  private async broadcast(
    type: "status" | "logs" | "stats" | "health" | "total",
    payload: any,
  ) {
    const store = useSyncDashboardStore.getState();

    // 1. Update local store (Synchronous feedback for the current window)
    switch (type) {
      case "status":
        store.setSyncStatus(payload);
        await emit("sync:status_change", payload);
        break;
      case "logs":
        store.addSyncLog(payload);
        await emit("sync:log_added", payload);
        break;
      case "stats":
        store.setSyncStats(payload);
        await emit("sync:stats_update", payload);
        break;
      case "health":
        store.updateHealthMap(payload);
        await emit("sync:health_map_update", payload);
        break;
      case "total":
        store.setTotalCount(payload);
        await emit("sync:total_count_update", payload);
        break;
    }
  }

  public async setupCommandListeners() {
    const unlistens = await Promise.all([
      listen<{ menu: StockTableType[]; dates: string[]; forceExtData?: boolean }>(
        "sync:command_start",
        (event) => {
          this.start(event.payload.menu, event.payload.dates, event.payload.forceExtData || false);
        },
      ),
      listen("sync:command_stop", () => {
        this.stop();
      }),
    ]);

    return () => {
      unlistens.forEach((unlisten) => unlisten());
    };
  }

  /**
   * Start the full synchronization process.
   */
  public async start(menu: StockTableType[], dates: string[], forceExtData: boolean = false) {
    console.log("[SyncEngine] Attempting to start sync...", {
      isRunning: this.isRunning,
      hasDbHelper: !!this.dbHelper,
      menuSize: menu?.length,
      datesSize: dates?.length,
    });

    if (this.isRunning) {
      console.warn("[SyncEngine] Sync is already running.");
      return;
    }
    if (!this.dbHelper) {
      console.error("[SyncEngine] Cannot start sync: dbHelper is null.");
      this.broadcast("logs", {
        msg: "Sync failed: Database not initialized. Please try restarting.",
        type: "error",
      });
      return;
    }
    this.isRunning = true;
    this.abortController = new AbortController();

    this.broadcast("status", "scanning");
    this.broadcast("logs", {
      msg: "Starting market-wide health scan...",
      type: "info",
    });

    // 0. Cleanup bad dates
    await this.dbHelper.cleanupBadDates();

    try {
      // 1. Scan DB Health
      const snapshot = await this.dbHelper.getHealthSnapshot();
      const healthMap: Record<string, HealthStatus> = {};
      const today =
        dates[0] ||
        String(dateFormat(new Date().getTime(), Mode.TimeStampToNumber));

      menu.forEach((stock) => {
        const info = snapshot[stock.stock_id];
        if (!info) {
          healthMap[stock.stock_id] = "missing";
        } else if (info.last_date < today || !info.has_ext_data || forceExtData) {
          healthMap[stock.stock_id] = "stale";
        } else {
          healthMap[stock.stock_id] = "fresh";
        }
      });

      this.broadcast("health", healthMap);
      this.broadcast("logs", {
        msg: `Scan complete. Found ${Object.values(healthMap).filter((v) => v !== "fresh").length} items needing update.`,
        type: "success",
      });

      // 2. Filter work list
      const workList = menu.filter((s) => healthMap[s.stock_id] !== "fresh");
      this.broadcast("total", workList.length); // Update total to be the actual work scope

      if (workList.length === 0) {
        this.broadcast("status", "success");
        this.broadcast("logs", {
          msg: "Data is already up to date.",
          type: "success",
        });
        this.isRunning = false;
        return;
      }

      this.broadcast("status", "syncing");
      let completed = 0;
      const startTime = Date.now();

      // 3. Process in batches of 3 with random 1-4 minute security delay
      for (let i = 0; i < workList.length; i += 3) {
        if (this.abortController?.signal.aborted) break;

        const batch = workList.slice(i, i + 3);

        // Run batch concurrently
        await Promise.all(
          batch.map(async (stock) => {
            let retryCount = 0;
            let success = false;

            while (!success && retryCount < 3) {
              await this.waitForCoolDown();
              if (this.abortController?.signal.aborted) return;

              try {
                this.broadcast("health", { [stock.stock_id]: "syncing" });
                await this.syncStock(stock, forceExtData);

                completed++;
                this.broadcast("health", { [stock.stock_id]: "fresh" });
                success = true;
              } catch (e: any) {
                const errorMsg = String(e);
                if (
                  getCoolDownRemainingMillis() > 0 ||
                  errorMsg.includes("[BLOCK]")
                ) {
                  await this.waitForCoolDown();
                  continue;
                }
                error(`Failed to sync ${stock.stock_id}: ${errorMsg}`);
                this.broadcast("health", { [stock.stock_id]: "error" });
                success = true;
                completed++; // Count as completed even if failed to keep progress moving
              }
            }
          }),
        );

        // Update stats after batch
        const elapsed = Date.now() - startTime;
        const rpm =
          completed > 0 ? Math.round(completed / (elapsed / 60000)) : 0;
        const remainingTime =
          completed > 0
            ? Math.round(
                ((elapsed / completed) * (workList.length - completed)) / 1000,
              )
            : 0;

        this.broadcast("stats", {
          completed,
          rpm,
          remainingTime: this.formatRemaining(remainingTime),
        });

        // Small polite delay (500ms-1500ms) between batches to maintain stability
        await new Promise((resolve) =>
          setTimeout(resolve, 500 + Math.random() * 1000),
        );
        await yieldControl();
      }

      if (!this.abortController?.signal.aborted) {
        this.broadcast("status", "success");
        this.broadcast("logs", {
          msg: "Task completed successfully! 🎉",
          type: "success",
        });
      }
    } catch (e) {
      error(`SyncEngine error: ${e}`);
      this.broadcast("status", "error");
    } finally {
      this.isRunning = false;
    }
  }

  public stop() {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.isRunning = false;
    this.broadcast("status", "stopped");
    this.broadcast("logs", {
      msg: "Synchronization stopped by user.",
      type: "wait",
    });
  }

  private async syncStock(stock: StockTableType, forceExtData: boolean = false) {
    if (!this.dbHelper) return;

    // A. Check for partial data (market hours check)
    const snapshot = await this.dbHelper.getHealthSnapshot(stock.stock_id);
    const snap = snapshot[stock.stock_id];

    const preFetchTime = localStorage.getItem(
      `schoice:fetch:time:${stock.stock_id}`,
    );

    const today = String(
      dateFormat(new Date().getTime(), Mode.TimeStampToNumber),
    );
    const preFetchDate = preFetchTime
      ? String(
          dateFormat(new Date(preFetchTime).getTime(), Mode.TimeStampToNumber),
        )
      : null;

    const now = new Date();
    const isMarketClosedToday = () => {
      const hours = now.getHours();
      const minutes = now.getMinutes();
      // 台灣市場 1:30 PM 收盤，1:45 PM 後資料通常已結算完成
      return hours > 13 || (hours === 13 && minutes >= 45);
    };

    const wasLastFetchFinal = () => {
      if (!preFetchTime) return false;
      const lastFetch = new Date(preFetchTime);
      const h = lastFetch.getHours();
      const m = lastFetch.getMinutes();
      // 如果上次同步是在 13:45 之後，視為已獲得最終數據
      return h > 13 || (h === 13 && m >= 45);
    };

    // Calculate thisWeekMonday
    const d = new Date(now);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const thisWeekMonday = `${yyyy}${mm}${dd}`;

    const isHourlyComplete = snap && snap.hourly_last_date && snap.hourly_last_date.substring(0, 8) === today;
    const isWeeklyComplete = snap && snap.weekly_last_date && snap.weekly_last_date >= thisWeekMonday;

    const isTaDataFresh = snap && snap.last_date >= today && isHourlyComplete && isWeeklyComplete;

    // 如果今天已經同步過且所有資料 (基本面、小時線、週線) 都齊全
    if (!forceExtData && snap && snap.last_date >= today && preFetchDate === today && snap.has_ext_data && isHourlyComplete && isWeeklyComplete) {
      if (isMarketClosedToday()) {
        // 現在已收盤：只有當上次同步也是收盤後進行的，才跳過
        if (wasLastFetchFinal()) {
          this.broadcast("logs", {
            msg: `[Skip] ${stock.stock_id} final data already in DB and extData is complete.`,
            type: "info",
          });
          return;
        }
        // 否則（上次是盤中），現在收盤了，必須強制跑一次以獲取最終資料
      } else {
        // 現在是盤中或開盤前
        // 如果上次同步也是今天，且在 1 小時內，則跳過以免頻繁存取
        const lastSyncTs = preFetchTime ? new Date(preFetchTime).getTime() : 0;
        if (Date.now() - lastSyncTs < 3600000) {
          // 1 小時緩衝
          return;
        }
      }
    }

    // B. Fetch Data (with Rate Limiting)
    await this.limiter.consume(1); // One token per stock process

    const skipTaFetch = forceExtData;
    if (skipTaFetch) {
      this.broadcast("logs", {
        msg: `[Force] ${stock.stock_id} forcing extData. Skipping TA fetched already.`,
        type: "info",
      });
    }

    const [daily, weekly, hourly, profile, extData] = await Promise.allSettled([
      skipTaFetch ? Promise.resolve(null as any) : this.fetchData(stock, UrlTaPerdOptions.Day),
      skipTaFetch ? Promise.resolve(null as any) : this.fetchData(stock, UrlTaPerdOptions.Week),
      skipTaFetch ? Promise.resolve(null as any) : this.fetchData(stock, UrlTaPerdOptions.Hour),
      fetchStockProfile(stock.stock_id),
      fetchStockExtData(stock.stock_id), // New detailed fetcher
    ]);

    // C. Update Profile & Fundamentals
    let dbShares: number | undefined;
    if (this.dbHelper) {
      const dbStock = await this.dbHelper.getStockInfo(stock.stock_id);
      dbShares = dbStock?.issued_shares;
    }

    if (profile.status === "fulfilled" && profile.value?.issued_shares) {
      stock.issued_shares = profile.value.issued_shares;
    } else if (dbShares) {
      stock.issued_shares = dbShares;
    }
    
    // [CRITICAL] Always ensure stock exists in local DB before saving relations
    // This prevents Foreign Key constraint failures for new stocks.
    await this.dbHelper.saveStock(stock);

    if (extData.status === "fulfilled" && extData.value) {
      const { metrics, fundamentals, positions } = extData.value;
      let count = 0;
      
      // Validation: Object should have more than just stock_id to be worth saving
      const hasData = (obj: any) => obj && Object.keys(obj).length > 1;

      if (hasData(metrics)) {
        await this.dbHelper.saveFinancialMetrics(metrics);
        count++;
      }
      if (hasData(fundamentals)) {
        await this.dbHelper.saveRecentFundamentals(fundamentals);
        count++;
      }
      if (hasData(positions)) {
        await this.dbHelper.saveInvestorPositions(positions);
        count++;
      }
      
      if (count > 0) {
        this.broadcast("logs", {
          msg: `[Sync] Saved ext data for ${stock.stock_id} (${count}/3 fields)`,
          type: "info",
        });
      }
      info(`[Sync] Saved ext data for ${stock.stock_id}: metrics:${!!metrics}, fund:${!!fundamentals}, pos:${!!positions}`);
    } else {
      this.broadcast("logs", {
        msg: `[Warning] Ext data fetch failed for ${stock.stock_id}`,
        type: "warning",
      });
    }

    // D. Process TA Data (Intersectional check logic is internal to processTA/dbHelper)
    if (daily.status === "fulfilled" && daily.value) {
      await this.processTA(
        stock,
        daily.value.data,
        DealTableOptions.DailyDeal,
        SkillsTableOptions.DailySkills,
        daily.value.perd,
      );
    }
    if (weekly.status === "fulfilled" && weekly.value) {
      await this.processTA(
        stock,
        weekly.value.data,
        DealTableOptions.WeeklyDeal,
        SkillsTableOptions.WeeklySkills,
        weekly.value.perd,
      );
    }
    if (hourly.status === "fulfilled" && hourly.value) {
      await this.processHourly(stock, hourly.value.data);
    }

    localStorage.setItem(
      `schoice:fetch:time:${stock.stock_id}`,
      new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }),
    );
  }

  private isMarketOpenNow() {
    const now = new Date();
    const day = now.getDay(); // 0 是週日, 6 是週六
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // 週末絕對不是開盤中
    if (day === 0 || day === 6) return false;

    // 平日 00:00 ~ 13:45 視為資料尚未定型的盤中時段 (包含開盤前)
    return hours < 13 || (hours === 13 && minutes < 45);
  }

  private isWeekFinalizedNow() {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // 週六(6)、週日(0) 肯定已經定盤
    if (day === 0 || day === 6) return true;

    // 週五(5) 13:45 之後定盤
    if (day === 5) {
      return hours > 13 || (hours === 13 && minutes >= 45);
    }

    // 週一到週四，本週絕對還沒定型
    return false;
  }

  private getThisWeekMonday(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    // 取得本週一的日期。getDay() 為 0 代表週日，調整為 -6 以取得上週一
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return String(dateFormat(d.getTime(), Mode.TimeStampToNumber));
  }

  private async fetchData(stock: StockTableType, perd: UrlTaPerdOptions) {
    const url = generateDealDataDownloadUrl({
      type: UrlType.Indicators,
      id: stock.stock_id,
      perd,
    });
    const response = await fetch(url, {
      method: "GET",
      signal: this.abortController?.signal,
    });
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    const text = await response.text();
    const ta = analyzeIndicatorsData(
      text,
      perd === UrlTaPerdOptions.Hour
        ? IndicatorsDateTimeType.DateTime
        : IndicatorsDateTimeType.Date,
    );
    // [v10] Ensure we return the timeframe option alongside data for correct filtering
    return { data: ta, perd };
  }

  private async processTA(
    stock: StockTableType,
    ta: TaListType,
    dealTable: DealTableOptions,
    skillTable: SkillsTableOptions,
    perd: UrlTaPerdOptions,
  ) {
    if (!this.dbHelper || ta.length === 0) return;

    const now = new Date();
    const today = String(dateFormat(now.getTime(), Mode.TimeStampToNumber));
    const marketOpen = this.isMarketOpenNow();
    const weekFinalized = this.isWeekFinalizedNow();

    // Check missing dates (Corrected: Use specific tables for lookup)
    const existing = await this.dbHelper.getStockDates(
      stock.stock_id,
      dealTable,
      skillTable,
    );

    // Logic:
    // 1. Missing dates in DB
    // 2. Any date >= the 5th most recent date in DB (Safe buffer)
    // 3. [STRICT] Intraday Write Prevention
    let thresholdT = "";
    const bufferSize = perd === UrlTaPerdOptions.Week ? 5 : 3;

    if (existing.size > 0) {
      const sortedExisting = Array.from(existing).sort();
      thresholdT =
        sortedExisting.length >= bufferSize
          ? sortedExisting[sortedExisting.length - bufferSize]
          : sortedExisting[0];
    }

    const missing = ta.filter((item) => {
      const tStr = String(item.t);

      // Strict Intraday Filter
      if (perd === UrlTaPerdOptions.Day) {
        if (marketOpen && tStr === today) return false;
      } else if (perd === UrlTaPerdOptions.Week) {
        const thisWeekMonday = this.getThisWeekMonday(now);
        if (tStr >= thisWeekMonday && !weekFinalized) {
          // 如果該資料日期屬於「本週」，且本週尚未定盤 (未過週五 13:45)，跳過
          return false;
        }
      }

      return !existing.has(tStr) || (thresholdT !== "" && tStr >= thresholdT);
    });

    if (missing.length === 0) return;

    info(
      `[Sync] ${stock.stock_id} (${perd}) processing ${missing.length} records. MarketOpen=${marketOpen}, WeekFinalized=${weekFinalized}`,
    );

    // [Cleanup] For Weekly data, physically delete records in the buffer range to remove ghost duplicates
    if (perd === UrlTaPerdOptions.Week && thresholdT !== "") {
      await this.dbHelper.deleteRecordsFromDate(
        stock.stock_id,
        thresholdT,
        dealTable,
        skillTable,
      );
    }

    // Calculate Indicators (Simplified for brevity, following original logic patterns)
    // In a real implementation, we'd use the full anysis calculators here
    const { deals, skills } = await this.calculateIndicators(
      stock,
      ta,
      missing.map((m) => String(m.t)),
    );

    await this.dbHelper.saveDeals(deals, dealTable);
    await this.dbHelper.saveSkills(skills, skillTable);
  }

  private async processHourly(stock: StockTableType, ta: TaListType) {
    if (!this.dbHelper || ta.length === 0) return;

    const now = new Date();
    const today = String(dateFormat(now.getTime(), Mode.TimeStampToNumber));
    const marketOpen = this.isMarketOpenNow();

    const existing = await this.dbHelper.getStockHourlyTimestamps(
      stock.stock_id,
    );
    let thresholdTs = "";
    if (existing.size > 0) {
      const sortedExisting = Array.from(existing).sort();
      thresholdTs =
        sortedExisting.length >= 3
          ? sortedExisting[sortedExisting.length - 3]
          : sortedExisting[0];
    }

    const missing = ta.filter((item) => {
      const tStr = String(item.t);

      // Strict Intraday Filter for Hourly
      if (marketOpen && tStr.startsWith(today)) return false;

      return !existing.has(tStr) || (thresholdTs !== "" && tStr >= thresholdTs);
    });
    if (missing.length === 0) return;

    const { deals, skills } = await this.calculateHourlyIndicators(
      stock,
      ta,
      missing.map((m) => String(m.t)),
    );
    await this.dbHelper.saveTimeSharingDeals(
      deals,
      TimeSharingDealTableOptions.HourlyDeal,
    );
    await this.dbHelper.saveTimeSharingSkills(
      skills,
      TimeSharingSkillsTableOptions.HourlySkills,
    );
  }

  // --- Support methods for calculation (Internalized logic from SqliteDataManager) ---

  private async calculateIndicators(
    stock: StockTableType,
    ta: TaListType,
    missingDates: string[],
  ) {
    const deals: DealTableType[] = [];
    const skills: SkillsTableType[] = [];
    const missingSet = new Set(missingDates);

    // Initialize Calculators
    const boll = new Boll();
    const ma = new Ma();
    const ema = new Ema();
    const macd = new Macd();
    const kd = new Kd();
    const rsi = new Rsi();
    const obv = new Obv();
    const obvEma = new ObvEma();
    const mfi = new Mfi();
    const ichimoku = new Ichimoku();
    const dmi = new Dmi();
    const cmf = new Cmf();

    let state: any = {
      ma5: ma.init(ta[0], 5),
      ma10: ma.init(ta[0], 10),
      ma20: ma.init(ta[0], 20),
      ma30: ma.init(ta[0], 30),
      ma50: ma.init(ta[0], 50),
      ma60: ma.init(ta[0], 60),
      ma120: ma.init(ta[0], 120),
      ma240: ma.init(ta[0], 240),
      ema5: ema.init(ta[0], 5),
      ema10: ema.init(ta[0], 10),
      ema20: ema.init(ta[0], 20),
      ema60: ema.init(ta[0], 60),
      ema120: ema.init(ta[0], 120),
      boll: boll.init(ta[0]),
      macd: macd.init(ta[0]),
      kd: kd.init(ta[0], 9),
      rsi5: rsi.init(ta[0], 5),
      rsi10: rsi.init(ta[0], 10),
      obv: obv.init(ta[0]),
      obv_ma5: obvEma.init(obv.init(ta[0]).obv, 5),
      obv_ma10: obvEma.init(obv.init(ta[0]).obv, 10),
      obv_ma20: obvEma.init(obv.init(ta[0]).obv, 20),
      obv_ma60: obvEma.init(obv.init(ta[0]).obv, 60),
      mfi: mfi.init(ta[0], 14),
      ichimoku: ichimoku.init(ta[0]),
      dmi: dmi.init(ta[0], 14),
      cmf: cmf.init(ta[0]),
    };

    for (let i = 0; i < ta.length; i++) {
      const val = ta[i];
      const tStr = String(val.t);

      if (i % 50 === 0) await yieldControl();

      if (i > 0) {
        state.ma5 = ma.next(val, state.ma5, 5);
        state.ma10 = ma.next(val, state.ma10, 10);
        state.ma20 = ma.next(val, state.ma20, 20);
        state.ma30 = ma.next(val, state.ma30, 30);
        state.ma50 = ma.next(val, state.ma50, 50);
        state.ma60 = ma.next(val, state.ma60, 60);
        state.ma120 = ma.next(val, state.ma120, 120);
        state.ma240 = ma.next(val, state.ma240, 240);
        state.ema5 = ema.next(val, state.ema5, 5);
        state.ema10 = ema.next(val, state.ema10, 10);
        state.ema20 = ema.next(val, state.ema20, 20);
        state.ema60 = ema.next(val, state.ema60, 60);
        state.ema120 = ema.next(val, state.ema120, 120);
        state.boll = boll.next(val, state.boll, 20);
        state.macd = macd.next(val, state.macd);
        state.kd = kd.next(val, state.kd, 9);
        state.rsi5 = rsi.next(val, state.rsi5, 5);
        state.rsi10 = rsi.next(val, state.rsi10, 10);
        state.obv = obv.next(val, state.obv);
        state.obv_ma5 = obvEma.next(state.obv.obv, state.obv_ma5, 5);
        state.obv_ma10 = obvEma.next(state.obv.obv, state.obv_ma10, 10);
        state.obv_ma20 = obvEma.next(state.obv.obv, state.obv_ma20, 20);
        state.obv_ma60 = obvEma.next(state.obv.obv, state.obv_ma60, 60);
        state.mfi = mfi.next(val, state.mfi, 14);
        state.ichimoku = ichimoku.next(val, state.ichimoku);
        state.dmi = dmi.next(val, state.dmi, 14);
        state.cmf = cmf.next(val, state.cmf, 21, 5);
      }

      if (missingSet.has(tStr)) {
        deals.push({ stock_id: stock.stock_id, ...val, t: tStr });
        skills.push({
          stock_id: stock.stock_id,
          t: tStr,
          ma5: state.ma5.ma,
          ma5_ded: state.ma5.exclusionValue["d-1"],
          ma10: state.ma10.ma,
          ma10_ded: state.ma10.exclusionValue["d-1"],
          ma20: state.ma20.ma,
          ma20_ded: state.ma20.exclusionValue["d-1"],
          ma30: state.ma30.ma,
          ma30_ded: state.ma30.exclusionValue["d-1"],
          ma50: state.ma50.ma,
          ma50_ded: state.ma50.exclusionValue["d-1"],
          ma60: state.ma60.ma,
          ma60_ded: state.ma60.exclusionValue["d-1"],
          ma120: state.ma120.ma,
          ma120_ded: state.ma120.exclusionValue["d-1"],
          ma240: state.ma240.ma,
          ma240_ded: state.ma240.exclusionValue["d-1"],
          ema5: state.ema5.ema,
          ema10: state.ema10.ema,
          ema20: state.ema20.ema,
          ema60: state.ema60.ema,
          ema120: state.ema120.ema,
          macd: state.macd.macd,
          dif: state.macd.dif[state.macd.dif.length - 1] || 0,
          osc: state.macd.osc,
          k: state.kd.k,
          d: state.kd.d,
          j: state.kd.j,
          rsi5: state.rsi5.rsi,
          rsi10: state.rsi10.rsi,
          bollUb: state.boll.bollUb,
          bollMa: state.boll.bollMa,
          bollLb: state.boll.bollLb,
          obv: state.obv.obv,
          obv_ma5: state.obv_ma5.ma,
          obv_ma10: state.obv_ma10.ma,
          obv_ma20: state.obv_ma20.ma,
          obv_ma60: state.obv_ma60.ma,
          obv_ema5: state.obv_ma5.ema,
          obv_ema10: state.obv_ma10.ema,
          obv_ema20: state.obv_ma20.ema,
          obv_ema60: state.obv_ma60.ema,
          mfi: state.mfi.mfi,
          tenkan: state.ichimoku.ichimoku.tenkan,
          kijun: state.ichimoku.ichimoku.kijun,
          senkouA: state.ichimoku.ichimoku.senkouA,
          senkouB: state.ichimoku.ichimoku.senkouB,
          chikou: state.ichimoku.ichimoku.chikou,
          di_plus: state.dmi.pDi,
          di_minus: state.dmi.mDi,
          adx: state.dmi.adx,
          cmf: state.cmf.cmf,
          cmf_ema5: state.cmf.ema,
          turnover_rate: stock.issued_shares
            ? ((val.v * 1000) / stock.issued_shares) * 100
            : 0,
        });
      }
    }

    return { deals, skills };
  }

  private async calculateHourlyIndicators(
    stock: StockTableType,
    ta: TaListType,
    missingTs: string[],
  ) {
    // Similar to calculateIndicators but for hourly data
    // For brevity, using the same pattern but mapping to TimeSharing types
    const { deals, skills } = await this.calculateIndicators(
      stock,
      ta,
      missingTs,
    );
    return {
      deals: deals.map((d) => ({ ...d, ts: d.t })),
      skills: skills.map((s) => ({ ...s, ts: s.t })),
    } as any;
  }

  private async waitForCoolDown() {
    let remaining = getCoolDownRemainingMillis();
    while (remaining > 0) {
      if (this.abortController?.signal.aborted) return;

      const sec = Math.ceil(remaining / 1000);
      this.broadcast("status", "cooling"); // 暫時切換狀態為 cooling
      this.broadcast("logs", {
        msg: `[安全冷卻中] 剩餘解鎖時間：${sec} 秒...`,
        type: "wait",
      });

      await new Promise((resolve) => setTimeout(resolve, 5000)); // 每 5 秒檢查一次
      remaining = getCoolDownRemainingMillis();
    }

    // [優化] 只有第一個醒來的任務負責廣播恢復訊息，避免重複顯示
    const store = useSyncDashboardStore.getState();
    if (store.syncStatus === "cooling") {
      this.broadcast("status", "syncing"); // 恢復為 syncing
      this.broadcast("logs", {
        msg: `冷卻結束，恢復同步任務。`,
        type: "success",
      });
    }
  }

  private formatRemaining(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":");
  }
}
