import { DivergenceSignalType, SignalType } from "../types";

interface ObvDivergenceSignal extends SignalType {
  price: number;
}

interface DataPoint {
  t: number;
  h: number;
  c: number;
  obv: number;
  emaObv10: number;
}

// 簡單的峰值檢測 - 找到N天內的最高點
function isLocalHigh(
  data: DataPoint[],
  index: number,
  period: number = 5
): boolean {
  if (index < period || index >= data.length - period) return false;

  const current = data[index].c;

  // 檢查前後period天內是否為最高點
  for (let i = index - period; i <= index + period; i++) {
    if (i !== index && data[i].c >= current) {
      return false;
    }
  }
  return true;
}

// 簡單的谷值檢測 - 找到N天內的最低點
function isLocalLow(
  data: DataPoint[],
  index: number,
  period: number = 5
): boolean {
  if (index < period || index >= data.length - period) return false;

  const current = data[index].c;

  // 檢查前後period天內是否為最低點
  for (let i = index - period; i <= index + period; i++) {
    if (i !== index && data[i].c <= current) {
      return false;
    }
  }
  return true;
}

// 主判斷函式
function detectObvDivergence(
  data: DataPoint[],
  options: {
    lookbackPeriod?: number; // 尋找前一個高低點的最大期間
    localPeriod?: number; // 判斷局部高低點的期間
    minPriceDiff?: number; // 最小價格差異百分比
  } = {}
): ObvDivergenceSignal[] {
  const {
    lookbackPeriod = 30,
    localPeriod = 2,
    minPriceDiff = 0.02, // 2%
  } = options;

  const signals: ObvDivergenceSignal[] = [];

  if (data.length < lookbackPeriod + localPeriod * 2) {
    return signals;
  }

  // 從足夠的數據開始分析
  for (
    let i = lookbackPeriod + localPeriod;
    i < data.length - localPeriod;
    i++
  ) {
    const current = data[i];

    // 檢查是否為局部高點 - 頂背離候選
    if (isLocalHigh(data, i, localPeriod)) {
      // 在lookback期間內尋找前一個局部高點
      for (let j = i - lookbackPeriod; j < i - localPeriod * 2; j++) {
        if (isLocalHigh(data, j, localPeriod)) {
          const prevHigh = data[j];

          // 價格創新高的條件
          const priceIncrease = (current.c - prevHigh.c) / prevHigh.c;
          const priceIncrease2 = (current.h - prevHigh.h) / prevHigh.h;
          if (priceIncrease > minPriceDiff || priceIncrease2 > minPriceDiff) {
            // OBV沒有同步創新高 = 背離
            if (current.obv < prevHigh.obv) {
              const daysDiff = Math.round(
                (current.t - prevHigh.t) / (24 * 60 * 60 * 1000)
              );
              signals.push({
                t: current.t,
                price: current.h,
                type: DivergenceSignalType.BEARISH_DIVERGENCE,
                description: `價格較${daysDiff}天前高點上漲${(
                  priceIncrease * 100
                ).toFixed(1)}%，但OBV由${prevHigh.obv.toFixed(
                  0
                )}降至${current.obv.toFixed(0)}，出現頂背離。`,
              });
            }
          }
          break; // 找到第一個符合的就停止
        }
      }
    }

    // 檢查是否為局部低點 - 底背離候選
    if (isLocalLow(data, i, localPeriod)) {
      // 在lookback期間內尋找前一個局部低點
      for (let j = i - lookbackPeriod; j < i - localPeriod * 2; j++) {
        if (isLocalLow(data, j, localPeriod)) {
          const prevLow = data[j];

          // 價格創新低的條件
          const priceDecrease = (prevLow.c - current.c) / prevLow.c;
          if (priceDecrease > minPriceDiff) {
            // OBV沒有同步創新低 = 背離
            if (current.obv > prevLow.obv) {
              const daysDiff = Math.round(
                (current.t - prevLow.t) / (24 * 60 * 60 * 1000)
              );
              signals.push({
                t: current.t,
                price: current.c,
                type: DivergenceSignalType.BULLISH_DIVERGENCE,
                description: `價格較${daysDiff}天前低點下跌${(
                  priceDecrease * 100
                ).toFixed(1)}%，但OBV由${prevLow.obv.toFixed(
                  0
                )}升至${current.obv.toFixed(0)}，出現底背離。`,
              });
            }
          }
          break; // 找到第一個符合的就停止
        }
      }
    }
  }

  return signals;
}

export default detectObvDivergence;
