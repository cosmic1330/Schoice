import { QueryBuilderMappingItem, StorePrompt } from "../types";
import { BaseQueryBuilder } from "./BaseQueryBuilder";

export class StockFundamentalQueryBuilder extends BaseQueryBuilder {
  // 新增靜態選項
  static readonly options = {
    days: ["今天", "自定義數值"],
    indicators: [
      "本益比",
      "殖利率",
      "股價淨值比",
      "當月營收年增率",
      "EPS",
      "三年平均殖利率",
      "五年平均殖利率",
    ],
    operators: ["大於", "小於", "等於", "大於等於", "小於等於"],
  } as const;

  protected mapping: Record<string, QueryBuilderMappingItem> = {
    本益比: { key: "pe", group: "" },
    殖利率: { key: "dividend_yield", group: "" },
    股價淨值比: { key: "pb", group: "" },
    當月營收年增率: { key: "yoy", group: "" },
    EPS: { key: "eps", group: "" },
    三年平均殖利率: { key: "dividend_yield_3y", group: "" },
    五年平均殖利率: { key: "dividend_yield_5y", group: "" },
  };

  protected getSpecificOptions(): Record<string, readonly string[]> {
    return {
      days: ["今天", "自定義數值"],
    };
  }

  public generateExpression(prompt: StorePrompt): string[] {
    const { indicator1, operator, indicator2 } = prompt;
    const operatorKey = this.convertOperator(operator);
    return [this.mapping[indicator1].key, operatorKey, indicator2];
  }

  public generateSqlQuery({
    conditions,
    stockIds,
  }: {
    conditions: string[];
    stockIds?: string[];
  }): string {
    const stockIdCondition = stockIds
      ? `stock_id IN ('${stockIds.join("','")}') AND`
      : "";

    const query = `
      SELECT stock_id FROM fundamental WHERE ${stockIdCondition} ${conditions.join(
      " AND "
    )}
    `;

    return query.trim();
  }
}

export const stockFundamentalQueryBuilder = new StockFundamentalQueryBuilder();
