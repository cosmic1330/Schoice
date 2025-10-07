import { useMemo } from "react";
import { TaListType } from "../types";
import {
  detectGaps,
  getRecentGaps,
  isGapFilled,
  sortGapsBySize,
} from "../utils/detectGaps";

/**
 * 使用跳空缺口檢測的 Hook
 * @param deals 股票交易資料
 * @param minGapPercent 最小缺口百分比閾值
 * @returns 缺口相關資料和操作函數
 */
export function useGapDetection(
  deals: TaListType,
  minGapPercent: number = 0.5
) {
  const gaps = useMemo(() => {
    return detectGaps(deals, minGapPercent);
  }, [deals, minGapPercent]);

  const recentGaps = useMemo(() => {
    return getRecentGaps(deals, 10, minGapPercent);
  }, [deals, minGapPercent]);

  const largestGaps = useMemo(() => {
    return sortGapsBySize(gaps, false).slice(0, 10);
  }, [gaps]);

  const upGaps = useMemo(() => {
    return gaps.filter((gap) => gap.type === "up");
  }, [gaps]);

  const downGaps = useMemo(() => {
    return gaps.filter((gap) => gap.type === "down");
  }, [gaps]);

  // 檢查缺口回補狀態
  const gapsWithFillStatus = useMemo(() => {
    return gaps.map((gap) => {
      const gapIndex = deals.findIndex((deal) => deal.t === gap.date);
      const subsequentDeals = deals.slice(gapIndex + 1);
      const fillStatus = isGapFilled(gap, subsequentDeals);

      return {
        ...gap,
        ...fillStatus,
      };
    });
  }, [gaps, deals]);

  const unfilledGaps = useMemo(() => {
    return gapsWithFillStatus.filter((gap) => !gap.filled);
  }, [gapsWithFillStatus]);

  return {
    /** 所有檢測到的缺口 */
    gaps,
    /** 最近的缺口 */
    recentGaps,
    /** 最大的缺口（按百分比排序） */
    largestGaps,
    /** 向上跳空缺口 */
    upGaps,
    /** 向下跳空缺口 */
    downGaps,
    /** 包含回補狀態的缺口 */
    gapsWithFillStatus,
    /** 未回補的缺口 */
    unfilledGaps,
    /** 缺口總數 */
    totalGaps: gaps.length,
    /** 向上缺口數量 */
    upGapsCount: upGaps.length,
    /** 向下缺口數量 */
    downGapsCount: downGaps.length,
    /** 未回補缺口數量 */
    unfilledGapsCount: unfilledGaps.length,
  };
}
