import boll from "../cls_tools/boll";
import cmf from "../cls_tools/cmf";
import emaTool from "../cls_tools/ema";
import kd from "../cls_tools/kd";
import ma from "../cls_tools/ma";
import macd from "../cls_tools/macd";
import mfi from "../cls_tools/mfi";
import obv from "../cls_tools/obv";
import obvEma from "../cls_tools/obvEma";
import rsi from "../cls_tools/rsi";
import { IndicatorSettings } from "../hooks/useIndicatorSettings";
import { TaType } from "../types";
import { calculateAtrSupertrend, calculateKcRatchet } from "../pages/Detail/ATR/signalLogic";

export interface EnhancedDealData {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  ma5: number | null;
  ma10: number | null;
  ma20: number | null;
  ma60: number | null;
  ma120: number | null;
  ma240: number | null;
  deduction5: number | null;
  deduction10: number | null;
  deduction20: number | null;
  deduction60: number | null;
  deduction120: number | null;
  deduction240: number | null;
  volMa10: number | null;
  volMa20: number | null;
  bollMa: number | null;
  bollUb: number | null;
  bollLb: number | null;
  bandWidth: number | null;
  k: number | null;
  d: number | null;
  j: number | null;
  rsi: number | null;
  mfi: number | null;
  obv: number | null;
  obvEma: number | null;
  obvMa20: number | null;
  cmf: number | null;
  osc: number | null;
  dif: number | null;
  hma: number | null;
  ema50: number | null;
  atr: number | null;
  supertrend: number | null;
  trailStop: number | null;
  direction: number | null;
  buySignal: number | null;
  exitSignal: number | null;
  kcMiddle: number | null;
  kcLower: number | null;
  kcDynamicStop: number | null;
  kcExitSignal: number | null;
  trend: string;
}

/**
 * Utility to calculate all commonly used indicators at once.
 * This reduces boilerplate and ensure consistent calculation across components.
 */
export function calculateIndicators(
  deals: TaType[],
  settings: IndicatorSettings,
): EnhancedDealData[] {
  if (!deals || deals.length === 0) return [];

  let ma5Data = ma.init(deals[0], settings.ma5);
  let ma10Data = ma.init(deals[0], settings.ma10);
  let ma20Data = ma.init(deals[0], settings.ma20);
  let ma60Data = ma.init(deals[0], settings.ma60);
  let ma120Data = ma.init(deals[0], settings.ma120);
  let ma240Data = ma.init(deals[0], settings.ma240);
  let volMa10Data = ma.init({ ...deals[0], c: deals[0].v }, settings.ma10);
  let volMa20Data = ma.init({ ...deals[0], c: deals[0].v }, settings.ma20);
  let bollData = boll.init(deals[0]);
  let kdData = kd.init(deals[0], settings.kd);
  let rsiData = rsi.init(deals[0], settings.rsi);
  let mfiData = mfi.init(deals[0], settings.mfi);
  let macdData = macd.init(deals[0]);
  let obvData = obv.init(deals[0]);
  let obvEmaData = obvEma.init(obvData.obv, 10);
  let obvMa20Data = ma.init({ ...deals[0], c: obvData.obv }, 20);
  let cmfData = cmf.init(deals[0]);

  // ATR & SuperTrend state
  let prevAtr = 0;
  let prevFinalUpperBand = 0;
  let prevFinalLowerBand = 0;
  let prevSuperTrend = 0;
  let prevDirection = 1;

  // Volume filter state
  const volSeries: number[] = [];

  let ema50Data = emaTool.init(deals[0], settings.trendFilter || 50);
  let ema30Data = emaTool.init(deals[0], 30);
  const highSeries: number[] = [];

  // Keltner Channel (KC) state
  let kcEmaData = emaTool.init(deals[0], settings.kcLength || 20);
  let prevKcAtr = 0;
  let kcDynamicStop: number | null = null;

  return deals.map((deal, i) => {
    if (i > 0) {
      ma5Data = ma.next(deal, ma5Data, settings.ma5);
      ma10Data = ma.next(deal, ma10Data, settings.ma10);
      ma20Data = ma.next(deal, ma20Data, settings.ma20);
      ma60Data = ma.next(deal, ma60Data, settings.ma60);
      ma120Data = ma.next(deal, ma120Data, settings.ma120);
      ma240Data = ma.next(deal, ma240Data, settings.ma240);
      volMa10Data = ma.next({ ...deal, c: deal.v }, volMa10Data, settings.ma10);
      volMa20Data = ma.next({ ...deal, c: deal.v }, volMa20Data, settings.ma20);
      bollData = boll.next(deal, bollData, settings.boll);
      kdData = kd.next(deal, kdData, settings.kd);
      rsiData = rsi.next(deal, rsiData, settings.rsi);
      mfiData = mfi.next(deal, mfiData, settings.mfi);
      macdData = macd.next(deal, macdData);
      obvData = obv.next(deal, obvData);
      obvEmaData = obvEma.next(obvData.obv, obvEmaData, 10);
      obvMa20Data = ma.next({ ...deal, c: obvData.obv }, obvMa20Data, 20);
      cmfData = cmf.next(deal, cmfData, settings.cmf, settings.cmfEma);
    }

    const ma5 = ma5Data.ma ? ma5Data.ma : null;
    const ma10 = ma10Data.ma ? ma10Data.ma : null;
    const ma20 = ma20Data.ma ? ma20Data.ma : null;
    const ma60 = ma60Data.ma ? ma60Data.ma : null;
    const ma120 = ma120Data.ma ? ma120Data.ma : null;
    const ma240 = ma240Data.ma ? ma240Data.ma : null;

    const deduction5 =
      ma5Data.dataset && ma5Data.dataset.length >= settings.ma5
        ? ma5Data.dataset[0].t
        : null;
    const deduction10 =
      ma10Data.dataset && ma10Data.dataset.length >= settings.ma10
        ? ma10Data.dataset[0].t
        : null;
    const deduction20 =
      ma20Data.dataset && ma20Data.dataset.length >= settings.ma20
        ? ma20Data.dataset[0].t
        : null;
    const deduction60 =
      ma60Data.dataset && ma60Data.dataset.length >= settings.ma60
        ? ma60Data.dataset[0].t
        : null;
    const deduction120 =
      ma120Data.dataset && ma120Data.dataset.length >= settings.ma120
        ? ma120Data.dataset[0].t
        : null;
    const deduction240 =
      ma240Data.dataset && ma240Data.dataset.length >= settings.ma240
        ? ma240Data.dataset[0].t
        : null;

    const bollMa = bollData.bollMa ? bollData.bollMa : null;
    const bollUb = bollData.bollUb ? bollData.bollUb : null;
    const bollLb = bollData.bollLb ? bollData.bollLb : null;

    let bandWidth = null;
    if (bollUb !== null && bollLb !== null && bollMa !== null && bollMa !== 0) {
      bandWidth = (bollUb - bollLb) / bollMa;
    }

    const volMa10 = volMa10Data.ma ? volMa10Data.ma : null;
    const volMa20 = volMa20Data.ma ? volMa20Data.ma : null;

    let trend = "震盪";
    if (ma5 && ma10 && ma20 && ma60 && ma240) {
      if (ma5 > ma10 && ma10 > ma20 && ma20 > ma60 && ma60 > ma240)
        trend = "多頭";
      else if (ma5 < ma10 && ma10 < ma20 && ma20 < ma60 && ma60 < ma240)
        trend = "空頭";
    }

    // --- ATR & SuperTrend Calculation ---
    const atrLen = settings.atrLen || 14;
    const atrMult = settings.atrMult || 2.5;

    const atrState = {
      prevAtr,
      prevFinalUpperBand,
      prevFinalLowerBand,
      prevSuperTrend,
      prevDirection,
    };
    const atrResult = calculateAtrSupertrend(deal, i > 0 ? deals[i - 1] : null, i, atrLen, atrMult, atrState);
    
    prevAtr = atrResult.atr;
    prevFinalUpperBand = atrResult.finalUpperBand;
    prevFinalLowerBand = atrResult.finalLowerBand;
    prevSuperTrend = atrResult.supertrend;
    prevDirection = atrResult.direction;

    const atr = atrResult.atr;
    const supertrend = atrResult.supertrend;
    const direction = atrResult.direction;
    let buySignal = atrResult.buySignal;
    let exitSignal = atrResult.exitSignal;

    // --- HMA Calculation (Removed for performance and as per user request) ---
    const hmaVal = null;

    // --- V7 Strategy Calculations ---
    if (i > 0) {
      ema50Data = emaTool.next(deal, ema50Data, settings.trendFilter || 50);
    }
    const ema50 = ema50Data.ema;

    // Highest High of previous N days
    highSeries.push(deal.h);

    // ... existing ATR calculation is actually RMA, which is standard for Pinescript ta.atr
    // We'll keep the existing ATR logic but ensure it uses atrLen

    // --- Volume Filter & Signals ---
    volSeries.push(deal.v);
    if (volSeries.length > 5) volSeries.shift();

    // --- Keltner Channel (KC) Ratchet Logic ---
    if (i > 0) {
      kcEmaData = emaTool.next(deal, kcEmaData, settings.kcLength || 20);
    }
    const kcMiddle = kcEmaData.ema;

    const kcState = {
      prevKcAtr,
      kcDynamicStop,
    };
    const kcResult = calculateKcRatchet(deal, i > 0 ? deals[i - 1] : null, i, kcMiddle, settings.kcMult || 2.0, kcState);
    
    prevKcAtr = kcResult.kcAtr;
    kcDynamicStop = kcResult.kcDynamicStop;

    const kcLower = kcResult.kcLower;
    const kcExitSignal = kcResult.kcExitSignal;

    // --- 均線與信號邏輯 ---
    ema30Data = i === 0 ? ema30Data : emaTool.next(deal, ema30Data, 30);
    const ema30 = ema30Data.ema;
    let currentBarTrailStop = ema30;

    if (i > 0) {
      // 將 EMA 30 賦值給 trailStop 以供圖表橘線顯示
      currentBarTrailStop = ema30;
    }

    return {
      ...deal,
      ma5,
      ma10,
      ma20,
      ma60,
      ma120,
      ma240,
      deduction5,
      deduction10,
      deduction20,
      deduction60,
      deduction120,
      deduction240,
      volMa10,
      volMa20,
      bollMa,
      bollUb,
      bollLb,
      bandWidth,
      k: kdData.k ? kdData.k : null,
      d: kdData.d ? kdData.d : null,
      j: kdData.j ? kdData.j : null,
      rsi: rsiData.rsi ? rsiData.rsi : null,
      mfi: mfiData.mfi ? mfiData.mfi : null,
      obv: obvData.obv,
      obvEma: obvEmaData.ema,
      obvMa20: obvMa20Data.ma,
      cmf: cmfData.cmf,
      osc: macdData.osc ? macdData.osc : null,
      dif: macdData.dif ? macdData.dif[macdData.dif.length - 1] : null,
      hma: hmaVal,
      ema50,
      atr,
      supertrend,
      trailStop: currentBarTrailStop,
      direction,
      buySignal,
      exitSignal,
      kcMiddle,
      kcLower,
      kcDynamicStop,
      kcExitSignal,
      trend,
    };
  });
}
