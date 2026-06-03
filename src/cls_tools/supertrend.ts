export interface SupertrendState {
  prevAtr: number;
  prevFinalUpperBand: number;
  prevFinalLowerBand: number;
  prevSuperTrend: number | null;
  prevDirection: number; // 1 for downtrend (sell), -1 for uptrend (buy)
}

const supertrend = {
  init(_: any): SupertrendState {
    return {
      prevAtr: 0,
      prevFinalUpperBand: 0,
      prevFinalLowerBand: 0,
      prevSuperTrend: null,
      prevDirection: 1,
    };
  },

  next(
    deal: any,
    prevDeal: any | null,
    state: SupertrendState,
    period: number = 14,
    multiplier: number = 2.5,
    index: number,
  ) {
    let {
      prevAtr,
      prevFinalUpperBand,
      prevFinalLowerBand,
      prevSuperTrend,
      prevDirection,
    } = state;

    // 1. Calculate TR (True Range)
    let tr = deal.h - deal.l;
    if (prevDeal) {
      tr = Math.max(
        tr,
        Math.abs(deal.h - prevDeal.c),
        Math.abs(deal.l - prevDeal.c),
      );
    }

    // 2. Calculate ATR (using RMA - same as TradingView)
    let atr = tr;
    if (index === 0) {
      atr = tr;
    } else if (index < period) {
      atr = (prevAtr * index + tr) / (index + 1);
    } else {
      atr = (prevAtr * (period - 1) + tr) / period;
    }

    // 3. Basic Bands
    const src = (deal.h + deal.l) / 2;
    const basicUpperBand = src + multiplier * atr;
    const basicLowerBand = src - multiplier * atr;

    // 4. Final Bands
    let finalUpperBand = basicUpperBand;
    let finalLowerBand = basicLowerBand;

    if (index > 0 && prevDeal) {
      // Upper Band
      if (
        basicUpperBand < prevFinalUpperBand ||
        prevDeal.c > prevFinalUpperBand
      ) {
        finalUpperBand = basicUpperBand;
      } else {
        finalUpperBand = prevFinalUpperBand;
      }

      // Lower Band
      if (
        basicLowerBand > prevFinalLowerBand ||
        prevDeal.c < prevFinalLowerBand
      ) {
        finalLowerBand = basicLowerBand;
      } else {
        finalLowerBand = prevFinalLowerBand;
      }
    }

    // 5. Direction and Supertrend
    let direction = prevDirection;
    if (index > 0) {
      if (prevSuperTrend === null || prevSuperTrend === prevFinalUpperBand) {
        direction = deal.c > finalUpperBand ? -1 : 1;
      } else {
        direction = deal.c < finalLowerBand ? 1 : -1;
      }
    }

    const stValue = direction === -1 ? finalLowerBand : finalUpperBand;
    const supertrendValue = stValue <= 0 ? null : stValue;

    // 6. Return new state and result
    return {
      value: supertrendValue,
      direction: direction,
      atr,
      state: {
        prevAtr: atr,
        prevFinalUpperBand: finalUpperBand,
        prevFinalLowerBand: finalLowerBand,
        prevSuperTrend: supertrendValue,
        prevDirection: direction,
      },
    };
  },
};

export default supertrend;
