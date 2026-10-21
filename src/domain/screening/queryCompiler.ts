import { stockDailyQueryBuilder } from "../../classes/StockDailyQueryBuilder";
import { stockHourlyQueryBuilder } from "../../classes/StockHourlyQueryBuilder";
import { stockWeeklyQueryBuilder } from "../../classes/StockWeeklyQueryBuilder";
import type {
  FundamentalPrompts,
  QueryBuilderMappingItem,
  StorePrompt,
} from "../../types";
import type { StrategyTimeframe } from "../strategy/capabilities";
import { FUNDAMENTAL_INDICATORS } from "../strategy/fundamentalCatalog";

export interface ScreeningUniverse {
  stockIds?: string[];
  marketTypes?: string[];
  industryGroups?: string[];
}

export interface CompiledScreeningQuery {
  sql: string;
  parameters: Record<string, string | number>;
}

const OPERATORS: Record<string, string> = {
  小於: "<",
  大於: ">",
  等於: "=",
  大於等於: ">=",
  小於等於: "<=",
};

const TIME_OFFSETS: Record<StrategyTimeframe, Record<string, number>> = {
  daily: { 今天: 0, 昨天: 1, 前天: 2, "3天前": 3, "4天前": 4, "5天前": 5 },
  weekly: { 本週: 0, 上週: 1, 上上週: 2, "3週前": 3, "4週前": 4, "5週前": 5 },
  hourly: { 現在: 0, "1小時前": 1, "2小時前": 2, "3小時前": 3, "4小時前": 4, "5小時前": 5 },
};

const TABLES = {
  daily: { deal: "daily_deal", skills: "daily_skills", time: "t" },
  weekly: { deal: "weekly_deal", skills: "weekly_skills", time: "t" },
  hourly: { deal: "hourly_deal", skills: "hourly_skills", time: "ts" },
} as const;

function mappingFor(timeframe: StrategyTimeframe) {
  if (timeframe === "daily") return stockDailyQueryBuilder.getMapping();
  if (timeframe === "weekly") return stockWeeklyQueryBuilder.getMapping();
  return stockHourlyQueryBuilder.getMapping();
}

function indicatorExpression(
  timeframe: StrategyTimeframe,
  time: string,
  indicator: string,
  mapping: Record<string, QueryBuilderMappingItem>,
): { sql: string; offset: number; source: "deal" | "skills" } {
  const definition = mapping[indicator];
  const offset = TIME_OFFSETS[timeframe][time];
  if (!definition || offset === undefined) {
    throw new Error(`Invalid validated ${timeframe} condition.`);
  }
  const source = definition.group.includes("_sk") ? "skills" : "deal";
  return {
    sql: `${source === "skills" ? "s" : "d"}${offset}."${definition.key}"`,
    offset,
    source,
  };
}

export function appendUniverseFilters(
  clauses: string[],
  parameters: Record<string, string | number>,
  universe: ScreeningUniverse,
  prefix: string,
  stockAlias = "st",
): void {
  const groups: Array<[string, string[] | undefined]> = [
    ["stock_id", universe.stockIds],
    ["market_type", universe.marketTypes],
    ["industry_group", universe.industryGroups],
  ];
  groups.forEach(([column, values]) => {
    if (!values?.length) return;
    const placeholders = values.map((value, index) => {
      const key = `${prefix}_${column}_${index}`;
      parameters[key] = value;
      return `@${key}`;
    });
    clauses.push(`${stockAlias}."${column}" IN (${placeholders.join(", ")})`);
  });
}

export function compileTechnicalScreeningQuery(
  timeframe: StrategyTimeframe,
  conditions: StorePrompt[],
  dates: string[],
  universe: ScreeningUniverse,
): CompiledScreeningQuery {
  const mapping = mappingFor(timeframe);
  const tables = TABLES[timeframe];
  const parameters: Record<string, string | number> = {};
  const required = new Map<number, Set<"deal" | "skills">>();
  const where: string[] = [];
  const select: string[] = ["d0.stock_id AS stock_id"];

  const requireSource = (offset: number, source: "deal" | "skills") => {
    const sources = required.get(offset) ?? new Set<"deal" | "skills">();
    sources.add(source);
    required.set(offset, sources);
  };

  conditions.forEach((condition, index) => {
    const left = indicatorExpression(
      timeframe,
      condition.day1,
      condition.indicator1,
      mapping,
    );
    requireSource(left.offset, left.source);
    let rightSql: string;
    if (condition.day2 === "自定義數值") {
      const key = `${timeframe}_constant_${index}`;
      parameters[key] = Number(condition.indicator2);
      rightSql = `@${key}`;
    } else {
      const right = indicatorExpression(
        timeframe,
        condition.day2,
        condition.indicator2,
        mapping,
      );
      requireSource(right.offset, right.source);
      rightSql = right.sql;
    }
    const operator = OPERATORS[condition.operator];
    if (!operator) throw new Error(`Invalid validated operator ${condition.operator}.`);
    where.push(`${left.sql} ${operator} ${rightSql}`);
    select.push(`${left.sql} AS condition_${index}_left`);
    select.push(`${rightSql} AS condition_${index}_right`);
  });

  requireSource(0, "deal");
  requireSource(0, "skills");
  const dateParameters: Record<string, string> = {};
  const joins: string[] = [];
  for (const [offset, sources] of [...required.entries()].sort((a, b) => a[0] - b[0])) {
    const date = dates[offset];
    if (!date) {
      throw new Error(`Not enough ${timeframe} dates for offset ${offset}.`);
    }
    const dateKey = `${timeframe}_date_${offset}`;
    dateParameters[dateKey] = date;
    if (offset === 0) continue;
    if (sources.has("deal")) {
      joins.push(
        `JOIN ${tables.deal} d${offset} ON d${offset}.stock_id = d0.stock_id AND d${offset}.${tables.time} = @${dateKey}`,
      );
    }
    if (sources.has("skills")) {
      joins.push(
        `LEFT JOIN ${tables.skills} s${offset} ON s${offset}.stock_id = d0.stock_id AND s${offset}.${tables.time} = @${dateKey}`,
      );
    }
  }
  Object.assign(parameters, dateParameters);

  where.unshift(`d0.${tables.time} = @${timeframe}_date_0`);
  appendUniverseFilters(where, parameters, universe, timeframe);

  return {
    sql: `
      SELECT ${select.join(", ")}
      FROM ${tables.deal} d0
      LEFT JOIN ${tables.skills} s0
        ON s0.stock_id = d0.stock_id AND s0.${tables.time} = d0.${tables.time}
      JOIN stock st ON st.stock_id = d0.stock_id
      ${joins.join("\n")}
      WHERE ${where.join(" AND ")}
      ORDER BY d0.stock_id ASC
    `.trim(),
    parameters,
  };
}

export function compileFundamentalScreeningQuery(
  conditions: FundamentalPrompts,
  universe: ScreeningUniverse,
): CompiledScreeningQuery {
  const parameters: Record<string, string | number> = {};
  const where: string[] = [];
  const select: string[] = ["st.stock_id AS stock_id"];
  const aliases = {
    financial_metric: "fm",
    recent_fundamental: "rf",
    investor_positions: "ip",
  } as const;

  conditions.forEach((condition, index) => {
    const left = FUNDAMENTAL_INDICATORS[condition.indicator];
    if (!left) throw new Error("Invalid validated fundamental indicator.");
    const leftSql = `${aliases[left.table]}."${left.key}"`;
    let rightSql: string;
    if (Number.isFinite(Number(condition.value))) {
      const key = `fundamental_constant_${index}`;
      parameters[key] = Number(condition.value);
      rightSql = `@${key}`;
    } else {
      const right = FUNDAMENTAL_INDICATORS[condition.value];
      if (!right || right.table !== left.table) {
        throw new Error("Invalid validated fundamental comparison.");
      }
      rightSql = `${aliases[right.table]}."${right.key}"`;
    }
    const operator = OPERATORS[condition.operator];
    if (!operator) throw new Error("Invalid validated fundamental operator.");
    where.push(`${leftSql} ${operator} ${rightSql}`);
    select.push(`${leftSql} AS condition_${index}_left`);
    select.push(`${rightSql} AS condition_${index}_right`);
  });
  appendUniverseFilters(where, parameters, universe, "fundamental");

  return {
    sql: `
      SELECT ${select.join(", ")}
      FROM stock st
      LEFT JOIN financial_metric fm ON fm.stock_id = st.stock_id
      LEFT JOIN recent_fundamental rf ON rf.stock_id = st.stock_id
      LEFT JOIN investor_positions ip ON ip.stock_id = st.stock_id
      WHERE ${where.length ? where.join(" AND ") : "1 = 1"}
      ORDER BY st.stock_id ASC
    `.trim(),
    parameters,
  };
}
