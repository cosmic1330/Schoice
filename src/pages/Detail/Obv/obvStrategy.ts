import ma from "../../../cls_tools/ma";
import obvTool from "../../../cls_tools/obv";
import { TaType } from "../../../types";

export type SignalType =
  | "TRUE_BREAKOUT"
  | "FAKE_BREAKOUT"
  | "ACCUMULATION"
  | "EXIT_WEAKNESS"
  | "STOP_LOSS";

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
  const start = Math.max(0, idx - window);
  for (let i = start; i < idx; i++) {
    if (type === "MAX") val = Math.max(val, arr[i]);
    else val = Math.min(val, arr[i]);
  }
  return val;
};

/**
 * Robust Higher Low check for OBV
 * Checks if the current local low is higher than the previous confirmed local low
 */
const checkObvHigherLow = (obvValues: number[], idx: number) => {
  // 1. Find the current local low (swing low)
  // A swing low is obv[i] < obv[i-1] and obv[i] < obv[i+1]
  // But since we are calculating in real-time/streaming, we use:
  // obv[i-2] < obv[i-3] and obv[i-2] < obv[i-1]

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

  // Check if current swing low is higher than previous swing low
  return currentLow.val > previousLow.val;
};

export const calculateObvSignals = (deals: TaType): ObvSignal[] => {
  if (!deals || deals.length < 60) return [];

  // 1. Calculate Core Data
  const obvValues: number[] = [];
  const ma60Values: (number | null)[] = [];
  const obvMa20Values: (number | null)[] = [];
  const volMa20Values: (number | null)[] = [];

  let obvState = obvTool.init(deals[0]);
  let ma60State = ma.init(deals[0], 60);
  let volMa20State = ma.init({ c: deals[0].v } as any, 20);

  // Collect OBV, Price MA60, and Volume MA20
  for (let i = 0; i < deals.length; i++) {
    if (i > 0) obvState = obvTool.next(deals[i], obvState);
    obvValues.push(obvState.obv);

    if (i > 0)
      volMa20State = ma.next({ c: deals[i].v } as any, volMa20State, 20);
    volMa20Values.push(i >= 19 ? volMa20State.ma : null);

    if (i > 0) ma60State = ma.next(deals[i], ma60State, 60);
    ma60Values.push(i >= 59 ? ma60State.ma : null);
  }

  // Calculate OBV MA20
  let obvMaState20 = ma.init({ c: obvValues[0] } as any, 20);
  obvMa20Values.push(null); // idx 0 is definitely < 19
  for (let i = 1; i < obvValues.length; i++) {
    obvMaState20 = ma.next({ c: obvValues[i] } as any, obvMaState20, 20);
    obvMa20Values.push(i >= 19 ? obvMaState20.ma : null);
  }

  const signals: ObvSignal[] = [];
  const closes = deals.map((d) => d.c);

  // v2.0 Strategy States
  let isAboveResistance = false;
  let isBelowObvMa = false;
  let activeBreakoutLow: number | null = null;
  let lastSignalIdx: Record<string, number> = {
    TRUE_BREAKOUT: -100,
    FAKE_BREAKOUT: -100,
    ACCUMULATION: -100,
    EXIT_WEAKNESS: -100,
    STOP_LOSS: -100,
  };

  for (let i = 60; i < deals.length; i++) {
    const d = deals[i];
    const c = d.c;
    const v = d.v;
    const currObv = obvValues[i];
    const prevObv = obvValues[i - 1];
    const currObvMa = obvMa20Values[i];
    const currMa60 = ma60Values[i];
    const currVolMa = volMa20Values[i];

    const resistance = getExtrema(closes, i, 20, "MAX");
    const support = getExtrema(closes, i, 20, "MIN");
    const obvHigh20 = getExtrema(obvValues, i, 20, "MAX");

    const avgPrice = closes.slice(i - 20, i).reduce((a, b) => a + b, 0) / 20;
    const boxWidth = (resistance - support) / avgPrice;

    // Check states
    const currentlyAboveResistance = c > resistance;
    const currentlyBelowObvMa = currObvMa !== null && currObv < currObvMa;
    const breakoutTransition = currentlyAboveResistance && !isAboveResistance;
    const obvTransitionDown = currentlyBelowObvMa && !isBelowObvMa;

    let emittedSignalType: string | null = null;

    // A. Fake Breakout (Priority 1)
    if (breakoutTransition && currObv < obvHigh20) {
      if (i - lastSignalIdx.FAKE_BREAKOUT > 15) {
        signals.push({
          t: d.t,
          type: "FAKE_BREAKOUT",
          reason: "Fake Breakout (背離)",
          price: c,
        });
        lastSignalIdx.FAKE_BREAKOUT = i;
        emittedSignalType = "FAKE_BREAKOUT";
      }
    }

    // D. Stop Loss / Exit (Priority 2)
    if (!emittedSignalType) {
      const prevObvMa = i > 0 ? obvMa20Values[i - 1] : null;
      const isDeadCross =
        currObvMa !== null &&
        prevObvMa !== null &&
        currObv < currObvMa &&
        prevObv >= prevObvMa;
      const isBelowMa60 = currMa60 !== null && c < currMa60;
      const isBelowBreakoutLow =
        activeBreakoutLow !== null && c < activeBreakoutLow;

      if (isBelowBreakoutLow || (isBelowMa60 && isDeadCross)) {
        if (i - lastSignalIdx.STOP_LOSS > 15) {
          signals.push({
            t: d.t,
            type: "STOP_LOSS",
            reason: "🛑 趨勢反轉 / 止損",
            price: c,
          });
          lastSignalIdx.STOP_LOSS = i;
          emittedSignalType = "STOP_LOSS";
          activeBreakoutLow = null; // Reset
        }
      } else if (obvTransitionDown && currMa60 !== null && c > currMa60) {
        if (i - lastSignalIdx.EXIT_WEAKNESS > 15) {
          signals.push({
            t: d.t,
            type: "EXIT_WEAKNESS",
            reason: "動能轉弱 (跌破OBV均線)",
            price: c,
          });
          lastSignalIdx.EXIT_WEAKNESS = i;
          emittedSignalType = "EXIT_WEAKNESS";
        }
      }
    }

    // B. True Breakout (Priority 3)
    if (!emittedSignalType && breakoutTransition) {
      const isAttackVol = currVolMa !== null && v > currVolMa * 1.5;
      const isAboveMa60 = currMa60 !== null && c > currMa60;
      const isObvStrong =
        currObvMa !== null && currObv > currObvMa && currObv > prevObv;

      if (isAboveMa60 && isAttackVol && isObvStrong) {
        if (i - lastSignalIdx.TRUE_BREAKOUT > 15) {
          signals.push({
            t: d.t,
            type: "TRUE_BREAKOUT",
            reason: "Buy (真突破: 量價齊揚)",
            price: c,
          });
          lastSignalIdx.TRUE_BREAKOUT = i;
          emittedSignalType = "TRUE_BREAKOUT";
          activeBreakoutLow = d.l * 0.99; // Set trailing stop at breakout bar low
        }
      }
    }

    // C. Accumulation (Priority 4)
    if (!emittedSignalType && boxWidth < 0.02 && c < resistance) {
      if (checkObvHigherLow(obvValues, i)) {
        if (i - lastSignalIdx.ACCUMULATION > 25) {
          signals.push({
            t: d.t,
            type: "ACCUMULATION",
            reason: "吸籌中 (底底高)",
            price: c,
          });
          lastSignalIdx.ACCUMULATION = i;
          emittedSignalType = "ACCUMULATION";
        }
      }
    }

    // Update States
    isAboveResistance = currentlyAboveResistance;
    isBelowObvMa = currentlyBelowObvMa;
  }

  return signals;
};
