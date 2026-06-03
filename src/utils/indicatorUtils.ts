import boll from "../cls_tools/boll";
import cmf from "../cls_tools/cmf";
import emaTool from "../cls_tools/ema";
import kd from "../cls_tools/kd";
import ma from "../cls_tools/ma";
import vma from "../cls_tools/vma";
import supertrendTool from "../cls_tools/supertrend";
import macd from "../cls_tools/macd";
import mfi from "../cls_tools/mfi";
import obv from "../cls_tools/obv";
import obvEma from "../cls_tools/obvEma";
import donchianTool from "../cls_tools/donchian";
import rsi from "../cls_tools/rsi";
import cciTool from "../cls_tools/cci";
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
  deduction240: number | null;
  ema30: number | null;
  vma20: number | null;
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
  supertrend: number | null;
  donchianUb: number | null;
  donchianLb: number | null;
  donchianMa: number | null;
  cci: number | null;
  ema200: number | null;
}

/**
 * Utility to calculate all commonly used indicators at once.
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
  let vma20Data = vma.init(deals[0], 20);
  let ema30Data = emaTool.init(deals[0], 30);
  let ema200Data = emaTool.init(deals[0], 200);
  let bollData = boll.init(deals[0]);
  let kdData = kd.init(deals[0], settings.kd);
  let rsiData = rsi.init(deals[0], settings.rsi);
  let mfiData = mfi.init(deals[0], settings.mfi);
  let macdData = macd.init(deals[0]);
  let obvData = obv.init(deals[0]);
  let obvEmaData = obvEma.init(obvData.obv, 10);
  let obvMa20Data = ma.init({ ...deals[0], c: obvData.obv }, 20);
  let cmfData = cmf.init(deals[0]);
  let stState = supertrendTool.init(deals[0]);
  let donchianState = donchianTool.init();
  let cciState = cciTool.init();

  return deals.map((deal, i) => {
    const prevDeal = i > 0 ? deals[i - 1] : null;

    if (i > 0) {
      ma5Data = ma.next(deal, ma5Data, settings.ma5);
      ma10Data = ma.next(deal, ma10Data, settings.ma10);
      ma20Data = ma.next(deal, ma20Data, settings.ma20);
      ma60Data = ma.next(deal, ma60Data, settings.ma60);
      ma120Data = ma.next(deal, ma120Data, settings.ma120);
      ma240Data = ma.next(deal, ma240Data, settings.ma240);
      ema30Data = emaTool.next(deal, ema30Data, 30);
      ema200Data = emaTool.next(deal, ema200Data, 200);
      vma20Data = vma.next(deal, vma20Data, 20);
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

    // CCI calculation
    const cciResult = cciTool.next(deal, cciState, settings.cci || 14);
    cciState = cciResult.state;

    // Supertrend calculation
    const stResult = supertrendTool.next(
      deal,
      prevDeal,
      stState,
      settings.atrLen,
      settings.atrMult,
      i
    );
    stState = stResult.state;

    // Donchian Channel calculation
    const donchianResult = donchianTool.next(
      deal,
      donchianState,
      settings.donchian || 20
    );
    donchianState = donchianResult.state;

    const ma5 = ma5Data.ma ? ma5Data.ma : null;
    const ma10 = ma10Data.ma ? ma10Data.ma : null;
    const ma20 = ma20Data.ma ? ma20Data.ma : null;
    const ma60 = ma60Data.ma ? ma60Data.ma : null;
    const ma120 = ma120Data.ma ? ma120Data.ma : null;
    const ma240 = ma240Data.ma ? ma240Data.ma : null;
    const ema30 = ema30Data.ema ? ema30Data.ema : null;
    const ema200 = ema200Data.ema ? ema200Data.ema : null;
    const vma20 = vma20Data.vma ? vma20Data.vma : null;

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
      ema30,
      vma20,
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
      supertrend: stResult.value,
      donchianUb: donchianResult.upper,
      donchianLb: donchianResult.lower,
      donchianMa: donchianResult.middle,
      cci: cciResult.cci,
      ema200,
    };
  });
}

