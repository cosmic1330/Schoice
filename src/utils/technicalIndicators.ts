import { TaType } from "../types";

export const calculateSMA = (
  data: number[],
  period: number
): (number | null)[] => {
  const sma = new Array(data.length).fill(null);
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma[i] = sum / period;
  }
  return sma;
};

export const calculateRSI = (
  closes: number[],
  period: number = 14
): (number | null)[] => {
  const rsi = new Array(closes.length).fill(null);
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    gains.push(Math.max(0, diff));
    losses.push(Math.max(0, -diff));
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < closes.length; i++) {
    if (i > period) {
      const currentGain = gains[i - 1];
      const currentLoss = losses[i - 1];
      avgGain = (avgGain * (period - 1) + currentGain) / period;
      avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
    }

    if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi[i] = 100 - 100 / (1 + rs);
    }
  }
  return rsi;
};

export const calculateMFI = (
  deals: TaType[],
  period: number = 14
): (number | null)[] => {
  const mfi = new Array(deals.length).fill(null);
  const typicalPrices = deals.map((d) => (d.h + d.l + d.c) / 3);
  const rawMoneyFlow = typicalPrices.map((tp, i) => tp * deals[i].v);

  for (let i = period; i < deals.length; i++) {
    let positiveFlow = 0;
    let negativeFlow = 0;

    for (let j = i - period + 1; j <= i; j++) {
      if (typicalPrices[j] > typicalPrices[j - 1]) {
        positiveFlow += rawMoneyFlow[j];
      } else if (typicalPrices[j] < typicalPrices[j - 1]) {
        negativeFlow += rawMoneyFlow[j];
      }
    }

    if (negativeFlow === 0) {
      mfi[i] = 100;
    } else {
      const moneyRatio = positiveFlow / negativeFlow;
      mfi[i] = 100 - 100 / (1 + moneyRatio);
    }
  }
  return mfi;
};

export const calculateATR = (
  deals: TaType[],
  period: number = 14
): (number | null)[] => {
  const atr = new Array(deals.length).fill(null);
  const trs: number[] = [0]; // First TR is 0 or high-low

  for (let i = 1; i < deals.length; i++) {
    const high = deals[i].h;
    const low = deals[i].l;
    const prevClose = deals[i - 1].c;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trs.push(tr);
  }

  // First ATR is simple average of TRs
  let currentATR = trs.slice(0, period + 1).reduce((a, b) => a + b, 0) / period; // approximate start
  // Actually standard Wilder's smoothing starts after period
  // Let's use simple SMA for first point at index `period`

  // Refined: First ATR at index `period` is mean of TR[1]..TR[period]
  currentATR = trs.slice(1, period + 1).reduce((a, b) => a + b, 0) / period;
  atr[period] = currentATR;

  for (let i = period + 1; i < deals.length; i++) {
    currentATR = (currentATR * (period - 1) + trs[i]) / period;
    atr[i] = currentATR;
  }

  return atr;
};

export const calculateBollingerBands = (
  closes: number[],
  period: number = 20,
  stdDev: number = 2
): {
  upper: (number | null)[];
  mid: (number | null)[];
  lower: (number | null)[];
} => {
  const upper = new Array(closes.length).fill(null);
  const mid = new Array(closes.length).fill(null);
  const lower = new Array(closes.length).fill(null);

  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const squaredDiffs = slice.map((x) => Math.pow(x - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const std = Math.sqrt(variance);

    mid[i] = mean;
    upper[i] = mean + std * stdDev;
    lower[i] = mean - std * stdDev;
  }

  return { upper, mid, lower };
};

export const calculateDMI = (
  deals: TaType[],
  period: number = 14
): {
  diPlus: (number | null)[];
  diMinus: (number | null)[];
  adx: (number | null)[];
} => {
  const diPlus = new Array(deals.length).fill(null);
  const diMinus = new Array(deals.length).fill(null);
  const adx = new Array(deals.length).fill(null);

  const trs: number[] = [];
  const plusDMs: number[] = [];
  const minusDMs: number[] = [];

  // 1. Calculate TR, +DM, -DM
  for (let i = 0; i < deals.length; i++) {
    if (i === 0) {
      trs.push(0);
      plusDMs.push(0);
      minusDMs.push(0);
      continue;
    }

    const h = deals[i].h;
    const l = deals[i].l;
    const prevC = deals[i - 1].c;
    const prevH = deals[i - 1].h;
    const prevL = deals[i - 1].l;

    const tr = Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC));
    trs.push(tr);

    const upMove = h - prevH;
    const downMove = prevL - l;

    if (upMove > downMove && upMove > 0) {
      plusDMs.push(upMove);
    } else {
      plusDMs.push(0);
    }

    if (downMove > upMove && downMove > 0) {
      minusDMs.push(downMove);
    } else {
      minusDMs.push(0);
    }
  }

  // 2. Smooth Values (Wilder's Smoothing)
  // First period: Simple Sum
  let trSmooth = 0;
  let plusDMSmooth = 0;
  let minusDMSmooth = 0;

  for (let i = 1; i <= period; i++) {
    trSmooth += trs[i];
    plusDMSmooth += plusDMs[i];
    minusDMSmooth += minusDMs[i];
  }

  // Calculate first ADX components
  // Need DX for ADX
  const dxs: (number | null)[] = new Array(deals.length).fill(null);

  for (let i = period; i < deals.length; i++) {
    if (i > period) {
      trSmooth = trSmooth - trSmooth / period + trs[i];
      plusDMSmooth = plusDMSmooth - plusDMSmooth / period + plusDMs[i];
      minusDMSmooth = minusDMSmooth - minusDMSmooth / period + minusDMs[i];
    }

    const dip = (plusDMSmooth / trSmooth) * 100;
    const dim = (minusDMSmooth / trSmooth) * 100;

    diPlus[i] = dip;
    diMinus[i] = dim;

    const dx = (Math.abs(dip - dim) / (dip + dim)) * 100;
    dxs[i] = dx;
  }

  // 3. Calculate ADX
  // First ADX is average of period DXs
  // But wait, standard ADX smoothing is also Wilder's or SMA.
  // Standard: First ADX = Ave(DX, period). Subsequent = ((prevADX * (n-1)) + currentDX) / n

  // Find where we have enough DXs (start at index `period`)
  // We need `period` count of DXs to calculate first ADX at index `period * 2 - 1`?
  // Usually ADX starts showing up later.

  // Let's iterate from start of valid DX
  const adxStart = period * 2 - 1;

  if (adxStart < deals.length) {
    // Sum first period DXs
    let sumDX = 0;
    for (let j = period; j < period + period; j++) {
      sumDX += dxs[j] || 0;
    }
    let currentADX = sumDX / period;
    adx[adxStart] = currentADX;

    for (let i = adxStart + 1; i < deals.length; i++) {
      currentADX = (currentADX * (period - 1) + (dxs[i] || 0)) / period;
      adx[i] = currentADX;
    }
  }

  return { diPlus, diMinus, adx };
};
