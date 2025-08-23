import { useMemo } from "react";
import { SkillsTableType, TaType } from "../types";
import { Boll, Kd, Ma, Macd, Obv, ObvEma, Rsi } from "@ch20026103/anysis";

export type FormatDataRow = Omit<SkillsTableType, "stock_id" | "t"> & {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

export default function useFormatSkillData(data: TaType) {
  const formatData = useMemo<FormatDataRow[]>(() => {
    if (!data || data.length === 0) return [];
    const deals: FormatDataRow[] = [];

    const boll = new Boll();
    const ma = new Ma();
    const macd = new Macd();
    const kd = new Kd();
    const rsi = new Rsi();
    const obv = new Obv();
    const obvEma = new ObvEma();

    const init = data[0];
    let ma5_data = ma.init(init, 5);
    let ma10_data = ma.init(init, 10);
    let ma20_data = ma.init(init, 20);
    let ma60_data = ma.init(init, 60);
    let ma120_data = ma.init(init, 120);
    let boll_data = boll.init(init);
    let macd_data = macd.init(init);
    let kd_data = kd.init(init, 9);
    let rsi5_data = rsi.init(init, 5);
    let rsi10_data = rsi.init(init, 10);
    let obv_data = obv.init(init);
    let obvEma_data = obvEma.init(obv_data.obv, 5);

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
      obv5: obvEma_data.ema,
    });

    for (let i = 1; i < data.length; i++) {
      const value = data[i];
      ma5_data = ma.next(value, ma5_data, 5);
      ma10_data = ma.next(value, ma10_data, 10);
      ma20_data = ma.next(value, ma20_data, 20);
      ma60_data = ma.next(value, ma60_data, 60);
      ma120_data = ma.next(value, ma120_data, 120);
      boll_data = boll.next(value, boll_data, 20);
      macd_data = macd.next(value, macd_data);
      kd_data = kd.next(value, kd_data, 9);
      rsi5_data = rsi.next(value, rsi5_data, 5);
      rsi10_data = rsi.next(value, rsi10_data, 10);
      obv_data = obv.next(value, obv_data);
      obvEma_data = obvEma.next(obv_data.obv, obvEma_data, 5);

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
        obv5: obvEma_data.ema,
      });
    }
    return deals;
  }, [data]);

  return formatData;
}
