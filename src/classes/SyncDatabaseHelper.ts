import { error, info } from "@tauri-apps/plugin-log";
import Database from "@tauri-apps/plugin-sql";
import {
  DealTableOptions,
  DealTableType,
  SkillsTableOptions,
  SkillsTableType,
  StockTableType,
  TimeSharingDealTableOptions,
  TimeSharingDealTableType,
  TimeSharingSkillsTableOptions,
  TimeSharingSkillsTableType,
} from "../types";

/**
 * SyncDatabaseHelper - Dedicated helper for Data Sync Engine.
 * Does not modify original SqliteDataManager.
 */
export default class SyncDatabaseHelper {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Quick scan of the entire market health.
   */
  /**
   * Enhanced scan: A stock is only considered updated if both deals and skills exist for the latest date.
   * If stockId is provided, returns info for that stock only.
   */
  async getHealthSnapshot(stockId?: string): Promise<
    Record<string, { last_date: string; weekly_last_date: string; hourly_last_date: string; revenue_last_month: string; record_count: number; has_ext_data: boolean }>
  > {
    try {
      let sql = `SELECT stock_id, daily_last_date as last_date, weekly_last_date, hourly_last_date, revenue_last_month, daily_record_count as record_count, 
                 (has_financials AND has_fundamentals AND has_revenue AND has_positions) as has_ext_data
                 FROM stock_health_view`;
      
      const params: any[] = [];
      if (stockId) {
        sql += ` WHERE stock_id = $1`;
        params.push(stockId);
      }
      
      const result: Array<any> = await this.db.select(sql, params);

      const snapshot: Record<
        string,
        { last_date: string; weekly_last_date: string; hourly_last_date: string; revenue_last_month: string; record_count: number; has_ext_data: boolean }
      > = {};
      result.forEach((item) => {
        snapshot[item.stock_id] = {
          last_date: item.last_date || "0",
          weekly_last_date: item.weekly_last_date || "0",
          hourly_last_date: item.hourly_last_date || "0",
          revenue_last_month: item.revenue_last_month || "0",
          record_count: item.record_count || 0,
          has_ext_data: Boolean(item.has_ext_data),
        };
      });
      return snapshot;
    } catch (e) {
      error(`[SyncDB] HealthSnapshot error: ${e}`);
      return {};
    }
  }

  /**
   * Helper to ensure numeric values are SQL-safe (converts NaN/undefined/null to NULL)
   */
  private sqlSafe(val: any): string {
    if (val === null || val === undefined || (typeof val === 'number' && isNaN(val))) {
      return 'NULL';
    }
    return typeof val === 'string' ? `'${val}'` : `${val}`;
  }

  /**
   * Batch execution helper
   */
  private async executeBatch(sqlBase: string, entries: string[], batchSize: number = 200) {
    for (let i = 0; i < entries.length; i += batchSize) {
      const chunk = entries.slice(i, i + batchSize);
      const sql = `${sqlBase} ${chunk.join(", ")}`;
      await this.db.execute(sql);
    }
  }

  /**
   * Delete specific dates for a stock (clears ALL relevant tables).
   */
  async deletePartialData(stockId: string, date: string) {
    try {
      const tsThreshold = `'${date} 14:00:00'`;
      const tables = [
        ['hourly_skills', 'ts', tsThreshold],
        ['hourly_deal', 'ts', tsThreshold],
        ['weekly_skills', 't', `'${date}'`],
        ['weekly_deal', 't', `'${date}'`],
        ['daily_skills', 't', `'${date}'`],
        ['daily_deal', 't', `'${date}'`]
      ];
      
      for (const [table, col, val] of tables) {
        await this.db.execute(
          `DELETE FROM ${table} WHERE stock_id = $1 AND ${col} > ${val}`,
          [stockId]
        );
      }
    } catch (e) {
      error(`[SyncDB] DeletePartial error for ${stockId}: ${e}`);
    }
  }

  async deleteRecordsFromDate(stockId: string, date: string, dealTable: string, skillTable: string) {
    try {
      await this.db.execute(
        `DELETE FROM ${dealTable} WHERE stock_id = $1 AND t >= $2`,
        [stockId, date]
      );
      await this.db.execute(
        `DELETE FROM ${skillTable} WHERE stock_id = $1 AND t >= $2`,
        [stockId, date]
      );
      info(`[SyncDB] Cleaned up buffer range for ${stockId} from ${date}`);
    } catch (e) {
      error(`[SyncDB] DeleteRecordsFromDate error: ${e}`);
    }
  }

  /**
   * Save deal data in bulk.
   */
  async saveDeals(deals: DealTableType[], table: DealTableOptions) {
    if (deals.length === 0) return;
    try {
      const entries = deals.map(d => 
        `('${d.stock_id}', '${d.t}', ${this.sqlSafe(d.c)}, ${this.sqlSafe(d.o)}, ${this.sqlSafe(d.h)}, ${this.sqlSafe(d.l)}, ${this.sqlSafe(d.v)})`
      );
      const sqlBase = `INSERT OR REPLACE INTO ${table} (stock_id, t, c, o, h, l, v) VALUES`;
      await this.executeBatch(sqlBase, entries);
    } catch (e) {
      error(`[SyncDB] SaveDeals error: ${e}`);
    }
  }

  /**
   * Save skills data in bulk.
   */
  async saveSkills(skills: SkillsTableType[], table: SkillsTableOptions) {
    if (skills.length === 0) return;
    try {
      const columns = ["stock_id", "t", "ma5", "ma5_ded", "ma10", "ma10_ded", "ma20", "ma20_ded", "ma30", "ma30_ded", "ma50", "ma50_ded", "ma60", "ma60_ded", "ma120", "ma120_ded", "ma240", "ma240_ded", "ema5", "ema10", "ema20", "ema60", "ema120", "macd", "dif", "osc", "k", "d", "j", "rsi5", "rsi10", "bollUb", "bollMa", "bollLb", "obv", "obv_ma5", "obv_ma10", "obv_ma20", "obv_ma60", "obv_ema5", "obv_ema10", "obv_ema20", "obv_ema60", "mfi", "tenkan", "kijun", "senkouA", "senkouB", "chikou", "di_plus", "di_minus", "adx", "cmf", "cmf_ema5", "turnover_rate"];
      
      const entries = skills.map(s => {
        const values = [
          `'${s.stock_id}'`, `'${s.t}'`, 
          this.sqlSafe(s.ma5), this.sqlSafe(s.ma5_ded), this.sqlSafe(s.ma10), this.sqlSafe(s.ma10_ded),
          this.sqlSafe(s.ma20), this.sqlSafe(s.ma20_ded), this.sqlSafe(s.ma30), this.sqlSafe(s.ma30_ded),
          this.sqlSafe(s.ma50), this.sqlSafe(s.ma50_ded), this.sqlSafe(s.ma60), this.sqlSafe(s.ma60_ded),
          this.sqlSafe(s.ma120), this.sqlSafe(s.ma120_ded), this.sqlSafe(s.ma240), this.sqlSafe(s.ma240_ded),
          this.sqlSafe(s.ema5), this.sqlSafe(s.ema10), this.sqlSafe(s.ema20), this.sqlSafe(s.ema60), this.sqlSafe(s.ema120),
          this.sqlSafe(s.macd), this.sqlSafe(s.dif), this.sqlSafe(s.osc), 
          this.sqlSafe(s.k), this.sqlSafe(s.d), this.sqlSafe(s.j), 
          this.sqlSafe(s.rsi5), this.sqlSafe(s.rsi10),
          this.sqlSafe(s.bollUb), this.sqlSafe(s.bollMa), this.sqlSafe(s.bollLb),
          this.sqlSafe(s.obv), this.sqlSafe(s.obv_ma5), this.sqlSafe(s.obv_ma10), this.sqlSafe(s.obv_ma20), this.sqlSafe(s.obv_ma60),
          this.sqlSafe(s.obv_ema5), this.sqlSafe(s.obv_ema10), this.sqlSafe(s.obv_ema20), this.sqlSafe(s.obv_ema60),
          this.sqlSafe(s.mfi), this.sqlSafe(s.tenkan), this.sqlSafe(s.kijun), this.sqlSafe(s.senkouA), this.sqlSafe(s.senkouB), this.sqlSafe(s.chikou),
          this.sqlSafe(s.di_plus), this.sqlSafe(s.di_minus), this.sqlSafe(s.adx), this.sqlSafe(s.cmf), this.sqlSafe(s.cmf_ema5),
          this.sqlSafe(s.turnover_rate)
        ];
        return `(${values.join(", ")})`;
      });

      const sqlBase = `INSERT OR REPLACE INTO ${table} (${columns.join(", ")}) VALUES`;
      await this.executeBatch(sqlBase, entries, 50); // Small batch for very wide table
    } catch (e) {
      error(`[SyncDB] SaveSkills error: ${e}`);
    }
  }

  /**
   * Save Financial Metrics (PE, PB, ROE etc.)
   */
  async saveFinancialMetrics(metrics: any) {
    try {
      const sql = `INSERT OR REPLACE INTO financial_metric 
        (stock_id, pe, pb, dividend_yield, report_period, gross_profit_margin, operating_margin, pre_tax_profit_margin, roa, roe, book_value_per_share, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`;
      await this.db.execute(sql, [
        metrics.stock_id, metrics.pe, metrics.pb, metrics.dividend_yield, metrics.report_period,
        metrics.gross_profit_margin, metrics.operating_margin, metrics.pre_tax_profit_margin,
        metrics.roa, metrics.roe, metrics.book_value_per_share, new Date().toISOString()
      ]);
    } catch (e) {
      error(`[SyncDB] SaveFinancialMetrics error: ${e}`);
    }
  }

  async saveRecentFundamentals(data: any) {
    try {
      const columns = [
        "stock_id",
        "revenue_recent_m1_mom", "revenue_recent_m1_yoy", "revenue_recent_m1_yoy_acc", "revenue_recent_m1_name",
        "revenue_recent_m2_mom", "revenue_recent_m2_yoy", "revenue_recent_m2_yoy_acc", "revenue_recent_m2_name",
        "revenue_recent_m3_mom", "revenue_recent_m3_yoy", "revenue_recent_m3_yoy_acc", "revenue_recent_m3_name",
        "revenue_recent_m4_mom", "revenue_recent_m4_yoy", "revenue_recent_m4_yoy_acc", "revenue_recent_m4_name",
        "eps_recent_q1", "eps_recent_q1_name", "eps_recent_q2", "eps_recent_q2_name", "eps_recent_q3", "eps_recent_q3_name", "eps_recent_q4", "eps_recent_q4_name",
        "eps_recent_y1", "eps_recent_y1_name", "eps_recent_y2", "eps_recent_y2_name", "eps_recent_y3", "eps_recent_y3_name", "eps_recent_y4", "eps_recent_y4_name"
      ];
      
      const values = columns.map(col => data[col] ?? null);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
      const sql = `INSERT OR REPLACE INTO recent_fundamental (${columns.join(", ")}) VALUES (${placeholders})`;
      
      await this.db.execute(sql, values);
    } catch (e) {
      error(`[SyncDB] SaveRecentFundamentals error: ${e}`);
    }
  }

  async saveInvestorPositions(data: any) {
    try {
      const columns = [
        "stock_id",
        "recent_w1_foreign_ratio", "recent_w1_big_investor_ratio", "recent_w1_name",
        "recent_w2_foreign_ratio", "recent_w2_big_investor_ratio", "recent_w2_name",
        "recent_w3_foreign_ratio", "recent_w3_big_investor_ratio", "recent_w3_name",
        "recent_w4_foreign_ratio", "recent_w4_big_investor_ratio", "recent_w4_name"
      ];
      
      const values = columns.map(col => data[col] ?? null);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
      const sql = `INSERT OR REPLACE INTO investor_positions (${columns.join(", ")}) VALUES (${placeholders})`;
      
      await this.db.execute(sql, values);
    } catch (e) {
      error(`[SyncDB] SaveInvestorPositions error: ${e}`);
    }
  }

  /**
   * Save individual stock.
   */
  async saveStock(stock: StockTableType) {
    try {
      info(`[SyncDB] Saving stock ${stock.stock_id}: name=${stock.stock_name}, shares=${stock.issued_shares}`);
      await this.db.execute(
        "INSERT OR REPLACE INTO stock (stock_id, stock_name, industry_group, market_type, issued_shares) VALUES ($1, $2, $3, $4, $5)",
        [stock.stock_id, stock.stock_name, stock.industry_group, stock.market_type, stock.issued_shares || null]
      );
    } catch (e) {
      error(`[SyncDB] SaveStock error for ${stock.stock_id}: ${e}`);
    }
  }

  async getStockInfo(stockId: string): Promise<{ issued_shares?: number }> {
    try {
      const result: Array<{ issued_shares: number }> = await this.db.select(
        "SELECT issued_shares FROM stock WHERE stock_id = $1",
        [stockId],
      );
      if (result.length > 0 && result[0].issued_shares) {
        return { issued_shares: result[0].issued_shares };
      }
    } catch (e) {
      error(`[SyncDB] getStockInfo error for ${stockId}: ${e}`);
    }
    return {};
  }

  async getStockInfoFull(stockId: string): Promise<Partial<StockTableType>> {
    try {
      const result: Array<StockTableType> = await this.db.select(
        "SELECT * FROM stock WHERE stock_id = $1",
        [stockId],
      );
      if (result.length > 0) {
        return result[0];
      }
    } catch (e) {
      error(`[SyncDB] getStockInfoFull error for ${stockId}: ${e}`);
    }
    return {};
  }

  async getStockDates(
    stockId: string,
    dealTable: string = "daily_deal",
    skillTable: string = "daily_skills",
  ): Promise<Set<string>> {
    try {
      // Logic intersection: Only return dates where BOTH exist
      const result: Array<{ t: string }> = await this.db.select(
        `SELECT d.t FROM ${dealTable} d
         INNER JOIN ${skillTable} s ON d.stock_id = s.stock_id AND d.t = s.t
         WHERE d.stock_id = $1`,
        [stockId],
      );
      return new Set(result.map((r) => r.t));
    } catch (e) {
      return new Set();
    }
  }

  async getStockHourlyTimestamps(stockId: string): Promise<Set<string>> {
    try {
      const result: Array<{ ts: string }> = await this.db.select(
        `SELECT d.ts FROM hourly_deal d
         INNER JOIN hourly_skills s ON d.stock_id = s.stock_id AND d.ts = s.ts
         WHERE d.stock_id = $1`,
        [stockId]
      );
      return new Set(result.map((r) => r.ts));
    } catch (e) {
      return new Set();
    }
  }

  /**
   * Bulk Save TimeSharing Deals
   */
  async saveTimeSharingDeals(deals: TimeSharingDealTableType[], table: TimeSharingDealTableOptions) {
    if (deals.length === 0) return;
    try {
      const entries = deals.map(d => 
        `('${d.stock_id}', '${d.ts}', ${this.sqlSafe(d.c)}, ${this.sqlSafe(d.o)}, ${this.sqlSafe(d.h)}, ${this.sqlSafe(d.l)}, ${this.sqlSafe(d.v)})`
      );
      const sqlBase = `INSERT OR REPLACE INTO ${table} (stock_id, ts, c, o, h, l, v) VALUES`;
      await this.executeBatch(sqlBase, entries);
    } catch (e) {
      error(`[SyncDB] SaveTimeSharingDeals error: ${e}`);
    }
  }

  /**
   * Bulk Save TimeSharing Skills
   */
  async saveTimeSharingSkills(skills: TimeSharingSkillsTableType[], table: TimeSharingSkillsTableOptions) {
    if (skills.length === 0) return;
    try {
      const entries = skills.map(s => {
        // ... Similar mapping to saveSkills but for time-sharing columns
        return `('${s.stock_id}', '${s.ts}', ${this.sqlSafe(s.ma5)}, ${this.sqlSafe(s.ma5_ded)}, ${this.sqlSafe(s.ma10)}, ${this.sqlSafe(s.ma10_ded)}, ${this.sqlSafe(s.ma20)}, ${this.sqlSafe(s.ma20_ded)}, ${this.sqlSafe(s.ma30)}, ${this.sqlSafe(s.ma30_ded)}, ${this.sqlSafe(s.ma50)}, ${this.sqlSafe(s.ma50_ded)}, ${this.sqlSafe(s.ma60)}, ${this.sqlSafe(s.ma60_ded)}, ${this.sqlSafe(s.ma120)}, ${this.sqlSafe(s.ma120_ded)}, ${this.sqlSafe(s.ma240)}, ${this.sqlSafe(s.ma240_ded)}, ${this.sqlSafe(s.ema5)}, ${this.sqlSafe(s.ema10)}, ${this.sqlSafe(s.ema20)}, ${this.sqlSafe(s.ema60)}, ${this.sqlSafe(s.ema120)}, ${this.sqlSafe(s.macd)}, ${this.sqlSafe(s.dif)}, ${this.sqlSafe(s.osc)}, ${this.sqlSafe(s.k)}, ${this.sqlSafe(s.d)}, ${this.sqlSafe(s.j)}, ${this.sqlSafe(s.rsi5)}, ${this.sqlSafe(s.rsi10)}, ${this.sqlSafe(s.bollUb)}, ${this.sqlSafe(s.bollMa)}, ${this.sqlSafe(s.bollLb)}, ${this.sqlSafe(s.obv)}, ${this.sqlSafe(s.obv_ma5)}, ${this.sqlSafe(s.obv_ma10)}, ${this.sqlSafe(s.obv_ma20)}, ${this.sqlSafe(s.obv_ma60)}, ${this.sqlSafe(s.obv_ema5)}, ${this.sqlSafe(s.obv_ema10)}, ${this.sqlSafe(s.obv_ema20)}, ${this.sqlSafe(s.obv_ema60)}, ${this.sqlSafe(s.mfi)}, ${this.sqlSafe(s.tenkan)}, ${this.sqlSafe(s.kijun)}, ${this.sqlSafe(s.senkouA)}, ${this.sqlSafe(s.senkouB)}, ${this.sqlSafe(s.chikou)}, ${this.sqlSafe(s.di_plus)}, ${this.sqlSafe(s.di_minus)}, ${this.sqlSafe(s.adx)}, ${this.sqlSafe(s.cmf)}, ${this.sqlSafe(s.cmf_ema5)}, ${this.sqlSafe(s.turnover_rate)})`;
      });
      const sqlBase = `INSERT OR REPLACE INTO ${table} (stock_id, ts, ma5, ma5_ded, ma10, ma10_ded, ma20, ma20_ded, ma30, ma30_ded, ma50, ma50_ded, ma60, ma60_ded, ma120, ma120_ded, ma240, ma240_ded, ema5, ema10, ema20, ema60, ema120, macd, dif, osc, k, d, j, rsi5, rsi10, bollUb, bollMa, bollLb, obv, obv_ma5, obv_ma10, obv_ma20, obv_ma60, obv_ema5, obv_ema10, obv_ema20, obv_ema60, mfi, tenkan, kijun, senkouA, senkouB, chikou, di_plus, di_minus, adx, cmf, cmf_ema5, turnover_rate) VALUES`;
      await this.executeBatch(sqlBase, entries, 50);
    } catch (e) {
      error(`[SyncDB] SaveTimeSharingSkills error: ${e}`);
    }
  }

  /**
   * Cleanup incorrectly formatted dates (containing dashes)
   */
  async cleanupBadDates() {
    try {
      await this.db.execute("DELETE FROM daily_deal WHERE t LIKE '%-%'");
      await this.db.execute("DELETE FROM daily_skills WHERE t LIKE '%-%'");
      await this.db.execute("DELETE FROM weekly_deal WHERE t LIKE '%-%'");
      await this.db.execute("DELETE FROM weekly_skills WHERE t LIKE '%-%'");
      info("[SyncDB] Cleaned up records with dashed dates.");
    } catch (e) {
      error(`[SyncDB] Cleanup error: ${e}`);
    }
  }
}
