import { DealTableType, FutureIds, TickDealsType } from "../types";

/**
 * 判斷當前是否為台股交易時段 (09:00 - 13:30)
 */
const zonedParts = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "0";
  return { day: value("weekday"), hour: Number(value("hour")), minute: Number(value("minute")) };
};
const weekday = (day: string) => day !== "Sat" && day !== "Sun";
const atOrAfter = (hour: number, minute: number, targetHour: number, targetMinute: number) => hour > targetHour || (hour === targetHour && minute >= targetMinute);
const before = (hour: number, minute: number, targetHour: number, targetMinute: number) => hour < targetHour || (hour === targetHour && minute < targetMinute);

/** Regular sessions only; exchange holidays are not covered. */
export const isTaiwanMarketOpen = (date = new Date()): boolean => {
  const now = zonedParts(date, "Asia/Taipei");
  return weekday(now.day) && atOrAfter(now.hour, now.minute, 9, 0) && before(now.hour, now.minute, 13, 30);
};

/**
 * 判斷當前是否為台指期交易時段 (08:45 - 13:45, 15:00 - 05:00)
 */
export const isWtxMarketOpen = (date = new Date()): boolean => {
  const now = zonedParts(date, "Asia/Taipei");
  const { hour: hours, minute: minutes } = now;
  const day = now.day;

  // 周六 05:00 到周一 08:45 休市 (簡單處理)
  if (day === "Sat" && hours >= 5) return false;
  if (day === "Sun") return false;
  if (day === "Mon" && !atOrAfter(hours, minutes, 8, 45)) return false;

  // 日盤 08:45 - 13:45
  if (hours === 8 && minutes >= 45) return true;
  if (hours >= 9 && hours < 13) return true;
  if (hours === 13 && minutes < 45) return true;

  // 夜盤 15:00 - 05:00
  if (hours >= 15) return true;
  if (hours < 5) return true;

  return false;
};

/**
 * 判斷當前是否為美股交易時段 (夏令 21:30 - 04:00, 冬令 22:30 - 05:00)
 * 這裡簡化判斷，主要用於控制刷新頻率
 */
export const isNasdaqMarketOpen = (date = new Date()): boolean => {
  const now = zonedParts(date, "America/New_York");
  return weekday(now.day) && atOrAfter(now.hour, now.minute, 9, 30) && before(now.hour, now.minute, 16, 0);
};

/**
 * 解析 Yahoo Finance 的 Tick 資料結構
 */
export const parseYahooTickData = (
  jsonStr: string,
  id: FutureIds,
): TickDealsType | null => {
  try {
    const data = JSON.parse(jsonStr);
    const chartData = data[0]?.chart;
    if (!chartData) return null;

    const indicators = chartData.indicators.quote[0];
    const quote = chartData.quote;
    const rawCloses = indicators.close;
    const rawTimestamps = chartData.timestamp || [];
    const rawHighs = indicators.high;

    // 同步過濾 null 值
    const closes: number[] = [];
    const timestamps: number[] = [];
    const filteredHighs: number[] = [];

    rawCloses.forEach((c: number | null, i: number) => {
      if (
        c !== null &&
        rawTimestamps[i] !== undefined &&
        rawHighs[i] !== null
      ) {
        closes.push(c);
        timestamps.push(rawTimestamps[i]);
        filteredHighs.push(rawHighs[i]);
      }
    });

    // 計算均價
    let pre = 0;
    const avgPrices = filteredHighs.map((h: number, i: number) => {
      pre += h;
      return pre / (i + 1);
    });

    return {
      id,
      ts: quote.refreshedTs,
      price: quote.price,
      avgPrices,
      changePercent: quote.changePercent,
      closes,
      previousClose: quote.previousClose,
      timestamps,
      volume: quote.volume,
    };
  } catch (e) {
    console.error(`[marketUtils] Error parsing yahoo tick data for ${id}:`, e);
    return null;
  }
};

/**
 * 解析 Yahoo Finance 的 Hourly (K線) 資料結構
 */
export const parseYahooHourlyData = (jsonStr: string) => {
  try {
    const data = JSON.parse(jsonStr);
    const chartData = data[0]?.chart;
    if (!chartData) return null;

    const indicators = chartData.indicators.quote[0];
    const opens = indicators.open;
    const closes = indicators.close;
    const highs = indicators.high;
    const lows = indicators.low;
    const volumes = indicators.volume;
    const ts = chartData.timestamp;
    const quote = chartData.quote;

    const res: (Omit<DealTableType, "stock_id" | "t"> & { t: number })[] = [];
    for (let i = 0; i < opens.length; i++) {
      if (opens[i] !== null) {
        res.push({
          t: ts[i],
          o: opens[i],
          c: closes[i],
          h: highs[i],
          l: lows[i],
          v: volumes[i],
        });
      }
    }

    return { data: res, change: quote.change, price: quote.price };
  } catch (e) {
    console.error(`[marketUtils] Error parsing yahoo hourly data:`, e);
    return null;
  }
};
