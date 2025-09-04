import { QueryBuilderMappingItem, StorePrompt } from "../types";
import { BaseQueryBuilder } from "./BaseQueryBuilder";

export class StockDailyQueryBuilder extends BaseQueryBuilder {
  protected mapping: Record<string, QueryBuilderMappingItem> = {
    收盤價: { key: "c", group: "_day_ago" },
    開盤價: { key: "o", group: "_day_ago" },
    成交量: { key: "v", group: "_day_ago" },
    最低價: { key: "l", group: "_day_ago" },
    最高價: { key: "h", group: "_day_ago" },
    ma5: { key: "ma5", group: "_day_ago_sk" },
    ma5扣抵: { key: "ma5_ded", group: "_day_ago_sk" },
    ma10: { key: "ma10", group: "_day_ago_sk" },
    ma10扣抵: { key: "ma10_ded", group: "_day_ago_sk" },
    ma20: { key: "ma20", group: "_day_ago_sk" },
    ma20扣抵: { key: "ma20_ded", group: "_day_ago_sk" },
    ma60: { key: "ma60", group: "_day_ago_sk" },
    ma60扣抵: { key: "ma60_ded", group: "_day_ago_sk" },
    ma120: { key: "ma120", group: "_day_ago_sk" },
    ma120扣抵: { key: "ma120_ded", group: "_day_ago_sk" },
    ema5: { key: "ema5", group: "_day_ago_sk" },
    ema10: { key: "ema10", group: "_day_ago_sk" },
    ema20: { key: "ema20", group: "_day_ago_sk" },
    ema60: { key: "ema60", group: "_day_ago_sk" },
    ema120: { key: "ema120", group: "_day_ago_sk" },
    macd: { key: "macd", group: "_day_ago_sk" },
    dif: { key: "dif", group: "_day_ago_sk" },
    osc: { key: "osc", group: "_day_ago_sk" },
    k: { key: "k", group: "_day_ago_sk" },
    d: { key: "d", group: "_day_ago_sk" },
    j: { key: "j", group: "_day_ago_sk" },
    rsi5: { key: "rsi5", group: "_day_ago_sk" },
    rsi10: { key: "rsi10", group: "_day_ago_sk" },
    布林上軌: { key: "bollUb", group: "_day_ago_sk" },
    布林中軌: { key: "bollMa", group: "_day_ago_sk" },
    布林下軌: { key: "bollLb", group: "_day_ago_sk" },
    obv: { key: "obv", group: "_day_ago_sk" },
    obv5: { key: "obv5", group: "_day_ago_sk" },
  };

  static getSpecificOptions(): Record<string, readonly string[]> {
    return {
      days: ["今天", "昨天", "前天", "3天前", "4天前", "5天前", "自定義數值"],
      indicators: Object.keys(new StockDailyQueryBuilder().mapping),
      operators: ["大於", "小於", "等於", "大於等於", "小於等於"],
    };
  }

  private convertDayToNumber(day: string): number {
    const dayMapping: Record<string, number> = {
      今天: 0,
      昨天: 1,
      前天: 2,
      "3天前": 3,
      "4天前": 4,
      "5天前": 5,
    };
    return dayMapping[day] || 0;
  }

  public generateExpression(prompt: StorePrompt): string[] {
    const { day1, indicator1, operator, day2, indicator2 } = prompt;
    const operatorKey = this.convertOperator(operator);

    const day1Mapping = this.mapping[indicator1];
    const day1Key = `'${this.convertDayToNumber(day1)}${day1Mapping.group}'.${
      day1Mapping.key
    }`;

    if (day2 === "自定義數值") {
      return [day1Key, operatorKey, indicator2];
    }

    const day2Mapping = this.mapping[indicator2];
    const day2Key = `'${this.convertDayToNumber(day2)}${day2Mapping.group}'.${
      day2Mapping.key
    }`;

    return [day1Key, operatorKey, day2Key];
  }

  public generateSqlQuery({
    conditions,
    dates,
    daysRange = 4,
    stockIds,
  }: {
    conditions: string[];
    dates: string[];
    daysRange?: number;
    stockIds?: string[];
  }): string {
    const dayJoins = Array.from({ length: daysRange }, (_, i) => i + 1)
      .map(
        (number) => `
          JOIN daily_deal "${number}_day_ago" ON "0_day_ago".stock_id = "${number}_day_ago".stock_id AND "${number}_day_ago".t = "${dates[number]}"
          JOIN daily_skills "${number}_day_ago_sk" ON "0_day_ago".stock_id = "${number}_day_ago_sk".stock_id AND "${number}_day_ago_sk".t = "${dates[number]}"
        `
      )
      .join("");

    const stockIdCondition = stockIds
      ? ` AND "0_day_ago".stock_id IN ('${stockIds.join("','")}')`
      : "";

    const query = `
      SELECT "0_day_ago".stock_id as stock_id
      FROM daily_deal "0_day_ago"
      JOIN daily_skills "0_day_ago_sk" ON "0_day_ago".stock_id = "0_day_ago_sk".stock_id AND "0_day_ago".t = "0_day_ago_sk".t
      ${dayJoins}
      WHERE "0_day_ago".t = "${
        dates[0]
      }" ${stockIdCondition} AND ${conditions.join(" AND ")}
    `;

    return query.trim();
  }
}

export const stockDailyQueryBuilder = new StockDailyQueryBuilder();
