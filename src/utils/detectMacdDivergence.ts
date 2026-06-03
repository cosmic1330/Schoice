import { DivergenceSignalType, SignalType } from "../types";

export interface MacdDivergenceSignal extends SignalType<DivergenceSignalType> {
  osc: number;
}

type Item = {
  t: number | string;
  h: number;
  l: number;
  osc: number | null;
};

interface OscHigh {
  index: number;
  osc: number;
  h: number;
  t: number | string;
}

interface OscLow {
  index: number;
  osc: number;
  l: number;
  t: number | string;
}

interface CrossPoint {
  type: "up" | "down";
  index: number;
}

/**
 * Detects MACD Histogram (OSC) Divergence.
 * Logic:
 * 1. Divide data into segments based on OSC crossing 0.
 * 2. Find max OSC in positive segments, min OSC in negative segments.
 * 3. Compare adjacent peak/trough segments for divergence.
 */
export default function detectMacdDivergence(data: Item[]): MacdDivergenceSignal[] {
  if (data.length < 20) return [];

  const signals: MacdDivergenceSignal[] = [];
  const crossPoints: CrossPoint[] = [];

  // 1. Find OSC Zero-crossing points
  for (let i = 1; i < data.length; i++) {
    const prevOsc = data[i - 1].osc || 0;
    const currOsc = data[i].osc || 0;

    if (prevOsc < 0 && currOsc >= 0) {
      crossPoints.push({ type: "up", index: i });
    } else if (prevOsc > 0 && currOsc <= 0) {
      crossPoints.push({ type: "down", index: i });
    }
  }

  // 2. Find OSC Highs (in positive segments)
  const oscHighs: OscHigh[] = [];
  for (let i = 0; i < crossPoints.length; i++) {
    const start = crossPoints[i];
    if (start.type === "up") {
      let endIndex = data.length - 1;
      for (let j = i + 1; j < crossPoints.length; j++) {
        if (crossPoints[j].type === "down") {
          endIndex = crossPoints[j].index;
          break;
        }
      }

      let maxOsc = -Infinity;
      let maxIndex = -1;
      for (let j = start.index; j <= endIndex; j++) {
        const val = data[j].osc || 0;
        if (val > maxOsc) {
          maxOsc = val;
          maxIndex = j;
        }
      }

      if (maxIndex !== -1) {
        oscHighs.push({
          index: maxIndex,
          osc: maxOsc,
          h: data[maxIndex].h,
          t: data[maxIndex].t,
        });
      }
    }
  }

  // 3. Find OSC Lows (in negative segments)
  const oscLows: OscLow[] = [];
  for (let i = 0; i < crossPoints.length; i++) {
    const start = crossPoints[i];
    if (start.type === "down") {
      let endIndex = data.length - 1;
      for (let j = i + 1; j < crossPoints.length; j++) {
        if (crossPoints[j].type === "up") {
          endIndex = crossPoints[j].index;
          break;
        }
      }

      let minOsc = Infinity;
      let minIndex = -1;
      for (let j = start.index; j <= endIndex; j++) {
        const val = data[j].osc || 0;
        if (val < minOsc) {
          minOsc = val;
          minIndex = j;
        }
      }

      if (minIndex !== -1) {
        oscLows.push({
          index: minIndex,
          osc: minOsc,
          l: data[minIndex].l,
          t: data[minIndex].t,
        });
      }
    }
  }

  // 4. Detect Bearish Divergence (頂背離)
  for (let i = 1; i < oscHighs.length; i++) {
    const curr = oscHighs[i];
    const prev = oscHighs[i - 1];

    if (curr.h > prev.h && curr.osc < prev.osc) {
      signals.push({
        t: typeof curr.t === "string" ? parseInt(curr.t) : curr.t,
        type: DivergenceSignalType.BEARISH_DIVERGENCE,
        description: `MACD 頂背離：價格創新高，但 MACD 柱狀體動能減弱。`,
        osc: curr.osc,
      });
    }
  }

  // 5. Detect Bullish Divergence (底背離)
  for (let i = 1; i < oscLows.length; i++) {
    const curr = oscLows[i];
    const prev = oscLows[i - 1];

    if (curr.l < prev.l && curr.osc > prev.osc) {
      signals.push({
        t: typeof curr.t === "string" ? parseInt(curr.t) : curr.t,
        type: DivergenceSignalType.BULLISH_DIVERGENCE,
        description: `MACD 底背離：價格創新低，但 MACD 柱狀體動能抬頭。`,
        osc: curr.osc,
      });
    }
  }

  signals.sort((a, b) => a.t - b.t);
  return signals;
}
