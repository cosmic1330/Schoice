import {
  Boll,
  Ema,
  Kd,
  Ma,
  Macd,
  Mfi,
  Obv,
  ObvEma,
  Rsi,
} from "@ch20026103/anysis";
import { useMemo } from "react";
import { SkillsTableType, TaListType } from "../types";

export type FormatDataRow = Omit<SkillsTableType, "stock_id" | "t"> & {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

export default function useFormatSkillData(data: TaListType) {
  const formatData = useMemo<FormatDataRow[]>(() => {
    if (!data || data.length === 0) return [];
    const deals: FormatDataRow[] = [];

    const boll = new Boll();
    const ma = new Ma();
    const ema = new Ema();
    const macd = new Macd();
    const kd = new Kd();
    const rsi = new Rsi();
    const obv = new Obv();
    const obvEma = new ObvEma();
    const mfi = new Mfi();

    const init = data[0];
    let ma5_data = ma.init(init, 5);
    let ma10_data = ma.init(init, 10);
    let ma20_data = ma.init(init, 20);
    let ma60_data = ma.init(init, 60);
    let ma120_data = ma.init(init, 120);
    let ema5_data = ema.init(init, 5);
    let ema10_data = ema.init(init, 10);
    let ema20_data = ema.init(init, 20);
    let ema60_data = ema.init(init, 60);
    let ema120_data = ema.init(init, 120);
    let boll_data = boll.init(init);
    let macd_data = macd.init(init);
    let kd_data = kd.init(init, 9);
    let rsi5_data = rsi.init(init, 5);
    let rsi10_data = rsi.init(init, 10);
    let obv_data = obv.init(init);
    let obv_ma5_data = obvEma.init(obv_data.obv, 5);
    let obv_ma10_data = obvEma.init(obv_data.obv, 10);
    let obv_ma20_data = obvEma.init(obv_data.obv, 20);
    let obv_ma60_data = obvEma.init(obv_data.obv, 60);
    let mfi_data = mfi.init(init, 14);

    deals.push({
      ...init,
      ma5: ma5_data.ma,
      ma5_ded: ma5_data.exclusionValue["d-1"],
      ma10: ma10_data.ma,
      ma10_ded: ma10_data.exclusionValue["d-1"],
      ma20: ma20_data.ma,
      ma20_ded: ma20_data.exclusionValue["d-1"],
      ma60: ma60_data.ma,
      ma60_ded: ma60_data.exclusionValue["d-1"],
      ma120: ma120_data.ma,
      ma120_ded: ma120_data.exclusionValue["d-1"],
      ema5: ema5_data.ema,
      ema10: ema10_data.ema,
      ema20: ema20_data.ema,
      ema60: ema60_data.ema,
      ema120: ema120_data.ema,
      macd: macd_data.macd,
      dif: macd_data.dif[macd_data.dif.length - 1] || 0,
      osc: macd_data.osc,
      k: kd_data.k,
      d: kd_data.d,
      j: kd_data.j,
      rsi5: rsi5_data.rsi,
      rsi10: rsi10_data.rsi,
      bollUb: boll_data.bollUb,
      bollMa: boll_data.bollMa,
      bollLb: boll_data.bollLb,
      obv: obv_data.obv,
      obv_ma5: obv_ma5_data.ma,
      obv_ma10: obv_ma10_data.ma,
      obv_ma20: obv_ma20_data.ma,
      obv_ma60: obv_ma60_data.ma,
      obv_ema5: obv_ma5_data.ema,
      obv_ema10: obv_ma10_data.ema,
      obv_ema20: obv_ma20_data.ema,
      obv_ema60: obv_ma60_data.ema,
      mfi: mfi_data.mfi,
    });

    for (let i = 1; i < data.length; i++) {
      const value = data[i];
      ma5_data = ma.next(value, ma5_data, 5);
      ma10_data = ma.next(value, ma10_data, 10);
      ma20_data = ma.next(value, ma20_data, 20);
      ma60_data = ma.next(value, ma60_data, 60);
      ma120_data = ma.next(value, ma120_data, 120);
      ema5_data = ema.next(value, ema5_data, 5);
      ema10_data = ema.next(value, ema10_data, 10);
      ema20_data = ema.next(value, ema20_data, 20);
      ema60_data = ema.next(value, ema60_data, 60);
      ema120_data = ema.next(value, ema120_data, 120);
      boll_data = boll.next(value, boll_data, 20);
      macd_data = macd.next(value, macd_data);
      kd_data = kd.next(value, kd_data, 9);
      rsi5_data = rsi.next(value, rsi5_data, 5);
      rsi10_data = rsi.next(value, rsi10_data, 10);
      obv_data = obv.next(value, obv_data);
      obv_ma5_data = obvEma.next(obv_data.obv, obv_ma5_data, 5);
      obv_ma10_data = obvEma.next(obv_data.obv, obv_ma10_data, 10);
      obv_ma20_data = obvEma.next(obv_data.obv, obv_ma20_data, 20);
      obv_ma60_data = obvEma.next(obv_data.obv, obv_ma60_data, 60);
      mfi_data = mfi.next(value, mfi_data, 14);

      deals.push({
        ...value,
        ma5: ma5_data.ma,
        ma5_ded: ma5_data.exclusionValue["d-1"],
        ma10: ma10_data.ma,
        ma10_ded: ma10_data.exclusionValue["d-1"],
        ma20: ma20_data.ma,
        ma20_ded: ma20_data.exclusionValue["d-1"],
        ma60: ma60_data.ma,
        ma60_ded: ma60_data.exclusionValue["d-1"],
        ma120: ma120_data.ma,
        ma120_ded: ma120_data.exclusionValue["d-1"],
        ema5: ema5_data.ema,
        ema10: ema10_data.ema,
        ema20: ema20_data.ema,
        ema60: ema60_data.ema,
        ema120: ema120_data.ema,
        macd: macd_data.macd,
        dif: macd_data.dif[macd_data.dif.length - 1] || 0,
        osc: macd_data.osc,
        k: kd_data.k,
        d: kd_data.d,
        j: kd_data.j,
        rsi5: rsi5_data.rsi,
        rsi10: rsi10_data.rsi,
        bollUb: boll_data.bollUb,
        bollMa: boll_data.bollMa,
        bollLb: boll_data.bollLb,
        obv: obv_data.obv,
        obv_ma5: obv_ma5_data.ma,
        obv_ma10: obv_ma10_data.ma,
        obv_ma20: obv_ma20_data.ma,
        obv_ma60: obv_ma60_data.ma,
        obv_ema5: obv_ma5_data.ema,
        obv_ema10: obv_ma10_data.ema,
        obv_ema20: obv_ma20_data.ema,
        obv_ema60: obv_ma60_data.ema,
        mfi: mfi_data.mfi,
      });
    }
    return deals;
  }, [data]);

  return formatData;
}
