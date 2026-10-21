import type { PromptValue, StorePrompt } from "../src/types";
import {
  compileFundamentalScreeningQuery,
  compileTechnicalScreeningQuery,
  type ScreeningUniverse,
} from "../src/domain/screening/queryCompiler";
import type { StrategyTimeframe } from "../src/domain/strategy/capabilities";
import type { FundamentalPrompts } from "../src/types";
import type { SchoiceDatabase } from "./localDatabase";

export interface ScreenStocksOptions {
  strategyName: string;
  conditions: PromptValue;
  fundamentalConditions: FundamentalPrompts;
  universe: ScreeningUniverse;
  asOf: "latest" | string;
  limit: number;
  offset: number;
}

export interface ConditionEvidence {
  timeframe: StrategyTimeframe | "fundamental";
  index: number;
  condition: StorePrompt | FundamentalPrompts[number];
  leftValue: number | null;
  rightValue: number | null;
  passed: true;
}

interface ScreeningRow {
  stock_id: string;
  [key: string]: string | number | null;
}

export class ScreeningService {
  constructor(private readonly database: SchoiceDatabase) {}

  private getAsOf(requested: "latest" | string): string {
    if (requested !== "latest") {
      if (!/^\d{8}$/.test(requested)) {
        throw new Error("as_of must be 'latest' or YYYYMMDD.");
      }
      const row = this.database
        .prepare("SELECT MAX(t) AS value FROM daily_deal WHERE t <= ?")
        .get(requested) as { value: string | null };
      if (!row.value) throw new Error(`No daily data is available on or before ${requested}.`);
      return row.value;
    }
    const row = this.database
      .prepare("SELECT MAX(t) AS value FROM daily_deal")
      .get() as { value: string | null };
    if (!row.value) throw new Error("The local database contains no daily market data.");
    return row.value;
  }

  private datesFor(timeframe: StrategyTimeframe, asOf: string): string[] {
    if (timeframe === "daily") {
      return (
        this.database
          .prepare("SELECT DISTINCT t AS value FROM daily_deal WHERE t <= ? ORDER BY t DESC LIMIT 6")
          .all(asOf) as Array<{ value: string }>
      ).map((row) => row.value);
    }
    if (timeframe === "weekly") {
      return (
        this.database
          .prepare("SELECT DISTINCT t AS value FROM weekly_deal WHERE t <= ? ORDER BY t DESC LIMIT 6")
          .all(asOf) as Array<{ value: string }>
      ).map((row) => row.value);
    }
    return (
      this.database
        .prepare("SELECT DISTINCT ts AS value FROM hourly_deal WHERE ts <= ? ORDER BY ts DESC LIMIT 6")
        .all(`${asOf}2359`) as Array<{ value: string }>
    ).map((row) => String(row.value));
  }

  private execute(
    sql: string,
    parameters: Record<string, string | number>,
  ): ScreeningRow[] {
    return this.database.prepare(sql).all(parameters) as ScreeningRow[];
  }

  screen(options: ScreenStocksOptions) {
    const asOf = this.getAsOf(options.asOf);
    const evidence = new Map<string, ConditionEvidence[]>();
    const resultSets: Set<string>[] = [];
    const selectedDates: Partial<Record<StrategyTimeframe, string[]>> = {};
    const timeframes: StrategyTimeframe[] = ["daily", "weekly", "hourly"];

    for (const timeframe of timeframes) {
      const conditions = options.conditions[timeframe];
      if (conditions.length === 0) continue;
      const dates = this.datesFor(timeframe, asOf);
      selectedDates[timeframe] = dates;
      const compiled = compileTechnicalScreeningQuery(
        timeframe,
        conditions,
        dates,
        options.universe,
      );
      const rows = this.execute(compiled.sql, compiled.parameters);
      resultSets.push(new Set(rows.map((row) => row.stock_id)));
      rows.forEach((row) => {
        const items = evidence.get(row.stock_id) ?? [];
        conditions.forEach((condition, index) => {
          items.push({
            timeframe,
            index,
            condition,
            leftValue: Number(row[`condition_${index}_left`]),
            rightValue: Number(row[`condition_${index}_right`]),
            passed: true,
          });
        });
        evidence.set(row.stock_id, items);
      });
    }

    if (options.fundamentalConditions.length > 0) {
      const compiled = compileFundamentalScreeningQuery(
        options.fundamentalConditions,
        options.universe,
      );
      const rows = this.execute(compiled.sql, compiled.parameters);
      resultSets.push(new Set(rows.map((row) => row.stock_id)));
      rows.forEach((row) => {
        const items = evidence.get(row.stock_id) ?? [];
        options.fundamentalConditions.forEach((condition, index) => {
          items.push({
            timeframe: "fundamental",
            index,
            condition,
            leftValue: Number(row[`condition_${index}_left`]),
            rightValue: Number(row[`condition_${index}_right`]),
            passed: true,
          });
        });
        evidence.set(row.stock_id, items);
      });
    }

    if (resultSets.length === 0) {
      throw new Error("At least one technical or fundamental condition is required.");
    }
    const matchedIds = [...resultSets[0]].filter((stockId) =>
      resultSets.every((set) => set.has(stockId)),
    );
    matchedIds.sort((left, right) =>
      left.localeCompare(right, undefined, { numeric: true }),
    );
    const total = matchedIds.length;
    const pageIds = matchedIds.slice(options.offset, options.offset + options.limit);
    const stockParameters = Object.fromEntries(
      pageIds.map((stockId, index) => [`stock_${index}`, stockId]),
    );
    const stocks = pageIds.length
      ? (this.database
          .prepare(
            `
              SELECT stock_id, stock_name, industry_group, market_type, issued_shares
              FROM stock
              WHERE stock_id IN (${pageIds.map((_, index) => `@stock_${index}`).join(", ")})
            `,
          )
          .all(stockParameters) as Array<{
          stock_id: string;
          stock_name: string;
          industry_group: string;
          market_type: string;
          issued_shares: number | null;
        }>)
      : [];
    const stockById = new Map(stocks.map((stock) => [stock.stock_id, stock]));

    return {
      strategyName: options.strategyName,
      asOf,
      dataDates: Object.fromEntries(
        Object.entries(selectedDates).map(([timeframe, dates]) => [
          timeframe,
          dates?.[0] ?? null,
        ]),
      ),
      total,
      limit: options.limit,
      offset: options.offset,
      nextOffset:
        options.offset + options.limit < total
          ? options.offset + options.limit
          : null,
      matches: pageIds.map((stockId) => {
        const stock = stockById.get(stockId);
        return {
          stockId,
          stockName: stock?.stock_name ?? "",
          industryGroup: stock?.industry_group ?? "",
          marketType: stock?.market_type ?? "",
          issuedShares: stock?.issued_shares ?? null,
          matchedConditions: evidence.get(stockId) ?? [],
        };
      }),
    };
  }
}
