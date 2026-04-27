import ma from "../../../cls_tools/ma";
import obvTool from "../../../cls_tools/obv";
import { TaType } from "../../../types";

export type SignalType =
  | "FAKE_BREAKOUT" // A. 假突破
  | "OBV_DIVERGENCE_ENTRY" // B. OBV 底背離進場 (v2.3)
  | "ACCUMULATION" // C. 吸籌
  | "EXIT_WEAKNESS" // D. 轉弱
  | "STOP_LOSS"; // D. 止損

export interface ObvSignal {
  t: number;
  type: SignalType;
  reason: string;
  price: number;
}

/**
 * Helper to find local extrema (Exclusive of current index)
 */
const getExtrema = (
  arr: number[],
  idx: number,
  window: number,
  type: "MAX" | "MIN",
) => {
  let val = type === "MAX" ? -Infinity : Infinity;
  const start = Math.max(0, idx - window);
  for (let i = start; i < idx; i++) {
    if (type === "MAX") val = Math.max(val, arr[i]);
    else val = Math.min(val, arr[i]);
  }
  return val;
};

/**
 * Robust Higher Low check for OBV
 */
const checkObvHigherLow = (obvValues: number[], idx: number) => {
  const findSwingLow = (arr: number[], endIdx: number, limit: number) => {
    for (let i = endIdx - 2; i > endIdx - limit; i--) {
      if (i < 2) break;
      if (arr[i] < arr[i - 1] && arr[i] < arr[i + 1]) {
        return { val: arr[i], idx: i };
      }
    }
    return null;
  };

  const currentLow = findSwingLow(obvValues, idx, 10);
  if (!currentLow) return false;

  const previousLow = findSwingLow(obvValues, currentLow.idx, 30);
  if (!previousLow) return false;

  return currentLow.val > previousLow.val;
};

export const calculateObvSignals = (deals: TaType[]): ObvSignal[] => {
  if (!deals || deals.length < 60) return [];

  // 1. Calculate Core Data
  const obvValues: number[] = [];
  const ma60Values: (number | null)[] = [];
  const ma20Values: (number | null)[] = []; // Price 20MA
  const obvMa20Values: (number | null)[] = [];
  const volMa20Values: (number | null)[] = [];

  let obvState = obvTool.init(deals[0]);
  let ma60State = ma.init(deals[0], 60);
  let ma20State = ma.init(deals[0], 20);
  let volMa20State = ma.init({ c: deals[0].v } as any, 20);

  // Collect Data
  for (let i = 0; i < deals.length; i++) {
    if (i > 0) obvState = obvTool.next(deals[i], obvState);
    obvValues.push(obvState.obv);

    if (i > 0) ma60State = ma.next(deals[i], ma60State, 60);
    ma60Values.push(i >= 59 ? ma60State.ma : null);

    if (i > 0) ma20State = ma.next(deals[i], ma20State, 20);
    ma20Values.push(i >= 19 ? ma20State.ma : null);

    if (i > 0)
      volMa20State = ma.next({ c: deals[i].v } as any, volMa20State, 20);
    volMa20Values.push(i >= 19 ? volMa20State.ma : null);
  }

  // Calculate OBV MA20
  let obvMaState20 = ma.init({ c: obvValues[0] } as any, 20);
  obvMa20Values.push(null);
  for (let i = 1; i < obvValues.length; i++) {
    obvMaState20 = ma.next({ c: obvValues[i] } as any, obvMaState20, 20);
    obvMa20Values.push(i >= 19 ? obvMaState20.ma : null);
  }

  const signals: ObvSignal[] = [];
  const closes = deals.map((d) => d.c);
  const highs = deals.map((d) => d.h);
  const lows = deals.map((d) => d.l);

  // Strategy State
  let lastSignalIdx: Record<string, number> = {
    FAKE_BREAKOUT: -100,
    OBV_DIVERGENCE_ENTRY: -100,
    ACCUMULATION: -100,
    EXIT_WEAKNESS: -100,
    STOP_LOSS: -100,
  };

  let activeEntryLow: number | null = null; // For Stop Loss tracking
  let recentDivergenceCount = 0; // Countdown for divergence validity

  for (let i = 60; i < deals.length; i++) {
    const d = deals[i];
    const c = d.c;
    const v = d.v;
    const l = d.l;
    const o = d.o;

    const currObv = obvValues[i];
    const prevObv = obvValues[i - 1];
    const currObvMa = obvMa20Values[i];
    const currMa60 = ma60Values[i];
    const currMa20 = ma20Values[i];
    const currVolMa = volMa20Values[i];

    // Definitions
    const resistance = getExtrema(highs, i, 20, "MAX");
    const support = getExtrema(lows, i, 20, "MIN");

    const obvHigh20 = getExtrema(obvValues, i, 20, "MAX");
    const obvLow20 = getExtrema(obvValues, i, 20, "MIN");

    const avgPrice = closes.slice(i - 20, i).reduce((a, b) => a + b, 0) / 20;
    const boxWidth = (resistance - support) / avgPrice;

    // --- Signal Logic ---

    // Filter: Invalid Zone (Professional Reminder)
    if (boxWidth < 0.015 && currVolMa !== null && v < currVolMa * 0.5) {
      continue;
    }

    // A. Fake Breakout (Priority 1)
    if (c > resistance && currObv < obvHigh20) {
      if (i - lastSignalIdx.FAKE_BREAKOUT > 15) {
        signals.push({
          t: d.t,
          type: "FAKE_BREAKOUT",
          reason: "Fake Breakout (背離)",
          price: c,
        });
        lastSignalIdx.FAKE_BREAKOUT = i;
      }
    }

    // D. Exit / Stop Loss (Priority 2)
    const isDeadCross = currObvMa !== null && currObv < currObvMa;

    if (activeEntryLow !== null && l < activeEntryLow) {
      // Hit stop loss
      if (i - lastSignalIdx.STOP_LOSS > 15) {
        signals.push({
          t: d.t,
          type: "STOP_LOSS",
          reason: "🛑 止損 (跌破前低)",
          price: c,
        });
        lastSignalIdx.STOP_LOSS = i;
        activeEntryLow = null;
      }
    } else if (currMa60 !== null && c < currMa60 && isDeadCross) {
      // Trend Reversal
      if (i - lastSignalIdx.STOP_LOSS > 15) {
        signals.push({
          t: d.t,
          type: "STOP_LOSS",
          reason: "🛑 趨勢反轉 (價跌破60MA+OBV死叉)",
          price: c,
        });
        lastSignalIdx.STOP_LOSS = i;
        activeEntryLow = null;
      }
    } else if (
      currMa60 !== null &&
      c > currMa60 &&
      isDeadCross &&
      currObvMa &&
      prevObv >= (obvMa20Values[i - 1] || 0)
    ) {
      // Weakness
      if (i - lastSignalIdx.EXIT_WEAKNESS > 15) {
        signals.push({
          t: d.t,
          type: "EXIT_WEAKNESS",
          reason: "動能轉弱 (OBV跌破均線)",
          price: c,
        });
        lastSignalIdx.EXIT_WEAKNESS = i;
      }
    }

    // Track Recent Divergence for B Logic (v2.3)
    // 1. Price creates new low (Close < Support OR Close < PrevLow)
    // 2. OBV > OBV_Low20 (Funds inflow)
    // Note: markdown says "Close < Support or front low". Support IS recent low.
    if ((c < support || c < lows[i - 1]) && currObv > obvLow20) {
      recentDivergenceCount = 10; // Valid for 10 bars (extended window)
    } else if (recentDivergenceCount > 0) {
      recentDivergenceCount--;
    }

    // B. OBV Divergence Entry (Priority 3) - v2.3 Refined
    /*
      Condition 1: OBV Divergence Core
        - Recent divergence (tracked above)
        - OBV > OBV_MA AND Slope > 0 (3-5 bars)
      Condition 2: Price Filter
        - Close > 20MA
        - Box Width < 3% (or 6% for Daily) - Keeping 6% for safety based on previous fix
      Condition 3: Volume Filter
        - AvgVol(3) > VolMA * 1.2
      Condition 4: Trend Confirmation (New)
        - OBV > OBV_High20 OR OBV Higher Low
        - No Long Lower Shadow: Body > Lower Shadow * 0.5
    */

    // Volume Check
    const volAvg3 = (deals[i].v + deals[i - 1].v + deals[i - 2].v) / 3;
    const isVolActive = currVolMa !== null && volAvg3 > currVolMa * 1.2;

    // Price Filter
    const isPriceFilterMet = currMa20 !== null && c > currMa20;
    // Keeping 0.06 to remain compatible with Daily charts based on prior robust fix
    // Relax logic: If we have valid divergence context, ignore box width
    const isContextMet = boxWidth < 0.06 || recentDivergenceCount > 0;

    // OBV Continuous Up Check (3 bars positive slope)
    const obvSlopePositive =
      currObv > prevObv &&
      prevObv > obvValues[i - 2] &&
      obvValues[i - 2] > obvValues[i - 3];
    const isObvContinuousUp =
      currObvMa !== null && currObv > currObvMa && obvSlopePositive;

    if (isPriceFilterMet && isContextMet && isVolActive) {
      // Must have divergence recent AND continuous up
      if (recentDivergenceCount > 0 && isObvContinuousUp) {
        // Condition 4: Trend Confirmation
        const obvBreakout = currObv > obvHigh20;
        const obvHigherLow = checkObvHigherLow(obvValues, i);

        // Candle Shape Check: No long lower shadow (Body > LowerShadow * 0.5)
        // Lower Shadow = Min(O, C) - L
        // Body = Abs(O - C)
        const lowerShadow = Math.min(o, c) - l;
        const body = Math.abs(o - c);
        // If Lower Shadow is tiny, division might be large, but basic check Body > 0.5*Shadow catches "long shadow"
        const isSolidCandle = body > lowerShadow * 0.5;

        if ((obvBreakout || obvHigherLow) && isSolidCandle) {
          if (i - lastSignalIdx.OBV_DIVERGENCE_ENTRY > 15) {
            signals.push({
              t: d.t,
              type: "OBV_DIVERGENCE_ENTRY",
              reason: "🚀 Buy (OBV 底背離 + 趨勢確認)",
              price: c,
            });
            lastSignalIdx.OBV_DIVERGENCE_ENTRY = i;
            activeEntryLow = l;
          }
        }
      }
    }

    // C. Accumulation (Priority 4)
    if (boxWidth < 0.06 && c < resistance) {
      if (currObvMa !== null && currObv > currObvMa) {
        if (checkObvHigherLow(obvValues, i)) {
          if (i - lastSignalIdx.ACCUMULATION > 25) {
            signals.push({
              t: d.t,
              type: "ACCUMULATION",
              reason: "⚡ 吸籌佈局 (OBV底底高)",
              price: c,
            });
            lastSignalIdx.ACCUMULATION = i;
          }
        }
      }
    }
  }

  return signals;
};
