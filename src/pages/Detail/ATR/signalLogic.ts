export interface AtrSupertrendState {
  prevAtr: number;
  prevFinalUpperBand: number;
  prevFinalLowerBand: number;
  prevSuperTrend: number;
  prevDirection: number;
}

export interface AtrSupertrendResult {
  atr: number;
  supertrend: number;
  direction: number;
  finalUpperBand: number;
  finalLowerBand: number;
  buySignal: number | null;
  exitSignal: number | null;
}

export function calculateAtrSupertrend(
  deal: any,
  prevDeal: any,
  i: number,
  atrLen: number,
  atrMult: number,
  state: AtrSupertrendState
): AtrSupertrendResult {
  let tr = deal.h - deal.l;
  if (i > 0 && prevDeal) {
    tr = Math.max(
      tr,
      Math.abs(deal.h - prevDeal.c),
      Math.abs(deal.l - prevDeal.c)
    );
  }

  let atr = tr;
  if (i === 0) {
    atr = tr;
  } else if (i < atrLen) {
    atr = (state.prevAtr * i + tr) / (i + 1);
  } else {
    atr = (state.prevAtr * (atrLen - 1) + tr) / atrLen; // RMA
  }

  const src = (deal.h + deal.l) / 2;
  const basicUpperBand = src + atrMult * atr;
  const basicLowerBand = src - atrMult * atr;

  let finalUpperBand = basicUpperBand;
  let finalLowerBand = basicLowerBand;

  if (i > 0 && prevDeal) {
    if (
      basicUpperBand < state.prevFinalUpperBand ||
      prevDeal.c > state.prevFinalUpperBand
    ) {
      finalUpperBand = basicUpperBand;
    } else {
      finalUpperBand = state.prevFinalUpperBand;
    }

    if (
      basicLowerBand > state.prevFinalLowerBand ||
      prevDeal.c < state.prevFinalLowerBand
    ) {
      finalLowerBand = basicLowerBand;
    } else {
      finalLowerBand = state.prevFinalLowerBand;
    }
  }

  let direction = state.prevDirection;
  let supertrend = 0;

  if (i > 0) {
    if (state.prevSuperTrend === state.prevFinalUpperBand) {
      direction = deal.c > finalUpperBand ? -1 : 1;
    } else {
      direction = deal.c < finalLowerBand ? 1 : -1;
    }
  }
  supertrend = direction === -1 ? finalLowerBand : finalUpperBand;

  let buySignal = null;
  let exitSignal = null;

  if (i > 0) {
    // 進場：價格站上 Supertrend (由空轉多)
    if (state.prevDirection === 1 && direction === -1) {
      buySignal = deal.l * 0.98;
    }
    // 出場：價格跌破 Supertrend (由多轉空)
    if (state.prevDirection === -1 && direction === 1) {
      exitSignal = deal.h * 1.02;
    }
  }

  return {
    atr,
    supertrend,
    direction,
    finalUpperBand,
    finalLowerBand,
    buySignal,
    exitSignal,
  };
}

export interface KcRatchetState {
  prevKcAtr: number;
  kcDynamicStop: number | null;
}

export interface KcRatchetResult {
  kcAtr: number;
  kcLower: number;
  kcDynamicStop: number;
  kcExitSignal: number | null;
}

export function calculateKcRatchet(
  deal: any,
  prevDeal: any,
  i: number,
  kcMiddle: number,
  kcMult: number,
  state: KcRatchetState
): KcRatchetResult {
  let tr = deal.h - deal.l;
  if (i > 0 && prevDeal) {
    tr = Math.max(
      tr,
      Math.abs(deal.h - prevDeal.c),
      Math.abs(deal.l - prevDeal.c)
    );
  }

  const kcAtrLen = 10;
  let kcAtr = tr;
  if (i === 0) {
    kcAtr = tr;
  } else if (i < kcAtrLen) {
    kcAtr = (state.prevKcAtr * i + tr) / (i + 1);
  } else {
    kcAtr = (state.prevKcAtr * (kcAtrLen - 1) + tr) / kcAtrLen;
  }

  const kcLower = kcMiddle - kcAtr * kcMult;

  const currentKcLower = kcLower;
  const newKcDynamicStop = Math.max(currentKcLower, state.kcDynamicStop || currentKcLower);

  let kcExitSignal = null;
  if (
    i > 0 &&
    prevDeal &&
    prevDeal.c >= (state.kcDynamicStop || 0) &&
    deal.c < newKcDynamicStop
  ) {
    kcExitSignal = deal.h * 1.01;
  }

  return {
    kcAtr,
    kcLower,
    kcDynamicStop: newKcDynamicStop,
    kcExitSignal,
  };
}
