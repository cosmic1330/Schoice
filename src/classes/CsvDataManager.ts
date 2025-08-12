import { Boll, dateFormat, Kd, Ma, Macd, Obv, ObvEma, Rsi } from "@ch20026103/anysis";
import { Mode } from "@ch20026103/anysis/dist/esm/stockSkills/utils/dateFormat";
import {
  DealTableOptions,
  DealTableType,
  SkillsCsvDataType,
  SkillsTableOptions,
  StockStoreType,
  TaType,
} from "../types";

export default class CsvDataManager {
  dailydeal: DealTableType[];
  weeklydeal: DealTableType[];
  dailyskills: SkillsCsvDataType[];
  weeklyskills: SkillsCsvDataType[];

  constructor() {
    this.dailydeal = [];
    this.weeklydeal = [];
    this.dailyskills = [];
    this.weeklyskills = [];
  }
  async gererateDealCsvDataByTa(
    ta: TaType,
    stock: StockStoreType,
    type: DealTableOptions
  ) {
    const data: DealTableType[] = ta.map((item) => ({
      ...item,
      stock_id: stock.id,
      t: dateFormat(item.t, Mode.NumberToString),
    }));
    if (type === DealTableOptions.DailyDeal) this.dailydeal.push(...data);
    else if (type === DealTableOptions.WeeklyDeal)
      this.weeklydeal.push(...data);
  }

  async gererateSkillsCsvDataByTa(
    ta: TaType,
    stock: StockStoreType,
    type: SkillsTableOptions
  ) {
    if (!ta || ta.length === 0) return;
    const data: SkillsCsvDataType[] = [];
    const boll = new Boll();
    const ma = new Ma();
    const macd = new Macd();
    const kd = new Kd();
    const rsi = new Rsi();
    const obv = new Obv();
    const obvEma = new ObvEma();

    const init = ta[0];
    let t = dateFormat(init.t, Mode.NumberToString);
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
    data.push({
      stock_id: stock.id,
      t,
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
      boll_ub: boll_data.bollUb,
      boll_ma: boll_data.bollMa,
      boll_lb: boll_data.bollLb,
      obv: obv_data.obv,
      obv5: obvEma_data.ema,
    });

    for (let i = 1; i < ta.length; i++) {
      const value = ta[i];
      t = dateFormat(value.t, Mode.NumberToString);
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

      data.push({
        stock_id: stock.id,
        t,
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
        boll_ub: boll_data.bollUb,
        boll_ma: boll_data.bollMa,
        boll_lb: boll_data.bollLb,
        obv: obv_data.obv,
        obv5: obvEma_data.ema,
      });
    }
    if (type === SkillsTableOptions.DailySkills) this.dailyskills.push(...data);
    else if (type === SkillsTableOptions.WeeklySkills)
      this.weeklyskills.push(...data);
  }
}
