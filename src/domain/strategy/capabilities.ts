import type { BaseQueryBuilder } from "../../classes/BaseQueryBuilder";
import { stockDailyQueryBuilder } from "../../classes/StockDailyQueryBuilder";
import { stockHourlyQueryBuilder } from "../../classes/StockHourlyQueryBuilder";
import { stockWeeklyQueryBuilder } from "../../classes/StockWeeklyQueryBuilder";
import { FUNDAMENTAL_INDICATORS, STRATEGY_OPERATORS } from "./fundamentalCatalog";

export type StrategyTimeframe = "daily" | "weekly" | "hourly";
export type CapabilitySection = StrategyTimeframe | "fundamental";

export interface IndicatorCapability {
  id: string;
  label: string;
  unit: string | null;
  group: string;
  comparison: Array<"constant" | "indicator">;
}

export interface TechnicalCapability {
  kind: "technical";
  timeframe: StrategyTimeframe;
  leftTimeOptions: string[];
  rightTimeOptions: string[];
  operators: string[];
  indicators: IndicatorCapability[];
}

export interface FundamentalCapability {
  kind: "fundamental";
  timeframe: "fundamental";
  operators: string[];
  indicators: IndicatorCapability[];
}

const BUILDERS: Record<StrategyTimeframe, BaseQueryBuilder> = {
  daily: stockDailyQueryBuilder,
  weekly: stockWeeklyQueryBuilder,
  hourly: stockHourlyQueryBuilder,
};

function technicalCapability(timeframe: StrategyTimeframe): TechnicalCapability {
  const builder = BUILDERS[timeframe];
  const options = builder.getOptions();
  const mapping = builder.getMapping();

  return {
    kind: "technical",
    timeframe,
    leftTimeOptions: [...options.timeOptions].filter(
      (option) => option !== "自定義數值",
    ),
    rightTimeOptions: [...options.timeOptions],
    operators: [...options.operators],
    indicators: options.indicators.map((id) => ({
      id,
      label: id,
      unit: mapping[id]?.unit ?? null,
      group: mapping[id]?.group.includes("_sk") ? "technical" : "price",
      comparison: ["constant", "indicator"],
    })),
  };
}

function fundamentalCapability(): FundamentalCapability {
  return {
    kind: "fundamental",
    timeframe: "fundamental",
    operators: [...STRATEGY_OPERATORS],
    indicators: Object.entries(FUNDAMENTAL_INDICATORS).map(([id, definition]) => ({
      id,
      label: id,
      unit: definition.unit ?? null,
      group: definition.group,
      comparison: ["constant", "indicator"],
    })),
  };
}

export function getStrategyCapabilities(
  section: CapabilitySection | "all" = "all",
): Array<TechnicalCapability | FundamentalCapability> {
  if (section === "all") {
    return [
      technicalCapability("daily"),
      technicalCapability("weekly"),
      technicalCapability("hourly"),
      fundamentalCapability(),
    ];
  }
  if (section === "fundamental") return [fundamentalCapability()];
  return [technicalCapability(section)];
}

export function getTechnicalCapability(
  timeframe: StrategyTimeframe,
): TechnicalCapability {
  return technicalCapability(timeframe);
}
