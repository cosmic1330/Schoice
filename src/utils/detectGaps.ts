import { TaListType, TaType } from "../types";

/**
 * 跳空缺口類型
 */
export enum GapType {
  UP = "up", // 向上跳空
  DOWN = "down", // 向下跳空
}

/**
 * 跳空缺口資料結構
 */
export interface Gap {
  /** 缺口發生日期 */
  date: number;
  /** 缺口類型：向上或向下 */
  type: GapType;
  /** 缺口大小（絕對值） */
  size: number;
  /** 缺口大小百分比 */
  sizePercent: number;
  /** 缺口最高價 */
  high: number;
  /** 缺口最低價 */
  low: number;
  /** 前一日收盤價 */
  previousClose: number;
  /** 當日開盤價 */
  currentOpen: number;
  /** 前一日最高價 */
  previousHigh: number;
  /** 當日最低價 */
  currentLow: number;
}

/**
 * 檢測跳空缺口
 * @param deals 股票交易資料陣列（按時間順序排序）
 * @param minGapPercent 最小缺口百分比閾值（預設 0.5%）
 * @returns 缺口陣列
 */
export function detectGaps(
  deals: TaListType,
  minGapPercent: number = 0.5
): Gap[] {
  if (!deals || deals.length < 2) {
    return [];
  }

  const gaps: Gap[] = [];

  for (let i = 1; i < deals.length; i++) {
    const previous = deals[i - 1];
    const current = deals[i];

    // 確保數據有效性
    if (
      !previous ||
      !current ||
      typeof previous.h !== "number" ||
      typeof previous.l !== "number" ||
      typeof current.h !== "number" ||
      typeof current.l !== "number" ||
      typeof previous.c !== "number"
    ) {
      continue;
    }

    // 檢查向上跳空：當日最低價 > 前一日最高價
    if (current.l > previous.h) {
      const gapSize = current.l - previous.h;
      const gapSizePercent = (gapSize / previous.c) * 100;

      // 額外檢查：確保這真的是一個跳空（不是數據錯誤）
      if (gapSizePercent >= minGapPercent && gapSize > 0.01) {
        // 至少 0.01 的價差
        console.log(
          `檢測到向上跳空: ${current.t}, 前日高:${previous.h}, 當日低:${current.l}, 缺口:${gapSize}`
        );
        gaps.push({
          date: current.t,
          type: GapType.UP,
          size: gapSize,
          sizePercent: gapSizePercent,
          high: current.l, // 缺口的最高價是當日最低價
          low: previous.h, // 缺口的最低價是前一日最高價
          previousClose: previous.c,
          currentOpen: current.o,
          previousHigh: previous.h,
          currentLow: current.l,
        });
      }
    }
    // 檢查向下跳空：當日最高價 < 前一日最低價
    else if (current.h < previous.l) {
      const gapSize = previous.l - current.h;
      const gapSizePercent = (gapSize / previous.c) * 100;

      // 額外檢查：確保這真的是一個跳空（不是數據錯誤）
      if (gapSizePercent >= minGapPercent && gapSize > 0.01) {
        // 至少 0.01 的價差
        console.log(
          `檢測到向下跳空: ${current.t}, 前日低:${previous.l}, 當日高:${current.h}, 缺口:${gapSize}`
        );
        gaps.push({
          date: current.t,
          type: GapType.DOWN,
          size: gapSize,
          sizePercent: gapSizePercent,
          high: previous.l, // 缺口的最高價是前一日最低價
          low: current.h, // 缺口的最低價是當日最高價
          previousClose: previous.c,
          currentOpen: current.o,
          previousHigh: previous.h,
          currentLow: current.l,
        });
      }
    }
  }

  console.log(`總共檢測到 ${gaps.length} 個缺口`);
  return gaps;
}

/**
 * 檢測缺口是否已被回補
 * @param gap 缺口資料
 * @param subsequentDeals 缺口發生後的交易資料
 * @returns 是否已回補和回補日期
 */
export function isGapFilled(
  gap: Gap,
  subsequentDeals: TaListType
): { filled: boolean; fillDate?: number } {
  for (const deal of subsequentDeals) {
    // 對於向上跳空，如果後續價格觸及缺口區間則視為回補
    if (gap.type === GapType.UP && deal.l <= gap.low) {
      return { filled: true, fillDate: deal.t };
    }
    // 對於向下跳空，如果後續價格觸及缺口區間則視為回補
    if (gap.type === GapType.DOWN && deal.h >= gap.high) {
      return { filled: true, fillDate: deal.t };
    }
  }
  return { filled: false };
}

/**
 * 取得最近的跳空缺口
 * @param deals 股票交易資料陣列
 * @param count 要取得的缺口數量（預設 5）
 * @param minGapPercent 最小缺口百分比閾值（預設 0.5%）
 * @returns 最近的缺口陣列
 */
export function getRecentGaps(
  deals: TaListType,
  count: number = 5,
  minGapPercent: number = 0.5
): Gap[] {
  const gaps = detectGaps(deals, minGapPercent);
  return gaps.slice(-count);
}

/**
 * 依照缺口大小排序
 * @param gaps 缺口陣列
 * @param ascending 是否升序排列（預設 false，即降序）
 * @returns 排序後的缺口陣列
 */
export function sortGapsBySize(gaps: Gap[], ascending: boolean = false): Gap[] {
  return [...gaps].sort((a, b) =>
    ascending ? a.sizePercent - b.sizePercent : b.sizePercent - a.sizePercent
  );
}
