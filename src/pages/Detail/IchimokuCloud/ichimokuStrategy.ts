import { StepCheck } from "../../../types";

// Types derived from what we expect in the data hook
export interface IchimokuCombinedData {
  t: number | string;
  o: number | null;
  h: number | null;
  l: number | null;
  c: number | null;
  v: number | null;
  tenkan: number | null;
  kijun: number | null;
  senkouA: number | null;
  senkouB: number | null;
  chikou: number | null;
  osc: number | null; // MACD
  cmf: number | null; // CMF
  cmfPrev: number | null;
  cmfEma5: number | null; // CMF EMA5
}

export interface SignalResult {
  t: number | string;
  type: "ACCUMULATION" | "EXIT" | "DIVERGENCE_BULL" | "DIVERGENCE_BEAR";
  reason: string;
  price: number;
}

export interface AnalysisResult {
  steps: {
    label: string;
    description: string;
    checks: StepCheck[];
  }[];
  score: number;
  recommendation: string;
  dateLabel?: string;
}

export const analyzeIchimokuAtPoint = (
  data: IchimokuCombinedData[],
  index: number,
): AnalysisResult => {
  if (index < 0 || index >= data.length) {
    return { steps: [], score: 0, recommendation: "No Data", dateLabel: "-" };
  }

  const current = data[index];
  const dateStr = current.t ? String(current.t) : "-";
  // Simple formatting YYYYMMDD -> YYYY-MM-DD
  const formattedDate =
    dateStr.length === 8
      ? `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
      : dateStr;
  const price = current.c || 0;
  if (price === 0) {
    // If it's a future bar with no price, find the last real price for current context
    let lastRealIdx = index;
    while (
      lastRealIdx >= 0 &&
      (data[lastRealIdx].c === null || data[lastRealIdx].c === 0)
    ) {
      lastRealIdx--;
    }
    // If we're analyzing a future bar, we might want to return a special state or analyze based on the last known price vs future cloud
    // For now, let's just use the last real index if current is empty
    if (lastRealIdx === -1)
      return { steps: [], score: 0, recommendation: "No Price Data" };
    // But we want to analyze the cloud AT the requested index
  }

  // 1. Current State
  const cloudTop =
    current.senkouA !== null && current.senkouB !== null
      ? Math.max(current.senkouA, current.senkouB)
      : 0;
  const isAboveCloud = price > cloudTop;
  const cloudThickness = Math.abs(
    (current.senkouA || 0) - (current.senkouB || 0),
  );
  const isThickCloud = cloudThickness > price * 0.005;

  const cmf = current.cmf || 0;
  const cmfEma5 = current.cmfEma5 || 0;
  const prevCmfEma5 = index > 0 ? data[index - 1].cmfEma5 || 0 : 0;
  const isCmfSlopeUp = cmfEma5 > prevCmfEma5;

  const isTkGold =
    current.tenkan !== null &&
    current.kijun !== null &&
    current.tenkan > current.kijun;

  // 2. Future State (Next 26 Bars relative to index)
  const futureData = data.slice(index + 1, index + 27);
  let futureBullCount = 0;
  let hasTwist = false;
  let twistIdx = -1;
  let maxFutureThickness = 0;
  let firstFutureThickness = 0;
  let lastFutureThickness = 0;

  let isSpanBFlat = false;
  let flatCount = 0;

  if (futureData.length > 0) {
    futureData.forEach((d, idx) => {
      if (d.senkouA !== null && d.senkouB !== null) {
        const isBull = d.senkouA > d.senkouB;
        if (isBull) futureBullCount++;

        const thickness = Math.abs(d.senkouA - d.senkouB);
        if (idx === 0) firstFutureThickness = thickness;
        if (idx === futureData.length - 1) lastFutureThickness = thickness;
        if (thickness > maxFutureThickness) maxFutureThickness = thickness;

        // Twist detection
        if (idx > 0) {
          const prev = futureData[idx - 1];
          if (prev.senkouA !== null && prev.senkouB !== null) {
            const prevBull = prev.senkouA > prev.senkouB;
            if (isBull !== prevBull) {
              hasTwist = true;
              twistIdx = idx;
            }
            // Flat B detection
            if (d.senkouB === prev.senkouB) {
              flatCount++;
            } else {
              flatCount = 0;
            }
            if (flatCount >= 5) isSpanBFlat = true;
          }
        }
      }
    });
  }

  const isFutureBullish = futureBullCount > futureData.length / 2;
  const isCloudExpanding = lastFutureThickness > firstFutureThickness * 1.1;
  const isCloudContracting = lastFutureThickness < firstFutureThickness * 0.9;

  // Matrix Logic Refinement
  let rec = "觀望 (Wait)";
  let score = 0;

  // Base Scoring
  if (isAboveCloud) score += 40;
  if (isTkGold) score += 20;
  if (cmf > 0.1) score += 20;
  if (isCmfSlopeUp) score += 10;

  // Future Bias Weight (Max 20)
  if (isFutureBullish) score += 10;
  if (isCloudExpanding && isFutureBullish) score += 10;
  if (hasTwist && isFutureBullish) score -= 5;
  if (hasTwist && !isFutureBullish) score += 5;

  score = Math.max(0, Math.min(100, score));

  if (score >= 85) rec = "重倉持有 (Strong Buy)";
  else if (score >= 65) rec = "偏多操作 (Long)";
  else if (score >= 45) rec = "結構調整 (Neutral)";
  else if (score >= 25) rec = "減碼觀望 (Weak)";
  else rec = "絕對空倉 (Strong Sell)";

  const analysisSteps: AnalysisResult["steps"] = [
    {
      label: "I. 趨勢結構 (Current)",
      description: "當前雲層與 TK 狀態",
      checks: [
        {
          label: "價格高於雲層 (多頭排列)",
          status: isAboveCloud ? "pass" : "fail",
        },
        {
          label: isTkGold ? "TK 金叉 (動能向上)" : "TK 死叉/無方向",
          status: isTkGold ? "pass" : "fail",
        },
        {
          label: isThickCloud ? "厚雲支撐 (結構穩固)" : "薄雲預警 (易於突破)",
          status: isThickCloud ? "pass" : "manual",
        },
      ],
    },
    {
      label: "II. 資金動能 (Flow)",
      description: "CMF 資金流強度",
      checks: [
        {
          label: "資金流入 (CMF > 0)",
          status: cmf > 0 ? "pass" : "fail",
        },
        {
          label: isCmfSlopeUp ? "動能加速 (Slope Up)" : "動能減緩 (Slope Down)",
          status: isCmfSlopeUp ? "pass" : "fail",
        },
        {
          label: cmf > 0.15 ? "強勢吸籌區 (>0.15)" : "資金參與度中等",
          status: cmf > 0.15 ? "pass" : "manual",
        },
      ],
    },
    {
      label: "III. 未來 26 期展望",
      description: "投影雲：分析未來 26 期趨勢格局",
      checks: [
        {
          label: isFutureBullish
            ? "投影：陽雲 (多頭格局)"
            : "投影：陰雲 (空頭格局)",
          status: isFutureBullish ? "pass" : "fail",
        },
        {
          label: hasTwist
            ? `預警：第 ${twistIdx + 1} 期發生變盤 (Kumo Twist)`
            : "趨勢：格局穩定，無翻轉預兆",
          status: hasTwist ? "manual" : "pass",
        },
        {
          label: isCloudExpanding
            ? "動能：開口擴張 (趨勢強化)"
            : isCloudContracting
              ? "動能：縮口收斂 (趨勢轉弱)"
              : "動能：平行延伸 (區間整理)",
          status: isCloudExpanding
            ? "pass"
            : isCloudContracting
              ? "fail"
              : "manual",
        },
        {
          label: isSpanBFlat
            ? "防線：先行 B 走平 (強防禦區)"
            : "防線：動態支撐/阻力",
          status: isSpanBFlat ? "pass" : "manual",
        },
      ],
    },
  ];

  return {
    steps: analysisSteps,
    score,
    recommendation: rec,
    dateLabel: formattedDate,
  };
};

export const calculateIchimokuSignals = (
  data: IchimokuCombinedData[],
): {
  signals: SignalResult[];
  lastAnalysis: AnalysisResult;
} => {
  const signals: SignalResult[] = [];
  let lastSignalState: "buy" | "neutral" = "neutral";

  // We need at least 52 bars for full Ichimoku + CMF(21)
  const minBars = 52;

  if (data.length < minBars) {
    return {
      signals: [],
      lastAnalysis: {
        steps: [],
        score: 0,
        recommendation: "Insufficient Data",
      },
    };
  }

  // --- Signal Loop ---
  data.forEach((current, i) => {
    if (i < 52) return;
    const prev = data[i - 1];

    const price = current.c;
    const high = current.h;
    const low = current.l;

    // Safety check
    if (price === null || high === null || low === null) return;

    const cloudTop =
      current.senkouA !== null && current.senkouB !== null
        ? Math.max(current.senkouA, current.senkouB)
        : null;
    const cloudBottom =
      current.senkouA !== null && current.senkouB !== null
        ? Math.min(current.senkouA, current.senkouB)
        : null;

    // 1. Structure
    const isAboveCloud = cloudTop !== null && price > cloudTop;
    const isBelowCloud = cloudBottom !== null && price < cloudBottom;
    const isInCloud =
      cloudTop !== null &&
      cloudBottom !== null &&
      price <= cloudTop &&
      price >= cloudBottom;

    // 2. TK Cross / State
    const isTkGold =
      current.tenkan !== null &&
      current.kijun !== null &&
      current.tenkan > current.kijun;

    // Kijun Slope
    const prevKijun = prev.kijun;
    const currKijun = current.kijun;
    const isKijunUp =
      prevKijun !== null && currKijun !== null && currKijun > prevKijun;
    const isKijunFlat =
      prevKijun !== null && currKijun !== null && currKijun === prevKijun;
    const isKijunStable = isKijunUp || isKijunFlat;

    // 3. CMF State
    const cmf = current.cmf;
    const cmfEma5 = current.cmfEma5;
    const prevCmfEma5 = prev.cmfEma5;

    const isCmfBull = cmf !== null && cmf > 0;

    const isCmfEmaUp =
      cmfEma5 !== null && prevCmfEma5 !== null && cmfEma5 > prevCmfEma5;
    const isCmfEmaDown =
      cmfEma5 !== null && prevCmfEma5 !== null && cmfEma5 < prevCmfEma5;

    // --- Signal Logic ---

    if (lastSignalState === "neutral") {
      // A. Strong Bullish Setup (3-in-1)
      const isStrongBullish =
        isAboveCloud && isTkGold && isKijunStable && isCmfBull && isCmfEmaUp;

      if (isStrongBullish) {
        lastSignalState = "buy";
      }

      // B. Early Accumulation (CMF Leading)

      // A. Early Accumulation (CMF Leading)
      const isAccumulation =
        (isInCloud || isBelowCloud) && (cmf || -1) > -0.05 && isCmfEmaUp;

      if (isAccumulation) {
        const prevPrev = data[i - 2];
        const isPrevCmfEmaUp =
          prev.cmfEma5 !== null &&
          prevPrev &&
          prevPrev.cmfEma5 !== null &&
          prev.cmfEma5 > prevPrev.cmfEma5;

        const wasAccumulation =
          !(
            (prev.c || 0) >
            (prev.senkouA && prev.senkouB
              ? Math.max(prev.senkouA, prev.senkouB)
              : 0)
          ) &&
          (prev.cmf || -1) > -0.05 &&
          isPrevCmfEmaUp;

        if (!wasAccumulation) {
          signals.push({
            t: current.t,
            type: "ACCUMULATION",
            reason: "吸籌 (Accumulation)",
            price: low * 0.99,
          });
        }
      }
    } else if (lastSignalState === "buy") {
      let exitTrigger = false;
      let pResult = "EXIT";

      const isPriceHigh = price > (prev.h || 0);
      if (isPriceHigh && isCmfEmaDown && (cmf || 0) < (prev.cmf || 0)) {
        signals.push({
          t: current.t,
          type: "EXIT",
          reason: "資金衰竭 (Exhaustion)",
          price: high * 1.02,
        });
      }

      const isKijunBreak = currKijun !== null && price < currKijun;
      if (isKijunBreak && (cmf || 0) < 0.05) {
        exitTrigger = true;
        pResult = "跌破基準 (Kijun Break)";
      }

      if (isBelowCloud) {
        exitTrigger = true;
        pResult = "趨勢崩壞 (Structure Break)";
      }

      const isTkDead =
        current.tenkan !== null &&
        current.kijun !== null &&
        current.tenkan < current.kijun;

      if (isTkDead && (cmf || 0) < 0) {
        exitTrigger = true;
        pResult = "空頭反轉 (TK Dead & CMF<0)";
      }

      if ((cmf || 0) < -0.05) {
        exitTrigger = true;
        pResult = "資金撤離 (CMF Stop)";
      }

      if (exitTrigger) {
        signals.push({
          t: current.t,
          type: "EXIT",
          reason: pResult,
          price: high * 1.02,
        });
        lastSignalState = "neutral";
      }
    }

    // --- CMF Divergence Logic (Integrated) ---
    const lookback = 20;
    if (i > 30) {
      // 1. Bullish Divergence (底背離)
      let minPriceIdx = i;
      for (let j = i - lookback; j < i; j++) {
        if (
          data[j].c !== null &&
          data[j].c! < (data[minPriceIdx].c || Infinity)
        )
          minPriceIdx = j;
      }

      if (minPriceIdx === i) {
        let prevMinPriceIdx = -1;
        const startIdx = Math.max(0, i - lookback * 2);
        for (let j = startIdx; j < i - lookback; j++) {
          if (
            data[j].c !== null &&
            (prevMinPriceIdx === -1 || data[j].c! < data[prevMinPriceIdx].c!)
          )
            prevMinPriceIdx = j;
        }

        if (prevMinPriceIdx !== -1 && data[i].c! < data[prevMinPriceIdx].c!) {
          if (
            data[i].cmf !== null &&
            data[prevMinPriceIdx].cmf !== null &&
            data[i].cmf! > data[prevMinPriceIdx].cmf!
          ) {
            signals.push({
              t: current.t,
              type: "DIVERGENCE_BULL",
              reason: "底背離：價格創新低但 CMF 資金流背離抬升",
              price: low * 0.98,
            });
          }
        }
      }

      // 2. Bearish Divergence (頂背離)
      let maxPriceIdx = i;
      for (let j = i - lookback; j < i; j++) {
        if (
          data[j].c !== null &&
          data[j].c! > (data[maxPriceIdx].c || -Infinity)
        )
          maxPriceIdx = j;
      }

      if (maxPriceIdx === i) {
        let prevMaxPriceIdx = -1;
        const startIdx = Math.max(0, i - lookback * 2);
        for (let j = startIdx; j < i - lookback; j++) {
          if (
            data[j].c !== null &&
            (prevMaxPriceIdx === -1 || data[j].c! > data[prevMaxPriceIdx].c!)
          )
            prevMaxPriceIdx = j;
        }

        if (prevMaxPriceIdx !== -1 && data[i].c! > data[prevMaxPriceIdx].c!) {
          if (
            data[i].cmf !== null &&
            data[prevMaxPriceIdx].cmf !== null &&
            data[i].cmf! < data[prevMaxPriceIdx].cmf!
          ) {
            signals.push({
              t: current.t,
              type: "DIVERGENCE_BEAR",
              reason: "頂背離：價格創新高但 CMF 資金流背離下降",
              price: high * 1.02,
            });
          }
        }
      }
    }
  });

  // --- Final Snapshot Analysis (Using the last real price bar) ---
  let lastRealIdx = -1;
  for (let k = data.length - 1; k >= 0; k--) {
    if (data[k].c !== null) {
      lastRealIdx = k;
      break;
    }
  }

  const lastAnalysis = analyzeIchimokuAtPoint(data, lastRealIdx);

  return {
    signals,
    lastAnalysis,
  };
};
