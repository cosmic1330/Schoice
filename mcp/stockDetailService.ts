import { stockDailyQueryBuilder } from "../src/classes/StockDailyQueryBuilder";
import { stockHourlyQueryBuilder } from "../src/classes/StockHourlyQueryBuilder";
import { stockWeeklyQueryBuilder } from "../src/classes/StockWeeklyQueryBuilder";
import type { QueryBuilderMappingItem } from "../src/types";
import type { StrategyTimeframe } from "../src/domain/strategy/capabilities";
import type { SchoiceDatabase } from "./localDatabase";

const DEFAULT_INDICATORS = [
  "ma5",
  "ma20",
  "ma60",
  "macd",
  "osc",
  "k",
  "d",
  "rsi5",
  "rsi10",
] as const;

const TABLES = {
  daily: { deal: "daily_deal", skills: "daily_skills", time: "t" },
  weekly: { deal: "weekly_deal", skills: "weekly_skills", time: "t" },
  hourly: { deal: "hourly_deal", skills: "hourly_skills", time: "ts" },
} as const;

type DatabaseValue = string | number | null;

interface HistoryRow {
  time: string;
  o: number | null;
  h: number | null;
  l: number | null;
  c: number | null;
  v: number | null;
  [key: string]: DatabaseValue;
}

export interface StockHistoryOptions {
  stockId: string;
  timeframe: StrategyTimeframe;
  indicators?: string[];
  asOf: "latest" | string;
  limit: number;
}

function mappingFor(
  timeframe: StrategyTimeframe,
): Record<string, QueryBuilderMappingItem> {
  if (timeframe === "daily") return stockDailyQueryBuilder.getMapping();
  if (timeframe === "weekly") return stockWeeklyQueryBuilder.getMapping();
  return stockHourlyQueryBuilder.getMapping();
}

function numberOrNull(value: DatabaseValue | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function cutoffFor(timeframe: StrategyTimeframe, asOf: "latest" | string) {
  if (asOf === "latest") return null;
  if (timeframe === "hourly") {
    if (/^\d{8}$/.test(asOf)) return `${asOf}2359`;
    if (/^\d{12}$/.test(asOf)) return asOf;
    throw new Error("Hourly as_of must be latest, YYYYMMDD, or YYYYMMDDHHMM.");
  }
  if (!/^\d{8}$/.test(asOf)) {
    throw new Error(`${timeframe} as_of must be latest or YYYYMMDD.`);
  }
  return asOf;
}

function calculateSummary(
  points: Array<{
    time: string;
    open: number | null;
    high: number | null;
    low: number | null;
    close: number | null;
    volume: number | null;
  }>,
) {
  const latest = points.at(-1) ?? null;
  const previous = points.at(-2) ?? null;
  const validCloses = points
    .map((point) => point.close)
    .filter((value): value is number => value !== null);
  const validHighs = points
    .map((point) => point.high)
    .filter((value): value is number => value !== null);
  const validLows = points
    .map((point) => point.low)
    .filter((value): value is number => value !== null);
  const validVolumes = points
    .map((point) => point.volume)
    .filter((value): value is number => value !== null);
  const closeChange =
    latest?.close != null && previous?.close != null
      ? latest.close - previous.close
      : null;
  const closeChangePercent =
    closeChange !== null && previous?.close
      ? (closeChange / previous.close) * 100
      : null;
  const periodReturnPercent =
    validCloses.length >= 2 && validCloses[0] !== 0
      ? ((validCloses.at(-1)! - validCloses[0]) / validCloses[0]) * 100
      : null;

  return {
    points: points.length,
    firstTime: points[0]?.time ?? null,
    lastTime: latest?.time ?? null,
    latestClose: latest?.close ?? null,
    closeChange,
    closeChangePercent,
    periodReturnPercent,
    periodHigh: validHighs.length ? Math.max(...validHighs) : null,
    periodLow: validLows.length ? Math.min(...validLows) : null,
    averageVolume: validVolumes.length
      ? validVolumes.reduce((sum, value) => sum + value, 0) / validVolumes.length
      : null,
  };
}

export class StockDetailService {
  constructor(private readonly database: SchoiceDatabase) {}

  private stock(stockId: string) {
    return this.database
      .prepare(
        `
          SELECT stock_id, stock_name, industry_group, market_type, issued_shares
          FROM stock
          WHERE stock_id = ?
        `,
      )
      .get(stockId) as
      | {
          stock_id: string;
          stock_name: string;
          industry_group: string;
          market_type: string;
          issued_shares: number | null;
        }
      | undefined;
  }

  history(options: StockHistoryOptions) {
    const stock = this.stock(options.stockId);
    if (!stock) throw new Error(`Stock ${options.stockId} was not found.`);

    const mapping = mappingFor(options.timeframe);
    const indicatorIds = [
      ...new Set(options.indicators ?? DEFAULT_INDICATORS),
    ];
    const unsupported = indicatorIds.filter((indicator) => !mapping[indicator]);
    if (unsupported.length) {
      throw new Error(
        `Unsupported ${options.timeframe} indicators: ${unsupported.join(", ")}.`,
      );
    }

    const tables = TABLES[options.timeframe];
    const selectedIndicators = indicatorIds.map((indicator, index) => {
      const definition = mapping[indicator];
      const source = definition.group.includes("_sk") ? "s" : "d";
      return `${source}."${definition.key}" AS indicator_${index}`;
    });
    const parameters: Record<string, string | number> = {
      stock_id: options.stockId,
      limit: options.limit,
    };
    const where = ["d.stock_id = @stock_id"];
    const cutoff = cutoffFor(options.timeframe, options.asOf);
    if (cutoff) {
      parameters.as_of = cutoff;
      where.push(`d.${tables.time} <= @as_of`);
    }

    const rows = this.database
      .prepare(
        `
          SELECT
            d.${tables.time} AS time,
            d.o,
            d.h,
            d.l,
            d.c,
            d.v
            ${selectedIndicators.length ? `, ${selectedIndicators.join(", ")}` : ""}
          FROM ${tables.deal} d
          LEFT JOIN ${tables.skills} s
            ON s.stock_id = d.stock_id AND s.${tables.time} = d.${tables.time}
          WHERE ${where.join(" AND ")}
          ORDER BY d.${tables.time} DESC
          LIMIT @limit
        `,
      )
      .all(parameters) as HistoryRow[];

    const points = rows.reverse().map((row) => ({
      time: String(row.time),
      open: numberOrNull(row.o),
      high: numberOrNull(row.h),
      low: numberOrNull(row.l),
      close: numberOrNull(row.c),
      volume: numberOrNull(row.v),
      indicators: Object.fromEntries(
        indicatorIds.map((indicator, index) => [
          indicator,
          numberOrNull(row[`indicator_${index}`]),
        ]),
      ),
    }));

    return {
      stock: {
        stockId: stock.stock_id,
        stockName: stock.stock_name,
        industryGroup: stock.industry_group,
        marketType: stock.market_type,
        issuedShares: stock.issued_shares,
      },
      timeframe: options.timeframe,
      requestedAsOf: options.asOf,
      indicators: indicatorIds,
      order: "ascending" as const,
      summary: calculateSummary(points),
      points,
    };
  }

  detail(stockId: string) {
    const stock = this.stock(stockId);
    if (!stock) throw new Error(`Stock ${stockId} was not found.`);

    const health = this.database
      .prepare("SELECT * FROM stock_health_view WHERE stock_id = ?")
      .get(stockId) as Record<string, DatabaseValue> | undefined;
    const financialMetrics = this.database
      .prepare("SELECT * FROM financial_metric WHERE stock_id = ?")
      .get(stockId) as Record<string, DatabaseValue> | undefined;
    const recentFundamental = this.database
      .prepare("SELECT * FROM recent_fundamental WHERE stock_id = ?")
      .get(stockId) as Record<string, DatabaseValue> | undefined;
    const investorPositions = this.database
      .prepare("SELECT * FROM investor_positions WHERE stock_id = ?")
      .get(stockId) as Record<string, DatabaseValue> | undefined;

    const technical = Object.fromEntries(
      (["daily", "weekly", "hourly"] as const).map((timeframe) => {
        const result = this.history({
          stockId,
          timeframe,
          asOf: "latest",
          limit: 2,
        });
        return [
          timeframe,
          {
            dataDate: result.summary.lastTime,
            previousDataDate: result.points.at(-2)?.time ?? null,
            latest: result.points.at(-1) ?? null,
            change: {
              close: result.summary.closeChange,
              percent: result.summary.closeChangePercent,
            },
          },
        ];
      }),
    );

    return {
      stock: {
        stockId: stock.stock_id,
        stockName: stock.stock_name,
        industryGroup: stock.industry_group,
        marketType: stock.market_type,
        issuedShares: stock.issued_shares,
      },
      technical,
      fundamentals: {
        financialMetrics: financialMetrics ?? null,
        recentFundamental: recentFundamental ?? null,
        investorPositions: investorPositions ?? null,
      },
      coverage: {
        dailyLastDate: health?.daily_last_date ?? null,
        dailyRecordCount: health?.daily_record_count ?? 0,
        weeklyLastDate: health?.weekly_last_date ?? null,
        hourlyLastDate: health?.hourly_last_date ?? null,
        revenueLastMonth: health?.revenue_last_month ?? null,
        hasFinancials: health?.has_financials === 1,
        hasFundamentals: health?.has_fundamentals === 1,
        hasRevenue: health?.has_revenue === 1,
        hasPositions: health?.has_positions === 1,
      },
      unavailableLocalSections: [
        "tdcc_holder",
        "finmind_institutional_margin_lending",
      ],
    };
  }
}
