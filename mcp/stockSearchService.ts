import type { SchoiceDatabase } from "./localDatabase";

export interface SearchStocksOptions {
  query: string;
  marketTypes?: string[];
  industryGroups?: string[];
  limit: number;
}

export interface StockSearchResult {
  stockId: string;
  stockName: string;
  industryGroup: string;
  marketType: string;
  issuedShares: number | null;
}

export const MARKET_TYPE_ALIASES: Record<string, string> = {
  TWSE: "上市",
  OTC: "上櫃",
  TPEX: "上櫃",
  TIB: "上市臺灣創新板",
  上市: "上市",
  上櫃: "上櫃",
  上市臺灣創新板: "上市臺灣創新板",
};

export function normalizeMarketTypes(values?: string[]): string[] | undefined {
  if (!values?.length) return undefined;
  return [...new Set(values.map((value) => MARKET_TYPE_ALIASES[value] ?? value))];
}

function escapeLikePattern(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}

export class StockSearchService {
  constructor(private readonly database: SchoiceDatabase) {}

  search(options: SearchStocksOptions): StockSearchResult[] {
    const escapedQuery = escapeLikePattern(options.query);
    const parameters: Record<string, string | number> = {
      exact: options.query,
      prefix: `${escapedQuery}%`,
      contains: `%${escapedQuery}%`,
      limit: options.limit,
    };
    const where = [
      "(stock_id LIKE @contains ESCAPE '\\' OR stock_name LIKE @contains ESCAPE '\\' OR industry_group LIKE @contains ESCAPE '\\')",
    ];
    const marketTypes = normalizeMarketTypes(options.marketTypes);

    if (marketTypes?.length) {
      const placeholders = marketTypes.map((value, index) => {
        const key = `market_${index}`;
        parameters[key] = value;
        return `@${key}`;
      });
      where.push(`market_type IN (${placeholders.join(", ")})`);
    }
    if (options.industryGroups?.length) {
      const placeholders = options.industryGroups.map((value, index) => {
        const key = `industry_${index}`;
        parameters[key] = value;
        return `@${key}`;
      });
      where.push(`industry_group IN (${placeholders.join(", ")})`);
    }

    const rows = this.database
      .prepare(
        `
          SELECT stock_id, stock_name, industry_group, market_type, issued_shares
          FROM stock
          WHERE ${where.join(" AND ")}
          ORDER BY
            CASE
              WHEN stock_id = @exact THEN 0
              WHEN stock_name = @exact THEN 1
              WHEN stock_id LIKE @prefix ESCAPE '\\' THEN 2
              WHEN stock_name LIKE @prefix ESCAPE '\\' THEN 3
              ELSE 4
            END,
            stock_id ASC
          LIMIT @limit
        `,
      )
      .all(parameters) as Array<{
      stock_id: string;
      stock_name: string;
      industry_group: string;
      market_type: string;
      issued_shares: number | null;
    }>;

    return rows.map((row) => ({
      stockId: row.stock_id,
      stockName: row.stock_name,
      industryGroup: row.industry_group,
      marketType: row.market_type,
      issuedShares: row.issued_shares,
    }));
  }
}
