export interface MarketRegimeResult {
  mss: number;
  marketType: string;
  diagnostics: string[];
  bw: number;
  prevAtr: number;
}

export function calculateMarketRegime(
  deal: any,
  prevDeal: any,
  i: number,
  prevAtr: number,
  boll_data: any,
  ema5: number,
  ema10: number,
  ema60: number,
  ema60Series: number[],
  dmi_adx: number,
  prev_adx: number
): MarketRegimeResult {
  // --- Squeeze Pro Logic (BB vs KC) ---
  // 1. Calculate ATR for Keltner Channel
  let tr = deal.h - deal.l;
  if (i > 0 && prevDeal) {
    tr = Math.max(tr, Math.abs(deal.h - prevDeal.c), Math.abs(deal.l - prevDeal.c));
  }
  let atr = i === 0 ? tr : (prevAtr * 19 + tr) / 20; // 20-period ATR

  const kcWidth = (atr * 1.5) * 2; // Keltner Channel Width (Multiplier 1.5)
  const bbWidth = (boll_data.bollUb && boll_data.bollLb) ? (boll_data.bollUb - boll_data.bollLb) : 0;
  
  const isSqueeze = bbWidth < kcWidth; // Squeeze Pro core logic
  
  const slope = i >= 5 ? (ema60Series[i] - ema60Series[i - 5]) / 5 : 0;

  // --- Real-world Market Regime Classification ---
  let mss = 0;
  let marketType = "震盪";
  const diagnostics: string[] = [];

  if (isSqueeze) {
    marketType = "擠壓"; // Typical for low-vol range
    mss = 1;
    diagnostics.push("能量擠壓");
  } else {
    // BB > KC, expansion occurring
    const isAligned = (ema5 > ema10 && ema10 > ema60) || (ema5 < ema10 && ema10 < ema60);
    
    if (isAligned && Math.abs(slope) > (ema60 * 0.0005)) {
      marketType = "趨勢";
      mss = 4;
      diagnostics.push("發散趨勢");
    } else {
      marketType = "寬震";
      mss = 2.5;
      diagnostics.push("擴張洗盤");
    }
  }

  // Add momentum boost
  if (dmi_adx > 25 && dmi_adx > prev_adx) {
    mss += 1;
    diagnostics.push("動能強勁");
  }

  return { mss, marketType, diagnostics, bw: bbWidth, prevAtr: atr };
}

export function calculateGoldenDeathSignals(chartData: any[]) {
  const points: any[] = [];
  for (let i = 1; i < chartData.length; i++) {
    const prev = chartData[i - 1];
    const curr = chartData[i];
    if (
      prev.ema5 !== null &&
      prev.ema10 !== null &&
      curr.ema5 !== null &&
      curr.ema10 !== null
    ) {
      const price = curr.c || 0;
      const ema60 = curr.ema60 || 0;
      const sma200 = curr.sma200 || 0;

      if (prev.ema5 < prev.ema10 && curr.ema5 > curr.ema10) {
        // Golden Cross
        // Trend buy if price > ema60 AND price > sma200
        const isTrendBuy =
          ema60 > 0 && sma200 > 0 && price > ema60 && price > sma200;

        points.push({
          ...curr,
          type: "golden",
          subType: isTrendBuy ? "trend" : "rebound",
        });
      } else if (prev.ema5 > prev.ema10 && curr.ema5 < curr.ema10) {
        // Death Cross
        const isTrendSell =
          ema60 > 0 && sma200 > 0 && price < ema60 && price < sma200;

        points.push({
          ...curr,
          type: "death",
          subType: isTrendSell ? "trend" : "rebound",
        });
      }
    }
  }
  return points;
}
