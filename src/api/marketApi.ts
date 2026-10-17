import { invoke } from "@tauri-apps/api/core";

export interface ChipData {
  symbol: string;
  asOf: string;
  score: number;
  verdict: "stable_buying" | "distribution" | "mixed" | "retail_crowded";
  confidence: "high" | "medium";
  institutional: {
    foreign5d: number;
    trust5d: number;
    dealer5d: number;
    total5d: number;
    total20d: number;
    consecutiveDays: number;
  };
  margin: {
    marginBalance: number;
    marginChange5d: number;
    marginChangePercent5d: number;
    shortBalance: number;
    shortChange5d: number;
    shortMarginRatio: number;
  };
  history: Array<{
    date: string;
    close: number;
    foreign: number;
    trust: number;
    dealer: number;
    institutionalTotal: number;
    marginBalance: number;
  }>;
  signals: Array<
    | "price_down_institution_buy"
    | "price_up_institution_sell"
    | "margin_chasing"
    | "trust_streak"
  >;
  scoreBreakdown: Array<{
    factor:
      | "foreign_5d"
      | "trust_5d"
      | "dealer_5d"
      | "institutional_20d"
      | "margin_5d";
    points: number;
  }>;
  lights: {
    institutional: "buying" | "selling" | "neutral";
    foreignHolding: "increasing" | "decreasing" | "stable" | "unavailable";
    lendingPressure: "high" | "normal" | "easing" | "unavailable";
    summary: "favorable" | "cautious" | "mixed";
    foreignRatio: number | null;
    foreignChange5d: number | null;
    lendingVolume5d: number;
    lendingChangePercent: number | null;
  };
  source: string;
}

export const marketApi = {
  getChipData: async (symbol: string) =>
    await invoke<ChipData>("get_chip_data", { symbol }),
};
