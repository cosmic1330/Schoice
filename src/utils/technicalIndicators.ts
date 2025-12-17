import { TaType } from "../types";

export const calculateSMA = (data: number[], period: number): (number | null)[] => {
  const sma = new Array(data.length).fill(null);
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma[i] = sum / period;
  }
  return sma;
};

export const calculateRSI = (closes: number[], period: number = 14): (number | null)[] => {
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
      rsi[i] = 100 - (100 / (1 + rs));
    }
  }
  return rsi;
};

export const calculateMFI = (deals: TaType[], period: number = 14): (number | null)[] => {
  const mfi = new Array(deals.length).fill(null);
  const typicalPrices = deals.map(d => (d.h + d.l + d.c) / 3);
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
      mfi[i] = 100 - (100 / (1 + moneyRatio));
    }
  }
  return mfi;
};

export const calculateATR = (deals: TaType[], period: number = 14): (number | null)[] => {
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
  currentATR = trs.slice(1, period + 1).reduce((a,b) => a+b, 0) / period;
  atr[period] = currentATR;

  for(let i = period + 1; i < deals.length; i++) {
    currentATR = ((currentATR * (period - 1)) + trs[i]) / period;
    atr[i] = currentATR;
  }
  
  return atr;
};

export const calculateBollingerBands = (closes: number[], period: number = 20, stdDev: number = 2): { upper: (number | null)[], mid: (number | null)[], lower: (number | null)[] } => {
  const upper = new Array(closes.length).fill(null);
  const mid = new Array(closes.length).fill(null);
  const lower = new Array(closes.length).fill(null);

  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const squaredDiffs = slice.map(x => Math.pow(x - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const std = Math.sqrt(variance);

    mid[i] = mean;
    upper[i] = mean + (std * stdDev);
    lower[i] = mean - (std * stdDev);
  }

  return { upper, mid, lower };
};
