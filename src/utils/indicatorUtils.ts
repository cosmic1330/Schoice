import boll from "../cls_tools/boll";
import kd from "../cls_tools/kd";
import ma from "../cls_tools/ma";
import macd from "../cls_tools/macd";
import mfi from "../cls_tools/mfi";
import rsi from "../cls_tools/rsi";
import { IndicatorSettings } from "../hooks/useIndicatorSettings";
import { TaType } from "../types";

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
  osc: number | null;
  trend: string;
}

/**
 * Utility to calculate all commonly used indicators at once.
 * This reduces boilerplate and ensure consistent calculation across components.
 */
export function calculateIndicators(
  deals: TaType[],
  settings: IndicatorSettings
): EnhancedDealData[] {
  if (!deals || deals.length === 0) return [];

  let ma5Data = ma.init(deals[0], settings.ma5);
  let ma10Data = ma.init(deals[0], settings.ma10);
  let ma20Data = ma.init(deals[0], settings.ma20);
  let ma60Data = ma.init(deals[0], settings.ma60);
  let ma120Data = ma.init(deals[0], settings.ma120);
  let ma240Data = ma.init(deals[0], settings.ma240);
  let bollData = boll.init(deals[0]);
  let kdData = kd.init(deals[0], settings.kd);
  let rsiData = rsi.init(deals[0], settings.rsi);
  let mfiData = mfi.init(deals[0], settings.mfi);
  let macdData = macd.init(deals[0]);

  return deals.map((deal, i) => {
    if (i > 0) {
      ma5Data = ma.next(deal, ma5Data, settings.ma5);
      ma10Data = ma.next(deal, ma10Data, settings.ma10);
      ma20Data = ma.next(deal, ma20Data, settings.ma20);
      ma60Data = ma.next(deal, ma60Data, settings.ma60);
      ma120Data = ma.next(deal, ma120Data, settings.ma120);
      ma240Data = ma.next(deal, ma240Data, settings.ma240);
      bollData = boll.next(deal, bollData, settings.boll);
      kdData = kd.next(deal, kdData, settings.kd);
      rsiData = rsi.next(deal, rsiData, settings.rsi);
      mfiData = mfi.next(deal, mfiData, settings.mfi);
      macdData = macd.next(deal, macdData);
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
    const deductionBoll =
      bollData.dataset && bollData.dataset.length >= settings.boll
        ? bollData.dataset[0].t
        : null;

    const bollMa = bollData.bollMa ? bollData.bollMa : null;
    const bollUb = bollData.bollUb ? bollData.bollUb : null;
    const bollLb = bollData.bollLb ? bollData.bollLb : null;

    let bandWidth = null;
    if (bollUb !== null && bollLb !== null && bollMa !== null && bollMa !== 0) {
      bandWidth = (bollUb - bollLb) / bollMa;
    }

    // Volume MAs
    let volMa10: number | null = null;
    let volMa20: number | null = null;

    if (i >= settings.ma10 - 1) {
      let sumV = 0;
      for (let j = 0; j < settings.ma10; j++) sumV += deals[i - j].v || 0;
      volMa10 = sumV / settings.ma10;
    }
    if (i >= settings.ma20 - 1) {
      let sumV = 0;
      for (let j = 0; j < settings.ma20; j++) sumV += deals[i - j].v || 0;
      volMa20 = sumV / settings.ma20;
    }

    let trend = "震盪";
    if (ma5 && ma10 && ma20 && ma60 && ma240) {
      if (ma5 > ma10 && ma10 > ma20 && ma20 > ma60 && ma60 > ma240)
        trend = "多頭";
      else if (ma5 < ma10 && ma10 < ma20 && ma20 < ma60 && ma60 < ma240)
        trend = "空頭";
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
      deductionBoll,
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
      osc: macdData.osc ? macdData.osc : null,
      trend,
    };
  });
}
