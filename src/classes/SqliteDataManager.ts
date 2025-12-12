import {
  Boll,
  Ema,
  Ichimoku,
  Kd,
  Ma,
  Macd,
  Mfi,
  Obv,
  ObvEma,
  Rsi,
} from "@ch20026103/anysis";
import dateFormat, {
  Mode,
} from "@ch20026103/anysis/dist/esm/stockSkills/utils/dateFormat";
import { error, info } from "@tauri-apps/plugin-log";
import Database from "@tauri-apps/plugin-sql";
import {
  DealTableOptions,
  DealTableType,
  SkillsTableOptions,
  SkillsTableType,
  StockTableType,
  TaListType,
  TimeSharingDealTableOptions,
  TimeSharingDealTableType,
  TimeSharingSkillsTableOptions,
  TimeSharingSkillsTableType,
} from "../types";

export default class SqliteDataManager {
  public db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async clearTable() {
    try {
      await this.db.execute("DELETE FROM fundamental;");
      await this.db.execute("DELETE FROM hourly_skills;");
      await this.db.execute("DELETE FROM hourly_deal;");
      await this.db.execute("DELETE FROM weekly_skills;");
      await this.db.execute("DELETE FROM weekly_deal;");
      await this.db.execute("DELETE FROM daily_skills;");
      await this.db.execute("DELETE FROM daily_deal;");
      await this.db.execute("DELETE FROM stock;");
      return true;
    } catch (e) {
      error(`${e}`);
      return false;
    }
  }

  async deleteLatestDailyDeal({
    stock_id,
    t,
  }: {
    stock_id: string;
    t: string;
  }) {
    try {
      const num = dateFormat(t, Mode.StringToNumber) * 10000 + 1400;
      info(`刪除 ${stock_id}: ${num} 和 ${t} 之後的資料`);
      await this.db.execute(
        `DELETE FROM hourly_skills WHERE stock_id = '${stock_id}' AND ts > ${num};`
      );
      await this.db.execute(
        `DELETE FROM hourly_deal WHERE  stock_id = '${stock_id}' AND ts > ${num};`
      );
      await this.db.execute(
        `DELETE FROM weekly_skills WHERE  stock_id = '${stock_id}' AND t > '${t}';`
      );
      await this.db.execute(
        `DELETE FROM weekly_deal WHERE  stock_id = '${stock_id}' AND t > '${t}';`
      );
      await this.db.execute(
        `DELETE FROM daily_skills WHERE  stock_id = '${stock_id}' AND t > '${t}';`
      );
      await this.db.execute(
        `DELETE FROM daily_deal WHERE  stock_id = '${stock_id}' AND t > '${t}';`
      );
      return true;
    } catch (e) {
      error(`${e}`);
    }
  }

  async getLatestDailyDealCount() {
    try {
      const result: [{ latest_date: string; record_count: number }] =
        await this.db.select(
          "SELECT (SELECT MAX(t) FROM daily_deal) AS latest_date,COUNT(*) AS record_count FROM daily_deal WHERE t = (SELECT MAX(t) FROM daily_deal);"
        );
      return { date: result[0].latest_date, count: result[0].record_count };
    } catch (e) {
      error(`${e}`);
      return { date: "N/A", count: 0 };
    }
  }

  async timeSharingProcessor(
    ta: TaListType,
    stock: StockTableType,
    options: {
      dealType: TimeSharingDealTableOptions;
      skillsType: TimeSharingSkillsTableOptions;
    },
    sets: {
      lose_deal_set: Set<number>;
      lose_skills_set: Set<number>;
    }
  ) {
    try {
      if (!ta || ta.length === 0) {
        return false;
      }

      const boll = new Boll();
      const ma = new Ma();
      const ema = new Ema();
      const macd = new Macd();
      const kd = new Kd();
      const rsi = new Rsi();
      const obv = new Obv();
      const obvEma = new ObvEma();
      const mfi = new Mfi();
      const ichimoku = new Ichimoku();

      const init = ta[0];
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
      let ichimoku_data = ichimoku.init(init);

      const deals: TimeSharingDealTableType[] = [];
      const skills: TimeSharingSkillsTableType[] = [];

      for (let i = 0; i < ta.length; i++) {
        const value = ta[i];

        if (i > 0) {
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
          ichimoku_data = ichimoku.next(value, ichimoku_data);
        }

        if (sets.lose_deal_set.has(value.t)) {
          deals.push({
            stock_id: stock.stock_id,
            ts: value.t,
            c: value.c,
            o: value.o,
            h: value.h,
            l: value.l,
            v: value.v,
          });
        }

        if (sets.lose_skills_set.has(value.t)) {
          skills.push({
            stock_id: stock.stock_id,
            ts: value.t,
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
            tenkan: ichimoku_data.ichimoku.tenkan,
            kijun: ichimoku_data.ichimoku.kijun,
            senkouA: ichimoku_data.ichimoku.senkouA,
            senkouB: ichimoku_data.ichimoku.senkouB,
            chikou: ichimoku_data.ichimoku.chikou,
          });
        }
      }

      await this.saveTimeSharingDealTable(deals, options.dealType, stock);
      info(
        `save ${options.dealType} db: ${stock.stock_id} ${deals.length} records`
      );
      await this.saveTimeSharingSkillsTable(skills, options.skillsType, stock);
      info(
        `save ${options.skillsType} db: ${stock.stock_id} ${skills.length} records`
      );

      return true;
    } catch (e) {
      error(`${stock.stock_name}: timeSharingProcessor error: ${e}`);
      return false;
    }
  }

  async processor(
    ta: TaListType,
    stock: StockTableType,
    options: {
      dealType: DealTableOptions;
      skillsType: SkillsTableOptions;
    },
    sets: {
      lose_deal_set: Set<string>;
      lose_skills_set: Set<string>;
    }
  ) {
    try {
      if (!ta || ta.length === 0) {
        return false;
      }

      const boll = new Boll();
      const ma = new Ma();
      const ema = new Ema();
      const macd = new Macd();
      const kd = new Kd();
      const rsi = new Rsi();
      const obv = new Obv();
      const obvEma = new ObvEma();
      const mfi = new Mfi();
      const ichimoku = new Ichimoku();

      const init = ta[0];
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
      let ichimoku_data = ichimoku.init(init);

      const deals: DealTableType[] = [];
      const skills: SkillsTableType[] = [];

      for (let i = 0; i < ta.length; i++) {
        const value = ta[i];
        const t = dateFormat(value.t, Mode.NumberToString);
        if (i > 0) {
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
          ichimoku_data = ichimoku.next(value, ichimoku_data);
        }

        if (sets.lose_deal_set.has(t)) {
          deals.push({
            stock_id: stock.stock_id,
            t,
            c: value.c,
            o: value.o,
            h: value.h,
            l: value.l,
            v: value.v,
          });
        }

        if (sets.lose_skills_set.has(t)) {
          skills.push({
            stock_id: stock.stock_id,
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
            tenkan: ichimoku_data.ichimoku.tenkan,
            kijun: ichimoku_data.ichimoku.kijun,
            senkouA: ichimoku_data.ichimoku.senkouA,
            senkouB: ichimoku_data.ichimoku.senkouB,
            chikou: ichimoku_data.ichimoku.chikou,
          });
        }
      }
      await this.saveDealTable(deals, options.dealType, stock);
      info(
        `save ${options.dealType} db: ${stock.stock_id} ${deals.length} records`
      );
      await this.saveSkillsTable(skills, options.skillsType, stock).then(() => {
        info(
          `save ${options.skillsType} db: ${stock.stock_id} ${skills.length} records`
        );
      });
      return true;
    } catch (e) {
      error(`${stock.stock_name}: processor error: ${e}`);
      return false;
    }
  }

  // Base
  async saveStockTable(stock: StockTableType) {
    try {
      await this.db.execute(
        "INSERT OR REPLACE INTO stock (stock_id, stock_name, industry_group, market_type) VALUES ($1, $2, $3, $4)",
        [
          stock.stock_id,
          stock.stock_name,
          stock.industry_group,
          stock.market_type,
        ]
      );
      return true;
    } catch (e) {
      throw new Error(`${stock.stock_name}:${e}`);
    }
  }

  async saveDealTable(
    deals: DealTableType[],
    table: DealTableOptions,
    stock: StockTableType
  ) {
    try {
      const sql = `INSERT INTO ${table} (stock_id, t, c, o, h, l, v) VALUES ${deals
        .map(
          (deal) =>
            `('${deal.stock_id}', '${deal.t}', ${deal.c}, ${deal.o}, ${deal.h}, ${deal.l}, ${deal.v})`
        )
        .join(", ")}`;
      await this.db.execute(sql);
      return true;
    } catch (e) {
      throw new Error(`${stock.stock_name}:${e}`);
    }
  }

  async saveSkillsTable(
    skills: SkillsTableType[],
    table: SkillsTableOptions,
    stock: StockTableType
  ) {
    try {
      const sql = `INSERT INTO ${table} (stock_id,
          t,
          ma5,
          ma5_ded,
          ma10,
          ma10_ded,
          ma20,
          ma20_ded,
          ma60,
          ma60_ded,
          ma120,
          ma120_ded,
          ema5,
          ema10,
          ema20,
          ema60,
          ema120,
          macd,
          dif,
          osc,
          k,
          d,
          j,
          rsi5,
          rsi10,
          bollUb,
          bollMa,
          bollLb,
          obv,
          obv_ma5,
          obv_ma10,
          obv_ma20,
          obv_ma60,
          obv_ema5,
          obv_ema10,
          obv_ema20,
          obv_ema60,
          mfi,
          tenkan,
          kijun,
          senkouA,
          senkouB,
          chikou
          ) VALUES ${skills
            .map(
              (skill) =>
                `('${skill.stock_id}', '${skill.t}', ${skill.ma5}, ${skill.ma5_ded}, ${skill.ma10}, ${skill.ma10_ded}, ${skill.ma20}, ${skill.ma20_ded}, ${skill.ma60}, ${skill.ma60_ded}, ${skill.ma120}, ${skill.ma120_ded}, ${skill.ema5}, ${skill.ema10}, ${skill.ema20}, ${skill.ema60}, ${skill.ema120}, ${skill.macd}, ${skill.dif}, ${skill.osc}, ${skill.k}, ${skill.d}, ${skill.j}, ${skill.rsi5}, ${skill.rsi10}, ${skill.bollUb}, ${skill.bollMa}, ${skill.bollLb}, ${skill.obv}, ${skill.obv_ma5}, ${skill.obv_ma10}, ${skill.obv_ma20}, ${skill.obv_ma60}, ${skill.obv_ema5}, ${skill.obv_ema10}, ${skill.obv_ema20}, ${skill.obv_ema60}, ${skill.mfi}, ${skill.tenkan}, ${skill.kijun}, ${skill.senkouA}, ${skill.senkouB}, ${skill.chikou})`
            )
            .join(", ")}`;
      await this.db.execute(sql);
      return true;
    } catch (e) {
      throw new Error(`${stock.stock_name}:${e}`);
    }
  }

  // TimeSharing
  async saveTimeSharingDealTable(
    deal: TimeSharingDealTableType[],
    table: TimeSharingDealTableOptions,
    stock: StockTableType
  ) {
    try {
      const sql = `INSERT INTO ${table} (stock_id, ts, c, o, h, l, v) VALUES ${deal
        .map(
          (deal) =>
            `('${deal.stock_id}', ${deal.ts}, ${deal.c}, ${deal.o}, ${deal.h}, ${deal.l}, ${deal.v})`
        )
        .join(", ")}`;
      await this.db.execute(sql);
      return true;
    } catch (e) {
      throw new Error(`${stock.stock_name}:${e}`);
    }
  }

  async saveTimeSharingSkillsTable(
    skills: TimeSharingSkillsTableType[],
    table: TimeSharingSkillsTableOptions,
    stock: StockTableType
  ) {
    try {
      const sql = `INSERT INTO ${table} (stock_id,
          ts,
          ma5,
          ma5_ded,
          ma10,
          ma10_ded,
          ma20,
          ma20_ded,
          ma60,
          ma60_ded,
          ma120,
          ma120_ded,
          ema5,
          ema10,
          ema20,
          ema60,
          ema120,
          macd,
          dif,
          osc,
          k,
          d,
          j,
          rsi5,
          rsi10,
          bollUb,
          bollMa,
          bollLb,
          obv,
          obv_ma5,
          obv_ma10,
          obv_ma20,
          obv_ma60,
          obv_ema5,
          obv_ema10,
          obv_ema20,
          obv_ema60,
          mfi,
          tenkan,
          kijun,
          senkouA,
          senkouB,
          chikou) VALUES ${skills
            .map(
              (skill) =>
                `('${skill.stock_id}', ${skill.ts}, ${skill.ma5}, ${skill.ma5_ded}, ${skill.ma10}, ${skill.ma10_ded}, ${skill.ma20}, ${skill.ma20_ded}, ${skill.ma60}, ${skill.ma60_ded}, ${skill.ma120}, ${skill.ma120_ded}, ${skill.ema5}, ${skill.ema10}, ${skill.ema20}, ${skill.ema60}, ${skill.ema120}, ${skill.macd}, ${skill.dif}, ${skill.osc}, ${skill.k}, ${skill.d}, ${skill.j}, ${skill.rsi5}, ${skill.rsi10}, ${skill.bollUb}, ${skill.bollMa}, ${skill.bollLb}, ${skill.obv}, ${skill.obv_ma5}, ${skill.obv_ma10}, ${skill.obv_ma20}, ${skill.obv_ma60}, ${skill.obv_ema5}, ${skill.obv_ema10}, ${skill.obv_ema20}, ${skill.obv_ema60}, ${skill.mfi}), ${skill.tenkan}, ${skill.kijun}, ${skill.senkouA}, ${skill.senkouB}, ${skill.chikou})`
            )
            .join(", ")}`;
      await this.db.execute(sql);
      return true;
    } catch (e) {
      throw new Error(`${stock.stock_name}:${e}`);
    }
  }

  async getStockDates(
    stock: StockTableType,
    table: SkillsTableOptions | DealTableOptions
  ) {
    try {
      const result: [{ t: string }] = await this.db.select(
        `SELECT t FROM ${table} WHERE stock_id = '${stock.stock_id}';`
      );
      return result;
    } catch (e) {
      error(`${stock.stock_name}:${e}`);
      return [];
    }
  }

  async getStockTimeSharing(
    stock: StockTableType,
    table: TimeSharingDealTableOptions | TimeSharingSkillsTableOptions
  ) {
    try {
      const result: [{ ts: number }] = await this.db.select(
        `SELECT ts FROM ${table} WHERE stock_id = '${stock.stock_id}';`
      );
      return result;
    } catch (e) {
      error(`${stock.stock_name}:${e}`);
      return [];
    }
  }
}
