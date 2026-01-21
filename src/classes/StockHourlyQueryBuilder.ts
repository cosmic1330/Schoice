import { QueryBuilderMappingItem, StorePrompt } from "../types";
import { BaseQueryBuilder } from "./BaseQueryBuilder";

export class StockHourlyQueryBuilder extends BaseQueryBuilder {
  protected getTimeOptions(): readonly string[] {
    return [
      "現在",
      "1小時前",
      "2小時前",
      "3小時前",
      "4小時前",
      "5小時前",
      "自定義數值",
    ];
  }
  protected mapping: Record<string, QueryBuilderMappingItem> = {
    收盤價: { key: "c", group: "_hour_ago" },
    開盤價: { key: "o", group: "_hour_ago" },
    成交量: { key: "v", group: "_hour_ago" },
    最低價: { key: "l", group: "_hour_ago" },
    最高價: { key: "h", group: "_hour_ago" },
    ma5: { key: "ma5", group: "_hour_ago_sk" },
    ma5扣抵: { key: "ma5_ded", group: "_hour_ago_sk" },
    ma10: { key: "ma10", group: "_hour_ago_sk" },
    ma10扣抵: { key: "ma10_ded", group: "_hour_ago_sk" },
    ma20: { key: "ma20", group: "_hour_ago_sk" },
    ma20扣抵: { key: "ma20_ded", group: "_hour_ago_sk" },
    ma60: { key: "ma60", group: "_hour_ago_sk" },
    ma60扣抵: { key: "ma60_ded", group: "_hour_ago_sk" },
    ma120: { key: "ma120", group: "_hour_ago_sk" },
    ma120扣抵: { key: "ma120_ded", group: "_hour_ago_sk" },
    ema5: { key: "ema5", group: "_hour_ago_sk" },
    ema10: { key: "ema10", group: "_hour_ago_sk" },
    ema20: { key: "ema20", group: "_hour_ago_sk" },
    ema60: { key: "ema60", group: "_hour_ago_sk" },
    ema120: { key: "ema120", group: "_hour_ago_sk" },
    macd: { key: "macd", group: "_hour_ago_sk" },
    dif: { key: "dif", group: "_hour_ago_sk" },
    osc: { key: "osc", group: "_hour_ago_sk" },
    k: { key: "k", group: "_hour_ago_sk" },
    d: { key: "d", group: "_hour_ago_sk" },
    j: { key: "j", group: "_hour_ago_sk" },
    rsi5: { key: "rsi5", group: "_hour_ago_sk" },
    rsi10: { key: "rsi10", group: "_hour_ago_sk" },
    布林上軌: { key: "bollUb", group: "_hour_ago_sk" },
    布林中軌: { key: "bollMa", group: "_hour_ago_sk" },
    布林下軌: { key: "bollLb", group: "_hour_ago_sk" },
    obv: { key: "obv", group: "_hour_ago_sk" },
    obv_ma5: { key: "obv_ma5", group: "_hour_ago_sk" },
    obv_ma10: { key: "obv_ma10", group: "_hour_ago_sk" },
    obv_ma20: { key: "obv_ma20", group: "_hour_ago_sk" },
    obv_ma60: { key: "obv_ma60", group: "_hour_ago_sk" },
    obv_ema5: { key: "obv_ema5", group: "_hour_ago_sk" },
    obv_ema10: { key: "obv_ema10", group: "_hour_ago_sk" },
    obv_ema20: { key: "obv_ema20", group: "_hour_ago_sk" },
    obv_ema60: { key: "obv_ema60", group: "_hour_ago_sk" },
    mfi: { key: "mfi", group: "_hour_ago_sk" },
    轉換線: { key: "tenkan", group: "_hour_ago_sk" },
    基準線: { key: "kijun", group: "_hour_ago_sk" },
    先行帶A: { key: "senkouA", group: "_hour_ago_sk" },
    先行帶B: { key: "senkouB", group: "_hour_ago_sk" },
    延遲線: { key: "chikou", group: "_hour_ago_sk" },
    正向動能: { key: "di_plus", group: "_hour_ago_sk" },
    負向動能: { key: "di_minus", group: "_hour_ago_sk" },
    ADX: { key: "adx", group: "_hour_ago_sk" },
    CMF: { key: "cmf", group: "_hour_ago_sk" },
    CMF_EMA5: { key: "cmf_ema5", group: "_hour_ago_sk" },
  };

  protected getSpecificOptions(): Record<string, readonly string[]> {
    return {
      hours: [
        "現在",
        "1小時前",
        "2小時前",
        "3小時前",
        "4小時前",
        "5小時前",
        "自定義數值",
      ],
    };
  }

  private converthourToNumber(hour: string): number {
    const hourMapping: Record<string, number> = {
      現在: 0,
      "1小時前": 1,
      "2小時前": 2,
      "3小時前": 3,
      "4小時前": 4,
      "5小時前": 5,
    };
    return hourMapping[hour] || 0;
  }

  public generateExpression(prompt: StorePrompt): string[] {
    const { day1, indicator1, operator, day2, indicator2 } = prompt;
    const operatorKey = this.convertOperator(operator);

    const day1Mapping = this.mapping[indicator1];
    const day1Key = `"${this.converthourToNumber(day1)}${day1Mapping.group}".${
      day1Mapping.key
    }`;

    if (day2 === "自定義數值") {
      return [day1Key, operatorKey, indicator2];
    }

    const day2Mapping = this.mapping[indicator2];
    const day2Key = `"${this.converthourToNumber(day2)}${day2Mapping.group}".${
      day2Mapping.key
    }`;

    return [day1Key, operatorKey, day2Key];
  }

  public generateSqlQuery({
    conditions,
    dates,
    stockIds,
  }: {
    conditions: string[];
    dates: string[];
    stockIds?: string[];
  }): string {
    const conditionsStr = conditions.join(" ");

    // 1. 提取所有需要的 alias
    const aliasRegex = /"(\d+)_hour_ago(_sk)?"/g;
    const requiredAliases = new Set<string>();
    let match;
    while ((match = aliasRegex.exec(conditionsStr)) !== null) {
      if (match[1] !== "0") {
        requiredAliases.add(match[0].replace(/"/g, ""));
      }
    }

    // 2. 確定哪些小時需要 JOIN
    const requiredHours = new Set<string>();
    requiredAliases.forEach((alias) => {
      const match = alias.match(/^(\d+)_hour_ago/);
      if (match) {
        requiredHours.add(match[1]);
      }
    });

    // 3. 生成 JOIN
    const hourJoins = Array.from(requiredHours)
      .sort()
      .map((number) => {
        const needDeal =
          conditionsStr.includes(`"${number}_hour_ago"`) ||
          conditionsStr.includes(`'${number}_hour_ago'`);
        const needSkills =
          conditionsStr.includes(`"${number}_hour_ago_sk"`) ||
          conditionsStr.includes(`'${number}_hour_ago_sk'`);

        let joins = "";
        const idx = parseInt(number);
        if (!dates[idx]) return "";

        if (needDeal) {
          joins += ` JOIN hourly_deal "${number}_hour_ago" ON "0_hour_ago".stock_id = "${number}_hour_ago".stock_id AND "${number}_hour_ago".ts = '${dates[idx]}'`;
        }
        if (needSkills) {
          joins += ` LEFT JOIN hourly_skills "${number}_hour_ago_sk" ON "0_hour_ago".stock_id = "${number}_hour_ago_sk".stock_id AND "${number}_hour_ago_sk".ts = '${dates[idx]}'`;
        }
        return joins;
      })
      .join("\n");

    const stockIdCondition = stockIds
      ? ` AND "0_hour_ago".stock_id IN ('${stockIds.join("','")}')`
      : "";

    const query = `
      SELECT "0_hour_ago".stock_id as stock_id
      FROM hourly_deal "0_hour_ago"
      LEFT JOIN hourly_skills "0_hour_ago_sk" ON "0_hour_ago".stock_id = "0_hour_ago_sk".stock_id AND "0_hour_ago".ts = "0_hour_ago_sk".ts
      ${hourJoins}
      WHERE "0_hour_ago".ts = '${
        dates[0]
      }' ${stockIdCondition} AND ${conditions.join(" AND ")}
    `;

    return query.trim();
  }
}

export const stockHourlyQueryBuilder = new StockHourlyQueryBuilder();
