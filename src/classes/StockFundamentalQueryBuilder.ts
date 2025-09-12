import { supabase } from "../tools/supabase";
import { FundamentalPrompts } from "../types";

export class StockFundamentalQueryBuilder {
  protected mapping: Record<string, { key: string; table: string }> = {
    本益比: { key: "pe", table: "financial_metric" },
    股價淨值比: { key: "pb", table: "financial_metric" },
    殖利率: { key: "dividend_yield", table: "financial_metric" },
    營業毛利率: { key: "gross_profit_margin", table: "financial_metric" },
    營業利益率: { key: "operating_margin", table: "financial_metric" },
    稅前淨利率: { key: "pre_tax_profit_margin", table: "financial_metric" },
    資產報酬率: { key: "roa", table: "financial_metric" },
    股東權益報酬率: { key: "roe", table: "financial_metric" },
    每股淨值: { key: "book_value_per_share", table: "financial_metric" },
    EPS近一季: { key: "eps_recent_q1", table: "recent_fundamental" },
    EPS近二季: { key: "eps_recent_q2", table: "recent_fundamental" },
    EPS近三季: { key: "eps_recent_q3", table: "recent_fundamental" },
    EPS近四季: { key: "eps_recent_q4", table: "recent_fundamental" },
    EPS近一年: { key: "eps_recent_y1", table: "recent_fundamental" },
    EPS近二年: { key: "eps_recent_y2", table: "recent_fundamental" },
    EPS近三年: { key: "eps_recent_y3", table: "recent_fundamental" },
    EPS近四年: { key: "eps_recent_y4", table: "recent_fundamental" },
    "營收近一月(月增率)": {
      key: "revenue_recent_m1_mom",
      table: "recent_fundamental",
    },
    "營收近一月(年增率)": {
      key: "revenue_recent_m1_yoy",
      table: "recent_fundamental",
    },
    "營收近一月(累計年增率)": {
      key: "revenue_recent_m1_yoy_acc",
      table: "recent_fundamental",
    },
    "營收近二月(月增率)": {
      key: "revenue_recent_m2_mom",
      table: "recent_fundamental",
    },
    "營收近二月(年增率)": {
      key: "revenue_recent_m2_yoy",
      table: "recent_fundamental",
    },
    "營收近二月(累計年增率)": {
      key: "revenue_recent_m2_yoy_acc",
      table: "recent_fundamental",
    },
    "營收近三月(月增率)": {
      key: "revenue_recent_m3_mom",
      table: "recent_fundamental",
    },
    "營收近三月(年增率)": {
      key: "revenue_recent_m3_yoy",
      table: "recent_fundamental",
    },
    "營收近三月(累計年增率)": {
      key: "revenue_recent_m3_yoy_acc",
      table: "recent_fundamental",
    },
    "營收近四月(月增率)": {
      key: "revenue_recent_m4_mom",
      table: "recent_fundamental",
    },
    "營收近四月(年增率)": {
      key: "revenue_recent_m4_yoy",
      table: "recent_fundamental",
    },
    "營收近四月(累計年增率)": {
      key: "revenue_recent_m4_yoy_acc",
      table: "recent_fundamental",
    },
    "持股比率近一週(外資)": {
      key: "recent_w1_foreign_ratio",
      table: "investor_positions",
    },
    "持股比率近一週(大戶)": {
      key: "recent_w1_big_investor_ratio",
      table: "investor_positions",
    },
    "持股比率近二週(外資)": {
      key: "recent_w2_foreign_ratio",
      table: "investor_positions",
    },
    "持股比率近二週(大戶)": {
      key: "recent_w2_big_investor_ratio",
      table: "investor_positions",
    },
    "持股比率近三週(外資)": {
      key: "recent_w3_foreign_ratio",
      table: "investor_positions",
    },
    "持股比率近三週(大戶)": {
      key: "recent_w3_big_investor_ratio",
      table: "investor_positions",
    },
    "持股比率近四週(外資)": {
      key: "recent_w4_foreign_ratio",
      table: "investor_positions",
    },
    "持股比率近四週(大戶)": {
      key: "recent_w4_big_investor_ratio",
      table: "investor_positions",
    },
  };

  protected operatorMapping: Record<string, string> = {
    小於: "<",
    大於: ">",
    等於: "=",
    大於等於: ">=",
    小於等於: "<=",
  };

  async getStocksByConditions({
    conditions,
    stockIds,
  }: {
    conditions: FundamentalPrompts;
    stockIds?: string[];
  }) {
    let stockIdsFromFinancialMetric: string[] = [];
    let stockIdsFromRecentFundamental: string[] = [];

    // 分組條件按表格
    const financialMetricConditions = conditions.filter(
      (condition) =>
        this.mapping[condition.indicator].table === "financial_metric"
    );
    const recentFundamentalConditions = conditions.filter(
      (condition) =>
        this.mapping[condition.indicator].table === "recent_fundamental"
    );

    // 處理 financial_metric 表的條件
    if (financialMetricConditions.length > 0) {
      let query = supabase.from("financial_metric").select("stock_id");

      for (const condition of financialMetricConditions) {
        const indicator = this.mapping[condition.indicator].key;
        const operator = this.operatorMapping[condition.operator];
        const value = condition.value;

        switch (operator) {
          case "=":
            query = query.eq(indicator, parseFloat(value));
            break;
          case ">":
            query = query.gt(indicator, parseFloat(value));
            break;
          case ">=":
            query = query.gte(indicator, parseFloat(value));
            break;
          case "<":
            query = query.lt(indicator, parseFloat(value));
            break;
          case "<=":
            query = query.lte(indicator, parseFloat(value));
            break;
          default:
            throw new Error(`不支援的運算子: ${operator}`);
        }
      }

      if (stockIds && stockIds.length > 0) {
        query = query.in("stock_id", stockIds);
      }

      const { data, error } = await query;
      if (error) {
        console.error("financial_metric 查詢失敗:", error);
        return [];
      }
      stockIdsFromFinancialMetric = data.map((r) => r.stock_id);
    }

    // 處理 recent_fundamental 表的條件
    if (recentFundamentalConditions.length > 0) {
      let query = supabase.from("recent_fundamental").select("stock_id");

      for (const condition of recentFundamentalConditions) {
        const indicator = this.mapping[condition.indicator].key;
        const operator = this.operatorMapping[condition.operator];
        const value = condition.value;

        switch (operator) {
          case "=":
            query = query.eq(indicator, parseFloat(value));
            break;
          case ">":
            query = query.gt(indicator, parseFloat(value));
            break;
          case ">=":
            query = query.gte(indicator, parseFloat(value));
            break;
          case "<":
            query = query.lt(indicator, parseFloat(value));
            break;
          case "<=":
            query = query.lte(indicator, parseFloat(value));
            break;
          default:
            throw new Error(`不支援的運算子: ${operator}`);
        }
      }

      if (stockIds && stockIds.length > 0) {
        query = query.in("stock_id", stockIds);
      }

      const { data, error } = await query;
      if (error) {
        console.error("recent_fundamental 查詢失敗:", error);
        return [];
      }
      stockIdsFromRecentFundamental = data.map((r) => r.stock_id);
    }

    // 取交集：同時滿足兩個表格條件的股票
    if (
      financialMetricConditions.length > 0 &&
      recentFundamentalConditions.length > 0
    ) {
      return stockIdsFromFinancialMetric.filter((id) =>
        stockIdsFromRecentFundamental.includes(id)
      );
    }

    // 如果只有一個表格有條件，返回該表格的結果
    if (financialMetricConditions.length > 0) {
      return stockIdsFromFinancialMetric;
    }

    if (recentFundamentalConditions.length > 0) {
      return stockIdsFromRecentFundamental;
    }

    return [];
  }

  public getOptions() {
    return {
      indicators: [...Object.keys(this.mapping)],
      operators: Object.keys(this.operatorMapping),
    };
  }
}

export const stockFundamentalQueryBuilder = new StockFundamentalQueryBuilder();
