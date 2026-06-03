import { DivergenceSignalType, SignalType } from "../types";

export interface RsiDivergenceSignal extends SignalType<DivergenceSignalType> {
  rsi: number;
  osc: number | null;
}

type Item = {
  t: number | string;
  h: number;
  l: number;
  rsi: number | null;
  osc: number | null;
};

interface CrossPoint {
  type: "golden" | "death";
  index: number;
  t: number | string;
}

interface RsiHigh {
  index: number;
  rsi: number;
  h: number;
  t: number | string;
}

interface RsiLow {
  index: number;
  rsi: number;
  l: number;
  t: number | string;
}

/**
 * Detects RSI-Price Divergence using Crossover-based Swing Detection.
 * Reference: detectKdDivergence.ts logic.
 */
export default function detectRsiDivergence(data: Item[]): RsiDivergenceSignal[] {
  if (data.length < 20) return [];

  const signals: RsiDivergenceSignal[] = [];
  
  // 1. Generate RSI Signal Line (SMA of RSI, period 9)
  const rsiValues = data.map(d => d.rsi || 50);
  const rsiSignal = calculateSMA(rsiValues, 9);

  const crossPoints: CrossPoint[] = [];

  // 2. Find Golden and Death Cross points
  for (let i = 1; i < data.length; i++) {
    const prevRsi = rsiValues[i - 1];
    const currRsi = rsiValues[i];
    const prevSig = rsiSignal[i - 1];
    const currSig = rsiSignal[i];

    if (prevSig === null || currSig === null) continue;

    if (prevRsi < prevSig && currRsi > currSig) {
      crossPoints.push({ type: "golden", index: i, t: data[i].t });
    } else if (prevRsi > prevSig && currRsi < currSig) {
      crossPoints.push({ type: "death", index: i, t: data[i].t });
    }
  }

  // 3. Find RSI Highs between Golden and Death cross
  const rsiHighs: RsiHigh[] = [];
  for (let i = 0; i < crossPoints.length; i++) {
    const start = crossPoints[i];
    if (start.type === "golden") {
      let endIndex = data.length - 1;
      for (let j = i + 1; j < crossPoints.length; j++) {
        if (crossPoints[j].type === "death") {
          endIndex = crossPoints[j].index;
          break;
        }
      }

      let maxRsi = -Infinity;
      let maxIndex = -1;
      for (let j = start.index; j <= endIndex; j++) {
        if (rsiValues[j] > maxRsi) {
          maxRsi = rsiValues[j];
          maxIndex = j;
        }
      }

      if (maxIndex !== -1) {
        rsiHighs.push({
          index: maxIndex,
          rsi: maxRsi,
          h: data[maxIndex].h,
          t: data[maxIndex].t,
        });
      }
    }
  }

  // 4. Find RSI Lows between Death and Golden cross
  const rsiLows: RsiLow[] = [];
  for (let i = 0; i < crossPoints.length; i++) {
    const start = crossPoints[i];
    if (start.type === "death") {
      let endIndex = data.length - 1;
      for (let j = i + 1; j < crossPoints.length; j++) {
        if (crossPoints[j].type === "golden") {
          endIndex = crossPoints[j].index;
          break;
        }
      }

      let minRsi = Infinity;
      let minIndex = -1;
      for (let j = start.index; j <= endIndex; j++) {
        if (rsiValues[j] < minRsi) {
          minRsi = rsiValues[j];
          minIndex = j;
        }
      }

      if (minIndex !== -1) {
        rsiLows.push({
          index: minIndex,
          rsi: minRsi,
          l: data[minIndex].l,
          t: data[minIndex].t,
        });
      }
    }
  }

  // 5. Detect Bearish Divergence (頂背離)
  for (let i = 1; i < rsiHighs.length; i++) {
    const curr = rsiHighs[i];
    const prev = rsiHighs[i - 1];

    if (curr.h > prev.h && curr.rsi < prev.rsi) {
      // Check for MACD Confirmation as per v3 strategy
      const confirmedIndex = findMacdConfirmation(data, curr.index, "bearish");
      if (confirmedIndex !== -1) {
        const confirmedItem = data[confirmedIndex];
        signals.push({
          t: typeof confirmedItem.t === "string" ? parseInt(confirmedItem.t) : confirmedItem.t,
          type: DivergenceSignalType.BEARISH_DIVERGENCE,
          description: `頂背離確認：價格高點較前一波上漲，但 RSI 未創新高且動能轉弱。`,
          rsi: confirmedItem.rsi || curr.rsi,
          osc: confirmedItem.osc,
        });
      }
    }
  }

  // 6. Detect Bullish Divergence (底背離)
  for (let i = 1; i < rsiLows.length; i++) {
    const curr = rsiLows[i];
    const prev = rsiLows[i - 1];

    if (curr.l < prev.l && curr.rsi > prev.rsi) {
      const confirmedIndex = findMacdConfirmation(data, curr.index, "bullish");
      if (confirmedIndex !== -1) {
        const confirmedItem = data[confirmedIndex];
        signals.push({
          t: typeof confirmedItem.t === "string" ? parseInt(confirmedItem.t) : confirmedItem.t,
          type: DivergenceSignalType.BULLISH_DIVERGENCE,
          description: `底背離確認：價格低點較前一波下跌，但 RSI 抬頭且動能翻正。`,
          rsi: confirmedItem.rsi || curr.rsi,
          osc: confirmedItem.osc,
        });
      }
    }
  }

  signals.sort((a, b) => a.t - b.t);
  return signals;
}

/**
 * Utility: Simple Moving Average
 */
function calculateSMA(data: number[], period: number): (number | null)[] {
  const sma: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(null);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    sma.push(sum / period);
  }
  return sma;
}

/**
 * Utility: Find MACD Confirmation
 */
function findMacdConfirmation(data: Item[], startIndex: number, type: "bullish" | "bearish"): number {
  const scanEnd = Math.min(data.length - 1, startIndex + 8);
  for (let j = startIndex; j <= scanEnd; j++) {
    const prevOsc = data[j - 1]?.osc || 0;
    const currOsc = data[j].osc || 0;
    
    if (type === "bullish") {
      if (currOsc > 0 || currOsc > prevOsc) return j;
    } else {
      if (currOsc < 0 || currOsc < prevOsc) return j;
    }
  }
  return -1;
}
