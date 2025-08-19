import { DivergenceSignalType, SignalType } from "../types";

interface KdDivergenceSignal extends SignalType {
  k: number;
  d: number;
}

type Item = {
  t: number;
  h: number;
  l: number;
  k: number;
  d: number;
};

interface CrossPoint {
  type: "golden" | "death";
  index: number;
  t: number;
}

interface KdHigh {
  index: number;
  k: number;
  d: number;
  h: number; // 使用高點而非收盤價
  t: number;
}

interface KdLow {
  index: number;
  k: number;
  d: number;
  l: number; // 使用低點
  t: number;
}

export default function detectKdDivergence(data: Item[]): KdDivergenceSignal[] {
  if (data.length < 10) return [];

  const signals: KdDivergenceSignal[] = [];
  const crossPoints: CrossPoint[] = [];

  // 1. 找出黃金交叉與死亡交叉點
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1];
    const curr = data[i];

    if (prev.k < prev.d && curr.k > curr.d) {
      crossPoints.push({
        type: "golden",
        index: i,
        t: curr.t,
      });
    } else if (prev.k > prev.d && curr.k < curr.d) {
      crossPoints.push({
        type: "death",
        index: i,
        t: curr.t,
      });
    }
  }

  // 2. 找出每個黃金交叉到死亡交叉之間的 K 高點
  const kdHighs: KdHigh[] = [];
  for (let i = 0; i < crossPoints.length; i++) {
    const start = crossPoints[i];

    if (start.type === "golden") {
      // 找下一個死亡交叉，如果沒有就到數據結尾
      let endIndex = data.length - 1;
      for (let j = i + 1; j < crossPoints.length; j++) {
        if (crossPoints[j].type === "death") {
          endIndex = crossPoints[j].index;
          break;
        }
      }

      let maxK = -Infinity;
      let maxIndex = -1;

      for (let j = start.index; j <= endIndex; j++) {
        if (data[j].k > maxK) {
          maxK = data[j].k;
          maxIndex = j;
        }
      }

      if (maxIndex !== -1) {
        kdHighs.push({
          index: maxIndex,
          k: data[maxIndex].k,
          d: data[maxIndex].d,
          h: data[maxIndex].h, // 使用高點
          t: data[maxIndex].t,
        });
      }
    }
  }

  // 3. 找出每個死亡交叉到黃金交叉之間的 K 低點
  const kdLows: KdLow[] = [];
  for (let i = 0; i < crossPoints.length; i++) {
    const start = crossPoints[i];

    if (start.type === "death") {
      // 找下一個黃金交叉，如果沒有就到數據結尾
      let endIndex = data.length - 1;
      for (let j = i + 1; j < crossPoints.length; j++) {
        if (crossPoints[j].type === "golden") {
          endIndex = crossPoints[j].index;
          break;
        }
      }

      let minK = Infinity;
      let minIndex = -1;

      for (let j = start.index; j <= endIndex; j++) {
        if (data[j].k < minK) {
          minK = data[j].k;
          minIndex = j;
        }
      }

      if (minIndex !== -1) {
        kdLows.push({
          index: minIndex,
          k: data[minIndex].k,
          d: data[minIndex].d,
          l: data[minIndex].l, // 使用低點
          t: data[minIndex].t,
        });
      }
    }
  }

  // 4. 檢測頂背離 - 比較所有相鄰的 KD 高點
  for (let i = 1; i < kdHighs.length; i++) {
    const currentHigh = kdHighs[i];
    const prevHigh = kdHighs[i - 1];

    // 價格創新高但 K 值未創新高
    const priceHigherHigh = currentHigh.h > prevHigh.h;
    const kLowerHigh = currentHigh.k < prevHigh.k;

    if (priceHigherHigh && kLowerHigh) {
      const daysDiff = Math.round(
        (currentHigh.t - prevHigh.t) / (24 * 60 * 60 * 1000)
      );

      const priceIncrease = ((currentHigh.h - prevHigh.h) / prevHigh.h) * 100;
      const kDecrease = prevHigh.k - currentHigh.k;

      signals.push({
        t: currentHigh.t,
        k: currentHigh.k,
        d: currentHigh.d,
        type: DivergenceSignalType.BEARISH_DIVERGENCE,
        description: `價格高點較${daysDiff}天前上漲${priceIncrease.toFixed(
          1
        )}% (${prevHigh.h.toFixed(2)} → ${currentHigh.h.toFixed(
          2
        )})，但K值由${prevHigh.k.toFixed(1)}降至${currentHigh.k.toFixed(
          1
        )}，下降${kDecrease.toFixed(1)}點，出現頂背離。`,
      });
    }
  }

  // 5. 檢測底背離 - 比較所有相鄰的 KD 低點
  for (let i = 1; i < kdLows.length; i++) {
    const currentLow = kdLows[i];
    const prevLow = kdLows[i - 1];

    // 價格創新低但 K 值未創新低
    const priceLowerLow = currentLow.l < prevLow.l;
    const kHigherLow = currentLow.k > prevLow.k;

    if (priceLowerLow && kHigherLow) {
      const daysDiff = Math.round(
        (currentLow.t - prevLow.t) / (24 * 60 * 60 * 1000)
      );

      const priceDecrease = ((prevLow.l - currentLow.l) / prevLow.l) * 100;
      const kIncrease = currentLow.k - prevLow.k;

      signals.push({
        t: currentLow.t,
        k: currentLow.k,
        d: currentLow.d,
        type: DivergenceSignalType.BULLISH_DIVERGENCE,
        description: `價格低點較${daysDiff}天前下跌${priceDecrease.toFixed(
          1
        )}% (${prevLow.l.toFixed(2)} → ${currentLow.l.toFixed(
          2
        )})，但K值由${prevLow.k.toFixed(1)}升至${currentLow.k.toFixed(
          1
        )}，上升${kIncrease.toFixed(1)}點，出現底背離。`,
      });
    }
  }

  // 6. 按時間排序
  signals.sort((a, b) => a.t - b.t);

  return signals;
}
