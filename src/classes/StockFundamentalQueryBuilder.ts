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
    近一週外資持股比例: {
      key: "recent_w1_foreign_ratio",
      table: "investor_positions",
    },
    近一週大戶持股比例: {
      key: "recent_w1_big_investor_ratio",
      table: "investor_positions",
    },
    近二週外資持股比例: {
      key: "recent_w2_foreign_ratio",
      table: "investor_positions",
    },
    近二週大戶持股比例: {
      key: "recent_w2_big_investor_ratio",
      table: "investor_positions",
    },
    近三週外資持股比例: {
      key: "recent_w3_foreign_ratio",
      table: "investor_positions",
    },
    近三週大戶持股比例: {
      key: "recent_w3_big_investor_ratio",
      table: "investor_positions",
    },
    近四週外資持股比例: {
      key: "recent_w4_foreign_ratio",
      table: "investor_positions",
    },
    近四週大戶持股比例: {
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
    let stockIdsFromTables: Record<string, string[]> = {};

    // 分組條件按表格
    const groupedConditions = conditions.reduce((acc, condition) => {
      const table = this.mapping[condition.indicator].table;
      if (!acc[table]) acc[table] = [];
      acc[table].push(condition);
      return acc;
    }, {} as Record<string, FundamentalPrompts>);

    for (const [table, tableConditions] of Object.entries(groupedConditions)) {
      let query = supabase.from(table).select("stock_id, *");

      // 先查出所有該 table 的資料
      const { data: tableData, error: tableError } = await query;
      if (tableError) {
        console.error(`${table} 查詢失敗:`, tableError);
        return [];
      }
      let filteredData = tableData;

      for (const condition of tableConditions) {
        const indicator = this.mapping[condition.indicator].key;
        const operator = this.operatorMapping[condition.operator];
        const value = condition.value;

        if (!operator) {
          throw new Error(`不支援的運算子: ${condition.operator}`);
        }

        // value 是數字
        if (!isNaN(Number(value))) {
          filteredData = filteredData.filter((row) => {
            if (row[indicator] == null) return false;
            switch (operator) {
              case "=":
                return row[indicator] === parseFloat(value);
              case ">":
                return row[indicator] > parseFloat(value);
              case ">=":
                return row[indicator] >= parseFloat(value);
              case "<":
                return row[indicator] < parseFloat(value);
              case "<=":
                return row[indicator] <= parseFloat(value);
              default:
                return false;
            }
          });
        } else if (this.mapping[value] && this.mapping[value].table === table) {
          // value 是 mapping 的 key，且屬於相同的 table
          const valueKey = this.mapping[value].key;
          filteredData = filteredData.filter((row) => {
            if (row[indicator] == null || row[valueKey] == null) return false;
            switch (operator) {
              case "=":
                return row[indicator] === row[valueKey];
              case ">":
                return row[indicator] > row[valueKey];
              case ">=":
                return row[indicator] >= row[valueKey];
              case "<":
                return row[indicator] < row[valueKey];
              case "<=":
                return row[indicator] <= row[valueKey];
              default:
                return false;
            }
          });
        } else {
          throw new Error(
            `條件 ${condition.indicator} 的值 ${value} 不屬於相同的表格 ${table}`
          );
        }
      }

      // stockIds 篩選
      if (stockIds && stockIds.length > 0) {
        filteredData = filteredData.filter((row) =>
          stockIds.includes(row.stock_id)
        );
      }
      stockIdsFromTables[table] = filteredData.map((r) => r.stock_id);
    }

    // 取交集：滿足所有表格條件的股票
    const allStockIds = Object.values(stockIdsFromTables);
    if (allStockIds.length > 1) {
      return allStockIds.reduce((a, b) => a.filter((id) => b.includes(id)));
    }

    // 如果只有一個表格有條件，返回該表格的結果
    return allStockIds[0] || [];
  }

  public getOptions() {
    const indicators = Object.keys(this.mapping);
    const valuesByIndicator = indicators.reduce((acc, indicator) => {
      const table = this.mapping[indicator].table;
      acc[indicator] = indicators.filter(
        (key) => this.mapping[key].table === table
      );
      return acc;
    }, {} as Record<string, string[]>);

    return {
      indicators,
      operators: Object.keys(this.operatorMapping),
      valuesByIndicator,
    };
  }
}

export const stockFundamentalQueryBuilder = new StockFundamentalQueryBuilder();
