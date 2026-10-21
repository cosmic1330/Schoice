import type { QueryBuilderMappingItem } from "../../types";

export type FundamentalIndicatorDefinition = QueryBuilderMappingItem & {
  table: "financial_metric" | "recent_fundamental" | "investor_positions";
};

export const FUNDAMENTAL_INDICATORS: Record<
  string,
  FundamentalIndicatorDefinition
> = {
  本益比: { key: "pe", group: "valuation", table: "financial_metric" },
  股價淨值比: { key: "pb", group: "valuation", table: "financial_metric" },
  殖利率: {
    key: "dividend_yield",
    group: "valuation",
    table: "financial_metric",
    unit: "%",
  },
  營業毛利率: {
    key: "gross_profit_margin",
    group: "profitability",
    table: "financial_metric",
    unit: "%",
  },
  營業利益率: {
    key: "operating_margin",
    group: "profitability",
    table: "financial_metric",
    unit: "%",
  },
  稅前淨利率: {
    key: "pre_tax_profit_margin",
    group: "profitability",
    table: "financial_metric",
    unit: "%",
  },
  資產報酬率: {
    key: "roa",
    group: "profitability",
    table: "financial_metric",
    unit: "%",
  },
  股東權益報酬率: {
    key: "roe",
    group: "profitability",
    table: "financial_metric",
    unit: "%",
  },
  每股淨值: {
    key: "book_value_per_share",
    group: "valuation",
    table: "financial_metric",
  },
  EPS近一季: { key: "eps_recent_q1", group: "eps", table: "recent_fundamental" },
  EPS近二季: { key: "eps_recent_q2", group: "eps", table: "recent_fundamental" },
  EPS近三季: { key: "eps_recent_q3", group: "eps", table: "recent_fundamental" },
  EPS近四季: { key: "eps_recent_q4", group: "eps", table: "recent_fundamental" },
  EPS近一年: { key: "eps_recent_y1", group: "eps", table: "recent_fundamental" },
  EPS近二年: { key: "eps_recent_y2", group: "eps", table: "recent_fundamental" },
  EPS近三年: { key: "eps_recent_y3", group: "eps", table: "recent_fundamental" },
  EPS近四年: { key: "eps_recent_y4", group: "eps", table: "recent_fundamental" },
  "營收近一月(月增率)": { key: "revenue_recent_m1_mom", group: "revenue", table: "recent_fundamental", unit: "%" },
  "營收近一月(年增率)": { key: "revenue_recent_m1_yoy", group: "revenue", table: "recent_fundamental", unit: "%" },
  "營收近一月(累計年增率)": { key: "revenue_recent_m1_yoy_acc", group: "revenue", table: "recent_fundamental", unit: "%" },
  "營收近二月(月增率)": { key: "revenue_recent_m2_mom", group: "revenue", table: "recent_fundamental", unit: "%" },
  "營收近二月(年增率)": { key: "revenue_recent_m2_yoy", group: "revenue", table: "recent_fundamental", unit: "%" },
  "營收近二月(累計年增率)": { key: "revenue_recent_m2_yoy_acc", group: "revenue", table: "recent_fundamental", unit: "%" },
  "營收近三月(月增率)": { key: "revenue_recent_m3_mom", group: "revenue", table: "recent_fundamental", unit: "%" },
  "營收近三月(年增率)": { key: "revenue_recent_m3_yoy", group: "revenue", table: "recent_fundamental", unit: "%" },
  "營收近三月(累計年增率)": { key: "revenue_recent_m3_yoy_acc", group: "revenue", table: "recent_fundamental", unit: "%" },
  "營收近四月(月增率)": { key: "revenue_recent_m4_mom", group: "revenue", table: "recent_fundamental", unit: "%" },
  "營收近四月(年增率)": { key: "revenue_recent_m4_yoy", group: "revenue", table: "recent_fundamental", unit: "%" },
  "營收近四月(累計年增率)": { key: "revenue_recent_m4_yoy_acc", group: "revenue", table: "recent_fundamental", unit: "%" },
  近一週外資持股比例: { key: "recent_w1_foreign_ratio", group: "ownership", table: "investor_positions", unit: "%" },
  近一週大戶持股比例: { key: "recent_w1_big_investor_ratio", group: "ownership", table: "investor_positions", unit: "%" },
  近二週外資持股比例: { key: "recent_w2_foreign_ratio", group: "ownership", table: "investor_positions", unit: "%" },
  近二週大戶持股比例: { key: "recent_w2_big_investor_ratio", group: "ownership", table: "investor_positions", unit: "%" },
  近三週外資持股比例: { key: "recent_w3_foreign_ratio", group: "ownership", table: "investor_positions", unit: "%" },
  近三週大戶持股比例: { key: "recent_w3_big_investor_ratio", group: "ownership", table: "investor_positions", unit: "%" },
  近四週外資持股比例: { key: "recent_w4_foreign_ratio", group: "ownership", table: "investor_positions", unit: "%" },
  近四週大戶持股比例: { key: "recent_w4_big_investor_ratio", group: "ownership", table: "investor_positions", unit: "%" },
};

export const STRATEGY_OPERATORS = ["大於", "小於", "等於", "大於等於", "小於等於"] as const;
