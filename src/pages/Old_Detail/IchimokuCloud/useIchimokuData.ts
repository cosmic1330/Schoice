import { useMemo } from "react";
import { UrlTaPerdOptions } from "../../../types";
// Assuming deals are passed or context is available.
// However, in Obv.tsx, context was used. Let's accept deals as argument for better separation.
import { dateFormat } from "@ch20026103/anysis";
import { Mode } from "@ch20026103/anysis/dist/esm/stockSkills/utils/dateFormat";
import cmfTool from "../../../cls_tools/cmf";
import ichimokuTool from "../../../cls_tools/ichimoku";
import macdTool from "../../../cls_tools/macd";
import {
  calculateIchimokuSignals,
  IchimokuCombinedData,
} from "./ichimokuStrategy";

// Helper to project time forward
const getNextTradingTime = (
  currentDate: Date,
  perd: UrlTaPerdOptions,
): Date => {
  const nextDate = new Date(currentDate);
  if (perd === UrlTaPerdOptions.Hour) {
    nextDate.setHours(nextDate.getHours() + 1); // Simplified for now, can copy complex logic if needed
  } else if (perd === UrlTaPerdOptions.Day) {
    nextDate.setDate(nextDate.getDate() + 1);
  } else if (perd === UrlTaPerdOptions.Week) {
    nextDate.setDate(nextDate.getDate() + 7);
  }
  return nextDate;
};

const parseTradeTime = (t: number | string, perd: UrlTaPerdOptions): Date => {
  const s = t.toString().replace(/[-: ]/g, ""); // Remove separators if present
  if (perd === UrlTaPerdOptions.Hour && s.length >= 10) {
    const year = parseInt(s.substring(0, 4));
    const month = parseInt(s.substring(4, 6)) - 1;
    const day = parseInt(s.substring(6, 8));
    const hour = parseInt(s.substring(8, 10));
    const min = parseInt(s.substring(10, 12) || "0");
    return new Date(year, month, day, hour, min);
  } else {
    // YYYYMMDD
    const year = parseInt(s.substring(0, 4));
    const month = parseInt(s.substring(4, 6)) - 1;
    const day = parseInt(s.substring(6, 8));
    return new Date(year, month, day);
  }
};

export const useIchimokuData = (
  deals: any[],
  perd: UrlTaPerdOptions,
  visibleCount: number,
  rightOffset: number,
  settings?: any, // Accept settings
) => {
  const { combinedData, signals, analysis } = useMemo(() => {
    if (!deals || deals.length < 52) {
      return {
        combinedData: [],
        signals: [],
        analysis: { steps: [], score: 0, recommendation: "Loading..." },
      };
    }

    const cmfPeriod = settings?.cmf || 21;
    const cmfEmaPeriod = settings?.cmfEma || 5;

    // 1. Calculate Indicators (Ichimoku, CMF, MACD) in one pass
    let ichimokuState = ichimokuTool.init(deals[0]);
    let macdState = macdTool.init(deals[0]);
    let cmfState = cmfTool.init(deals[0]); // CMF state initialization may need adjustment if it caches params, but usually it stores accumulation.
    // Assuming cmfTool.init doesn't depend on period, only .next does.
    // If it does, we assume defaults or re-initialization if key changes (but this runs in useMemo dependent on settings)

    // Parallel arrays for fast access if needed, or just map
    const enrichedDataTemp: any[] = [];

    deals.forEach((d, i) => {
      // Ichimoku
      if (i > 0) {
        ichimokuState = ichimokuTool.next(d, ichimokuState);
      }

      // MACD
      if (i > 0) macdState = macdTool.next(d, macdState);

      // CMF
      if (i > 0) cmfState = cmfTool.next(d, cmfState, cmfPeriod, cmfEmaPeriod);

      enrichedDataTemp.push({
        ...d,
        tenkan: ichimokuState.ichimoku.tenkan,
        kijun: ichimokuState.ichimoku.kijun,
        senkouA: ichimokuState.ichimoku.senkouA,
        senkouB: ichimokuState.ichimoku.senkouB,
        chikou: ichimokuState.ichimoku.chikou,
        osc: macdState.osc,
        cmf: cmfState.cmf,
        cmfEma5: cmfState.ema,
      });
    });
    const enrichedData = enrichedDataTemp;

    // 4. Prepare Final Data Structure (Visual Shift)
    // Standard Ichimoku logic for visualization:
    // Tenkan/Kijun/Chikou are plotted at current time.
    // Senkou A/B are plotted shifted forward 26 periods.
    // Chikou is sometimes plotted shifted backward 26 periods (but usually we just check logic).
    // In Recharts, it's easier to align everything to the same "Index".
    // Strategy logic needs "Cloud at Price T" -> which is Cloud values generated at T-26.

    // Let's create a "Chart Row" for each time T.
    // At time T:
    // - Price, Vol, CMF, MACD are from T.
    // - Cloud (Span A/B) is from T-26 calculation result.
    // - Chikou is ... tricky in Recharts. Usually we plot Chikou value of T at T-26.
    //   (i.e. at T-26 axis, we show Price(T)).
    //   (i.e. at T-26 axis, we show Price(T)).
    //   But to verify "Price vs Chikou", we comp Price(T) vs Price(T-26).
    // Let's stick to standard TradingView style:
    // Cloud projected forward.

    const chartRows: IchimokuCombinedData[] = enrichedData.map((d, i) => {
      // Cloud at this candle T comes from T-26 data
      const cloudSourceIdx = i - 26;
      const cloudSource =
        cloudSourceIdx >= 0 ? enrichedData[cloudSourceIdx] : null;

      // Chikou: At time T, we plot the Close of T+26? No, Chikou is lagged.
      // Chikou Value at T is Close(T). It is plotted at T-26.
      // So at this row i (Time T), we should see Chikou from T+26?
      // chartData[i].chikou = Close(i+26).
      const chikouSourceIdx = i + 26;
      const chikouSource =
        chikouSourceIdx < enrichedData.length
          ? enrichedData[chikouSourceIdx]
          : null;

      return {
        ...d,
        // senkouA/B here represents the cloud lines visible at this Time T
        senkouA: cloudSource ? cloudSource.senkouA : null,
        senkouB: cloudSource ? cloudSource.senkouB : null,
        // chikou here represents the line visible at this Time T (which is Price of T+26)
        chikou: chikouSource ? chikouSource.c : null,
        cmfPrev: i > 0 ? enrichedData[i - 1].cmf : null,
        cmfEma5: d.cmfEma5,
      };
    });

    // 5. Run Strategy Logic
    // signalCalc needs raw-ish data or aligned data?
    // Our calculateIchimokuSignals logic expects `senkouA/B` to be the cloud values AT CURRENT TIME.
    // Which matches our `chartRows` construction above.
    const { signals, lastAnalysis } = calculateIchimokuSignals(chartRows);

    // 6. Future Projection (26 Bars)
    // We need to extend the chart for 26 bars into future to show the Cloud Projections.
    // Future Cloud comes from the last 26 bars of Enriched Data (i = N-26 to N).
    const lastData = enrichedData[enrichedData.length - 1];
    if (lastData) {
      let currentDate = parseTradeTime(lastData.t as number, perd);

      for (let k = 1; k <= 26; k++) {
        currentDate = getNextTradingTime(currentDate, perd);
        // Cloud Source for Future T+K is T+K-26.
        // i.e. EnrichedData index = (Length-1) + k - 26.
        // if k=1 (first future bar), source = Length + 1 - 26 - 1 (since 0 indexed) = Length - 26.
        const sourceIdx = enrichedData.length - 26 + (k - 1);
        const source =
          sourceIdx < enrichedData.length ? enrichedData[sourceIdx] : null;

        let nextT: number;
        if (perd === UrlTaPerdOptions.Hour) {
          const y = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, "0");
          const day = String(currentDate.getDate()).padStart(2, "0");
          const hour = String(currentDate.getHours()).padStart(2, "0");
          const min = String(currentDate.getMinutes()).padStart(2, "0");
          nextT = parseInt(`${y}${month}${day}${hour}${min}`, 10);
        } else {
          nextT = dateFormat(
            currentDate.getTime(),
            Mode.TimeStampToNumber,
          ) as number;
        }

        chartRows.push({
          t: nextT,
          o: null,
          h: null,
          l: null,
          c: null,
          v: null,
          tenkan: null,
          kijun: null,
          senkouA: source ? source.senkouA : null,
          senkouB: source ? source.senkouB : null,
          chikou: null,
          osc: null,
          cmf: null,
          cmfPrev: null,
          cmfEma5: null,
        });
      }
    }

    return { combinedData: chartRows, signals, analysis: lastAnalysis };
  }, [deals, perd, settings]);

  const slicedData = useMemo(() => {
    if (!combinedData || combinedData.length === 0) return [];
    const start = Math.max(0, combinedData.length - visibleCount - rightOffset);
    const end = rightOffset === 0 ? undefined : -rightOffset;
    // Slice logic
    if (end)
      return combinedData.slice(start, combinedData.length - rightOffset);
    return combinedData.slice(start);
  }, [combinedData, visibleCount, rightOffset]);

  return {
    chartData: slicedData,
    signals,
    score: analysis.score,
    recommendation: analysis.recommendation,
    steps: analysis.steps,
  };
};
