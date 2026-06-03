export interface MssState {
  prevAtr: number;
  prevAdx: number;
  ema60History: number[];
}

export interface MssResult {
  mss: number;
  marketType: string;
  diagnostic: string;
  isSqueeze: boolean;
  bbWidth: number;
  kcWidth: number;
  atr: number;
}

const mss = {
  /**
   * Initialize MSS state
   */
  init(): MssState {
    return {
      prevAtr: 0,
      prevAdx: 0,
      ema60History: [],
    };
  },

  /**
   * Calculate next MSS value and state
   */
  next(
    deal: any,
    prevDeal: any | null,
    state: MssState,
    indicators: {
      ema5: number;
      ema10: number;
      ema60: number;
      bollUb: number | null;
      bollLb: number | null;
      adx: number;
    },
    index: number,
    options: {
      atrPeriod?: number;
      kcMultiplier?: number;
    } = {},
  ): MssResult & { state: MssState } {
    const { ema5, ema10, ema60, bollUb, bollLb, adx } = indicators;
    const { atrPeriod = 20, kcMultiplier = 1.5 } = options;
    const { prevAtr, prevAdx, ema60History } = state;

    // 1. Calculate TR and ATR (20-period by default)
    let tr = deal.h - deal.l;
    if (prevDeal) {
      tr = Math.max(
        tr,
        Math.abs(deal.h - prevDeal.c),
        Math.abs(deal.l - prevDeal.c),
      );
    }
    const atr =
      index === 0
        ? tr
        : (prevAtr * (atrPeriod - 1) + tr) / atrPeriod;

    // 2. Squeeze Pro Logic (Bollinger Bands vs Keltner Channels)
    const kcWidth = atr * kcMultiplier * 2;
    const bbWidth = bollUb && bollLb ? bollUb - bollLb : 0;
    const isSqueeze = bbWidth < kcWidth;

    // 3. Slope Calculation (EMA60 diff over 5 bars)
    const newEma60History = [...ema60History, ema60];
    if (newEma60History.length > 6) {
      newEma60History.shift();
    }

    const ema60Prev5 =
      newEma60History.length >= 6 ? newEma60History[0] : newEma60History[0];
    const slope =
      newEma60History.length >= 6 ? (ema60 - ema60Prev5) / 5 : 0;

    // 4. Regime Classification
    let currentMss = 0;
    let marketType = "震盪";
    const diagnostics: string[] = [];

    if (isSqueeze) {
      marketType = "擠壓";
      currentMss = 1;
      diagnostics.push("能量擠壓");
    } else {
      // Check EMA alignment
      const isAligned =
        (ema5 > ema10 && ema10 > ema60) || (ema5 < ema10 && ema10 < ema60);

      if (isAligned && Math.abs(slope) > ema60 * 0.0005) {
        marketType = "趨勢";
        currentMss = 4;
        diagnostics.push("發散趨勢");
      } else {
        marketType = "寬震";
        currentMss = 2.5;
        diagnostics.push("擴張洗盤");
      }
    }

    // 5. Momentum Boost (ADX criteria)
    if (adx > 25 && adx > prevAdx) {
      currentMss += 1;
      diagnostics.push("動能強勁");
    }

    return {
      mss: currentMss,
      marketType,
      diagnostic: diagnostics.join("|"),
      isSqueeze,
      bbWidth,
      kcWidth,
      atr,
      state: {
        prevAtr: atr,
        prevAdx: adx,
        ema60History: newEma60History,
      },
    };
  },
};

export default mss;
