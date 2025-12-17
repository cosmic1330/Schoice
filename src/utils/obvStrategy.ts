import { TaType } from "../types";
import {
  calculateSMA,
} from "./technicalIndicators";
import obvTool from "../cls_tools/obv";

export type SignalType =
  | "LONG_ENTRY"
  | "SHORT_ENTRY"
  | "LONG_EXIT"
  | "SHORT_EXIT";

export interface ObvSignal {
  t: number;
  type: SignalType;
  reason: string;
  price: number;
}

/**
 * Helper to find local extrema
 */
const getExtrema = (
  arr: number[],
  idx: number,
  window: number,
  type: "MAX" | "MIN"
) => {
  let val = type === "MAX" ? -Infinity : Infinity;
  // Look back 'window' periods, excluding current index to find *previous* extrema
  const start = Math.max(0, idx - window);
  for (let i = start; i < idx; i++) {
    if (type === "MAX") val = Math.max(val, arr[i]);
    else val = Math.min(val, arr[i]);
  }
  return val;
};

export const calculateObvSignals = (deals: TaType[]): ObvSignal[] => {
  if (!deals || deals.length < 60) return []; // Need history for MA computations

  // 1. Calculate Core Data
  const closes = deals.map((d) => d.c);
  // OBV Calculation
  const obvValues: number[] = [];
  let obvData = obvTool.init(deals[0]);
  obvValues.push(obvData.obv);
  for (let i = 1; i < deals.length; i++) {
    obvData = obvTool.next(deals[i], obvData);
    obvValues.push(obvData.obv);
  }

  // 2. Calculate Indicators
  // Price MAs
  const ma20 = calculateSMA(closes, 20);

  // OBV MA (Signal Line)
  const obvMa20 = calculateSMA(obvValues, 20);


  const signals: ObvSignal[] = [];
  let position: "LONG" | "SHORT" | "NONE" = "NONE";

  // 3. Iterate and Find Signals
  // Start from 50 to ensure we have valid MA values
  for (let i = 50; i < deals.length; i++) {
    const d = deals[i];
    const c = d.c;
    const currObv = obvValues[i];
    const prevObv = obvValues[i - 1];

    const currObvMa = obvMa20[i]!;
    const prevObvMa = obvMa20[i - 1]!;

    const currPriceMa20 = ma20[i]!;

    // Position Status
    const isLong = position === "LONG";
    const isShort = position === "SHORT";
    const isNeutral = position === "NONE";

    // --- ENTRY LOGIC ---
    if (isNeutral) {
      let signalFound = false;
      let signalReason = "";
      let signalType: SignalType | null = null;

      // 1. OBV Golden Cross (Golden Cross)
      // Logic: OBV crosses above its MA20 AND Price is above its MA20 (Trend Confirmation)
      const obvCrossUp = prevObv < prevObvMa && currObv > currObvMa;
      if (obvCrossUp && c > currPriceMa20) {
        signalType = "LONG_ENTRY";
        signalReason = "OBV黃金交叉 (趨勢向上)";
        signalFound = true;
      }

      // 2. OBV Bullish Divergence (Bottom Divergence)
      // Logic: Price makes a new 20-day low, but OBV is higher than its 20-day low
      if (!signalFound) {
        const prevPriceLow = getExtrema(closes, i, 20, "MIN");
        const prevObvLow = getExtrema(obvValues, i, 20, "MIN");

        // Current close is lower than previous 20-day low
        if (c < prevPriceLow) {
          // BUT OBV is comfortably above its recent low (not making a new low)
          if (currObv > prevObvLow) {
            signalType = "LONG_ENTRY";
            signalReason = "量價底背離 (價破底量不破)";
            signalFound = true;
          }
        }
      }

      // 3. OBV Breakout (New High)
      // Logic: OBV makes new 20-day high AND Price makes new 20-day high
      if (!signalFound) {
        const prevObvHigh = getExtrema(obvValues, i, 20, "MAX");
        const prevPriceHigh = getExtrema(closes, i, 20, "MAX");

        if (currObv > prevObvHigh && c > prevPriceHigh) {
          signalType = "LONG_ENTRY";
          signalReason = "OBV創新高 (量價齊揚)";
          signalFound = true;
        }
      }

      // --- SHORT ENTRIES ---

      // 1. OBV Dead Cross
      if (!signalFound) {
        const obvCrossDown = prevObv > prevObvMa && currObv < currObvMa;
        if (obvCrossDown && c < currPriceMa20) {
          signalType = "SHORT_ENTRY";
          signalReason = "OBV死亡交叉 (趨勢向下)";
          signalFound = true;
        }
      }

      // 2. Bearish Divergence (Top Divergence)
      if (!signalFound) {
        const prevPriceHigh = getExtrema(closes, i, 20, "MAX");
        const prevObvHigh = getExtrema(obvValues, i, 20, "MAX");

        if (c > prevPriceHigh) {
          if (currObv < prevObvHigh) {
            signalType = "SHORT_ENTRY";
            signalReason = "量價頂背離 (價過高量不過)";
            signalFound = true;
          }
        }
      }

      // Register Entry
      if (signalFound && signalType) {
        signals.push({
          t: d.t,
          type: signalType,
          reason: signalReason,
          price: c,
        });
        position = signalType === "LONG_ENTRY" ? "LONG" : "SHORT";
      }
    }

    // --- EXIT LOGIC ---
    else if (isLong) {
      // Exit Long Logic
      // 1. OBV Dead Cross (Trend End)
      const obvCrossDown = prevObv > prevObvMa && currObv < currObvMa;
      // 2. Stop Loss / Trailing Stop (Price falls below MA20 significantly)
      const priceBreakdown = c < currPriceMa20 * 0.98;

      if (obvCrossDown || priceBreakdown) {
        signals.push({
          t: d.t,
          type: "LONG_EXIT",
          reason: obvCrossDown ? "OBV轉弱離場" : "跌破支撐離場",
          price: c,
        });
        position = "NONE";
      }
    } else if (isShort) {
      // Exit Short Logic
      // 1. OBV Golden Cross (Trend Reversal)
      const obvCrossUp = prevObv < prevObvMa && currObv > currObvMa;
      // 2. Price Reversal (Price breaks above MA20)
      const priceBreakout = c > currPriceMa20 * 1.02;

      if (obvCrossUp || priceBreakout) {
        signals.push({
          t: d.t,
          type: "SHORT_EXIT",
          reason: obvCrossUp ? "OBV轉強回補" : "突破壓力回補",
          price: c,
        });
        position = "NONE";
      }
    }
  }

  return signals;
};
