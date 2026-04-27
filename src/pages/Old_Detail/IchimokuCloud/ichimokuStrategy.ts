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
  type: "BUY" | "SELL" | "FAKE" | "ACCUMULATION" | "WEAKNESS" | "EXIT";
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
}

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

    // Cloud Thickness (Simple visual approximation: SpanA - SpanB)
    const cloudThickness = (current.senkouA || 0) - (current.senkouB || 0);
    const isThickCloud = Math.abs(cloudThickness) > price * 0.005; // Arbitrary threshold for "Thick"

    // 2. TK Cross / State
    const isTkGold =
      current.tenkan !== null &&
      current.kijun !== null &&
      current.tenkan > current.kijun;
    const isTkDead =
      current.tenkan !== null &&
      current.kijun !== null &&
      current.tenkan < current.kijun;

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
      // 1. Price > Cloud
      // 2. TK Gold (Tenkan > Kijun) AND Kijun Stable (Flat/Up)
      // 3. CMF > 0 AND EMA5 Up

      const isStrongBullish =
        isAboveCloud && isTkGold && isKijunStable && isCmfBull && isCmfEmaUp;

      if (isStrongBullish) {
        // Thick Cloud Confirmation
        const reason = isThickCloud
          ? "強勢買進 (Strong Buy)"
          : "強勢買進 (注意薄雲風險/Weak Cloud)";

        signals.push({
          t: current.t,
          type: "BUY",
          reason: reason,
          price: low * 0.98,
        });
        lastSignalState = "buy";
      }

      // B. Early Accumulation (CMF Leading)
      // Scenario: Price in Cloud or Below, but CMF > -0.05 and Rising
      // Logic: Price Lows not rising, but CMF rising (Divergence approx)
      const isAccumulation =
        (isInCloud || isBelowCloud) && (cmf || -1) > -0.05 && isCmfEmaUp;

      // We only mark accumulation if we haven't marked it recently? Or just once.
      // Let's make it a unique signal type that doesn't trigger "buy" state but visualizes it.
      if (isAccumulation) {
        // Check if prev was not matching to avoid spam
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

      // C. Fake Breakout (Warning)
      // Break Cloud but CMF < 0
      const isCloudBreak =
        isAboveCloud &&
        !(
          (prev.c || 0) >
          (prev.senkouA && prev.senkouB
            ? Math.max(prev.senkouA, prev.senkouB)
            : 0)
        );
      if (isCloudBreak && !isCmfBull) {
        signals.push({
          t: current.t,
          type: "FAKE",
          reason: "假突破 (Fake Break)",
          price: high * 1.02,
        });
      }
    } else if (lastSignalState === "buy") {
      // Exit Logic - Professional

      let exitTrigger = false;
      let pResult = "EXIT";

      // 1. Funding Exhaustion (Divergence) - 1/2 Exit
      // Price New High (vs prev) but CMF EMA5 Down
      const isPriceHigh = price > (prev.h || 0); // Simple proxy
      if (isPriceHigh && isCmfEmaDown && (cmf || 0) < (prev.cmf || 0)) {
        // This is "Weakness", usually Partial Exit.
        // We mark it as WEAKNESS
        signals.push({
          t: current.t,
          type: "WEAKNESS",
          reason: "資金衰竭 (Exhaustion)",
          price: high * 1.02,
        });
        // Do we change state? No, partial exit.
      }

      // 2. Kijun Break (Full Exit)
      // Price < Kijun AND CMF < 0.05
      const isKijunBreak = currKijun !== null && price < currKijun;
      if (isKijunBreak && (cmf || 0) < 0.05) {
        exitTrigger = true;
        pResult = "跌破基準 (Kijun Break)";
      }

      // 3. Cloud Break (Hard Stop)
      if (isBelowCloud) {
        exitTrigger = true;
        pResult = "趨勢崩壞 (Structure Break)";
      }

      // 4. TK Dead Cross (Trend Reversal Warning)
      // "When TK Dead Cross and CMF drops below 0"
      if (isTkDead && (cmf || 0) < 0) {
        exitTrigger = true;
        pResult = "空頭反轉 (TK Dead & CMF<0)";
      }

      // 5. Hard CMF Stop (Risk Management)
      if ((cmf || 0) < -0.05) {
        // "Stop Loss adjustment: if CMF drops below -0.05"
        // This might be too aggressive for full exit, but let's signal weakness/exit
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
  });

  let currentIdx = -1;
  for (let k = data.length - 1; k >= 0; k--) {
    if (data[k].c !== null) {
      currentIdx = k;
      break;
    }
  }

  if (currentIdx === -1) {
    return {
      signals,
      lastAnalysis: { steps: [], score: 0, recommendation: "No Data" },
    };
  }

  const current = data[currentIdx];
  const price = current.c || 0;

  // Re-calc metrics for current candle
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
  // Slope approx
  const prevCmfEma5 = currentIdx > 0 ? data[currentIdx - 1].cmfEma5 || 0 : 0;
  const isCmfSlopeUp = cmfEma5 > prevCmfEma5;

  const isTkGold =
    current.tenkan !== null &&
    current.kijun !== null &&
    current.tenkan > current.kijun;
  const isTkDead =
    current.tenkan !== null &&
    current.kijun !== null &&
    current.tenkan < current.kijun;
  const isKijunFlat =
    current.kijun !== null &&
    currentIdx > 0 &&
    Math.abs(current.kijun - (data[currentIdx - 1].kijun || 0)) < 0.001; // Approx

  // Matrix Logic
  let rec = "觀望 (Wait)";
  let score = 0;

  // Condition 1: Strong Buy (Main Trend)
  if (isAboveCloud && isThickCloud && isTkGold && cmf > 0.15 && isCmfSlopeUp) {
    rec = "重倉持有 (Strong Buy)";
    score = 90;
  }
  // Condition 2: Trap (Fake)
  else if (isAboveCloud && !isThickCloud && cmf < 0) {
    rec = "誘多陷阱 (Fakeout Risk)";
    score = 20;
  }
  // Condition 3: Distribution (High)
  else if (isAboveCloud && isKijunFlat && cmf > 0 && cmf < 0.1) {
    // CMF dropping? Hard to track exact drop magnitude here without history scan
    rec = "高位派發 (Distribution)";
    score = 50;
  }
  // Condition 4: Left Side (Accumulation)
  else if (!isAboveCloud && cmf > -0.05 && cmfEma5 > prevCmfEma5) {
    // Rising CMF at bottom
    rec = "左側試探 (Early Entry)";
    score = 65;
  }
  // Condition 5: Bearish
  else if (!isAboveCloud && isTkDead && cmf < -0.1) {
    rec = "絕對空倉 (Strong Sell)";
    score = 10;
  } else {
    // Default
    if (isAboveCloud && cmf > 0) {
      rec = "持有 (Hold)";
      score = 70;
    }
  }

  // Analysis Steps
  const analysisSteps = [
    {
      label: "I. 策略矩陣",
      description: `狀態: ${rec}`,
      checks: [
        {
          label: `建議: ${rec}`,
          status:
            score >= 60 ? "pass" : score <= 20 ? "fail" : ("manual" as any),
        },
        {
          label: `CMF: ${cmf.toFixed(3)} (EMA5: ${cmfEma5.toFixed(3)})`,
          status: cmf > 0 ? "pass" : "fail",
        },
      ],
    },
    {
      label: "II. 結構位",
      description: "雲層與TK狀態",
      checks: [
        {
          label: "價格 > 雲層",
          status: isAboveCloud ? "pass" : "fail",
        },
        {
          label: isThickCloud ? "厚雲支撐 (Strong)" : "薄雲易破 (Weak)",
          status: isThickCloud ? "pass" : "manual",
        },
        {
          label: isTkGold ? "TK 金叉 (Bull)" : "TK 死叉/無向 (Bear)",
          status: isTkGold ? "pass" : "fail",
        },
      ],
    },
    {
      label: "III. 資金流",
      description: "CMF 動能",
      checks: [
        {
          label: "CMF > 0",
          status: cmf > 0 ? "pass" : "fail",
        },
        {
          label: isCmfSlopeUp ? "資金加速 (Slope Up)" : "資金減速 (Slope Down)",
          status: isCmfSlopeUp ? "pass" : "fail",
        },
        {
          label: "強勢區 (>0.15)",
          status: cmf > 0.15 ? "pass" : "manual",
        },
      ],
    },
  ];

  return {
    signals,
    lastAnalysis: { steps: analysisSteps, score, recommendation: rec },
  };
};
