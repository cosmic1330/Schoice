/****
 * Data Example: [{"t":20241007,"o":199.0,"h":199.0,"l":195.0,"c":197.5,"v":83451}]
 ****/

export type TaType = {
  t: number; // 20241007 or '2025-12-18 14:00:00'
  o: number; // 199.0
  h: number; // 199.0
  l: number; // 195.0
  c: number; // 197.5
  v: number; // 83451
};

export type TaListType = TaType[];

export enum PromptType {
  BULL = "bull",
  BEAR = "bear",
}

export type StorePrompt = {
  day1: string;
  indicator1: string;
  operator: string;
  day2: string;
  indicator2: string;
};

export type Prompts = StorePrompt[];

export type PromptValue = {
  daily: Prompts;
  weekly: Prompts;
  hourly: Prompts;
};

export type PromptItem = {
  name: string;
  conditions: PromptValue;
  index: number;
};

export type PromptsMap = {
  [key: string]: PromptItem;
};

export type TrashPrompt = {
  time: number;
  id: string;
  type: PromptType;
  value: PromptItem;
};

export type QueryBuilderMappingItem = {
  key: string;
  group: string;
};

/****
 * Supabase
 ****/
export type StockTableType = {
  stock_id: string;
  stock_name: string;
  industry_group: string;
  market_type: string;
  options?: Map<string, WatchStockItem>;
};

export type FinancialMetricTableType = {
  stock_id: string;
  pe: number | null;
  pb: number | null;
  dividend_yield: number | null;
  report_period: string | null;
  gross_profit_margin: number | null;
  operating_margin: number | null;
  pre_tax_profit_margin: number | null;
  roa: number | null;
  roe: number | null;
  book_value_per_share: number | null;
  updated_at: string; // 或 Date
};

export type FundamentalConditionTableType = {
  user_id: string;
  conditions: string | null;
};

export type WatchStockItem = {
  stock_id: string;
  added_date: string;
  strategy_name?: string;
};

export type WatchStockTableType = {
  user_id: string;
  stock_id: string;
};

export type RecentFundamentalTableType = {
  stock_id: string;

  // 最近四季 EPS
  eps_recent_q1: number | null;
  eps_recent_q1_name: string | null;
  eps_recent_q2: number | null;
  eps_recent_q2_name: string | null;
  eps_recent_q3: number | null;
  eps_recent_q3_name: string | null;
  eps_recent_q4: number | null;
  eps_recent_q4_name: string | null;

  // 最近四年 EPS
  eps_recent_y1: number | null;
  eps_recent_y1_name: string | null;
  eps_recent_y2: number | null;
  eps_recent_y2_name: string | null;
  eps_recent_y3: number | null;
  eps_recent_y3_name: string | null;
  eps_recent_y4: number | null;
  eps_recent_y4_name: string | null;

  // 最近四個月 營收（月增率 / 年增率 / 累計年增率 / 月份名稱）
  revenue_recent_m1_mom: number | null;
  revenue_recent_m1_yoy: number | null;
  revenue_recent_m1_yoy_acc: number | null;
  revenue_recent_m1_name: string | null;

  revenue_recent_m2_mom: number | null;
  revenue_recent_m2_yoy: number | null;
  revenue_recent_m2_yoy_acc: number | null;
  revenue_recent_m2_name: string | null;

  revenue_recent_m3_mom: number | null;
  revenue_recent_m3_yoy: number | null;
  revenue_recent_m3_yoy_acc: number | null;
  revenue_recent_m3_name: string | null;

  revenue_recent_m4_mom: number | null;
  revenue_recent_m4_yoy: number | null;
  revenue_recent_m4_yoy_acc: number | null;
  revenue_recent_m4_name: string | null;
};

export type InvestorPositionsTableType = {
  stock_id: string;
  recent_w1_foreign_ratio: number | null;
  recent_w1_big_investor_ratio: number | null;
  recent_w1_name: string | null;
  recent_w2_foreign_ratio: number | null;
  recent_w2_big_investor_ratio: number | null;
  recent_w2_name: string | null;
  recent_w3_foreign_ratio: number | null;
  recent_w3_big_investor_ratio: number | null;
  recent_w3_name: string | null;
  recent_w4_foreign_ratio: number | null;
  recent_w4_big_investor_ratio: number | null;
  recent_w4_name: string | null;
};

export type UserPromptsTableType = {
  prompt_id: number;
  user_id: string;
  prompt_type: string | null;
  prompt_name: string | null;
  conditions: string | null;
  updated_at: string; // or Date
  alarm: boolean;
  trash: boolean;
};

export type ProfilesTableType = {
  user_id: string;
  plan_tier: string | null;
};

/****
 * Sqlite
 ****/
export type DealTableType = {
  stock_id: string;
  t: string;
  c: number;
  o: number;
  h: number;
  l: number;
  v: number;
};

export type SkillsTableType = {
  stock_id: string;
  t: string;
  ma5: number;
  ma5_ded: number;
  ma10: number;
  ma10_ded: number;
  ma20: number;
  ma20_ded: number;
  ma60: number;
  ma60_ded: number;
  ma120: number;
  ma120_ded: number;
  ema5: number;
  ema10: number;
  ema20: number;
  ema60: number;
  ema120: number;
  macd: number;
  dif: number;
  osc: number;
  k: number;
  d: number;
  j: number;
  rsi5: number;
  rsi10: number;
  bollUb: number;
  bollMa: number;
  bollLb: number;
  obv: number;
  obv_ma5: number;
  obv_ma10: number;
  obv_ma20: number;
  obv_ma60: number;
  obv_ema5: number;
  obv_ema10: number;
  obv_ema20: number;
  obv_ema60: number;
  mfi: number | null;
  tenkan: number | null;
  kijun: number | null;
  senkouA: number | null;
  senkouB: number | null;
  chikou: number | null;
  di_plus: number;
  di_minus: number;
  adx: number;
};

export type TickDealsType = {
  id: string;
  ts: number;
  price: number;
  avgPrices: number[];
  changePercent: number;
  closes: number[];
  previousClose: number;
};

export type TimeSharingDealTableType = {
  stock_id: string;
  ts: string;
  c: number;
  o: number;
  h: number;
  l: number;
  v: number;
};

export type TimeSharingSkillsTableType = {
  stock_id: string;
  ts: string;
  ma5: number;
  ma5_ded: number;
  ma10: number;
  ma10_ded: number;
  ma20: number;
  ma20_ded: number;
  ma60: number;
  ma60_ded: number;
  ma120: number;
  ma120_ded: number;
  ema5: number;
  ema10: number;
  ema20: number;
  ema60: number;
  ema120: number;
  macd: number;
  dif: number;
  osc: number;
  k: number;
  d: number;
  j: number;
  rsi5: number;
  rsi10: number;
  bollUb: number;
  bollMa: number;
  bollLb: number;
  obv: number;
  obv_ma5: number;
  obv_ma10: number;
  obv_ma20: number;
  obv_ma60: number;
  obv_ema5: number;
  obv_ema10: number;
  obv_ema20: number;
  obv_ema60: number;
  mfi: number | null;
  tenkan: number | null;
  kijun: number | null;
  senkouA: number | null;
  senkouB: number | null;
  chikou: number | null;
  di_plus: number;
  di_minus: number;
  adx: number;
};

/****
 * Enum Types
 ****/
export enum DealTableOptions {
  DailyDeal = "daily_deal",
  WeeklyDeal = "weekly_deal",
}

export enum SkillsTableOptions {
  DailySkills = "daily_skills",
  WeeklySkills = "weekly_skills",
}

export enum TimeSharingDealTableOptions {
  HourlyDeal = "hourly_deal",
}

export enum TimeSharingSkillsTableOptions {
  HourlySkills = "hourly_skills",
}

export enum CsvDaTaListType {
  Deal = "Deal",
  Skills = "Skills",
}

// 繼承 SkillsTableType但是不要bollUb, bollMa, bollLb改成 boll_ub, boll_ma, boll_lb
export type SkillsCsvDaTaListType = Omit<
  SkillsTableType,
  "bollUb" | "bollMa" | "bollLb"
> & {
  boll_ub: number;
  boll_ma: number;
  boll_lb: number;
};

export enum UrlType {
  Indicators = "indicators",
  Ta = "ta",
  Tick = "tick",
}
export enum UrlTaPerdOptions {
  OneMinute = "1m",
  FiveMinute = "5m",
  ThirtyMinute = "30m",
  Hour = "60m",
  Day = "d",
  Week = "w",
  Month = "m",
}

export enum FutureIds {
  WTX = "WTX%26.TW", // 台指期近一
  TWSE = "^TWII", // 台灣加權指數
  NASDAQ = "^IXIC", // 納斯達克指數
  OTC = "^TWOII", // OTC
}

export interface SignalType<T = string> {
  t: number;
  type: T;
  description: string;
}

export enum DivergenceSignalType {
  BEARISH_DIVERGENCE = "頂背離",
  BULLISH_DIVERGENCE = "底背離",
}

export type SelectType = {
  prompt_id: string;
  type: PromptType;
};

export type FundamentalPrompt = {
  indicator: string;
  operator: string;
  value: string;
};

export type FundamentalPrompts = FundamentalPrompt[];
