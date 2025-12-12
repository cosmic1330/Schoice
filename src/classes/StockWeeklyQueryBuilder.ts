import { QueryBuilderMappingItem, StorePrompt } from "../types";
import { BaseQueryBuilder } from "./BaseQueryBuilder";

export class StockWeeklyQueryBuilder extends BaseQueryBuilder {
  protected mapping: Record<string, QueryBuilderMappingItem> = {
    收盤價: { key: "c", group: "_week_ago" },
    開盤價: { key: "o", group: "_week_ago" },
    成交量: { key: "v", group: "_week_ago" },
    最低價: { key: "l", group: "_week_ago" },
    最高價: { key: "h", group: "_week_ago" },
    ma5: { key: "ma5", group: "_week_ago_sk" },
    ma5扣抵: { key: "ma5_ded", group: "_week_ago_sk" },
    ma10: { key: "ma10", group: "_week_ago_sk" },
    ma10扣抵: { key: "ma10_ded", group: "_week_ago_sk" },
    ma20: { key: "ma20", group: "_week_ago_sk" },
    ma20扣抵: { key: "ma20_ded", group: "_week_ago_sk" },
    ma60: { key: "ma60", group: "_week_ago_sk" },
    ma60扣抵: { key: "ma60_ded", group: "_week_ago_sk" },
    ma120: { key: "ma120", group: "_week_ago_sk" },
    ma120扣抵: { key: "ma120_ded", group: "_week_ago_sk" },
    ema5: { key: "ema5", group: "_week_ago_sk" },
    ema10: { key: "ema10", group: "_week_ago_sk" },
    ema20: { key: "ema20", group: "_week_ago_sk" },
    ema60: { key: "ema60", group: "_week_ago_sk" },
    ema120: { key: "ema120", group: "_week_ago_sk" },
    macd: { key: "macd", group: "_week_ago_sk" },
    dif: { key: "dif", group: "_week_ago_sk" },
    osc: { key: "osc", group: "_week_ago_sk" },
    k: { key: "k", group: "_week_ago_sk" },
    d: { key: "d", group: "_week_ago_sk" },
    j: { key: "j", group: "_week_ago_sk" },
    rsi5: { key: "rsi5", group: "_week_ago_sk" },
    rsi10: { key: "rsi10", group: "_week_ago_sk" },
    布林上軌: { key: "bollUb", group: "_week_ago_sk" },
    布林中軌: { key: "bollMa", group: "_week_ago_sk" },
    布林下軌: { key: "bollLb", group: "_week_ago_sk" },
    obv: { key: "obv", group: "_week_ago_sk" },
    obv_ma5: { key: "obv_ma5", group: "_week_ago_sk" },
    obv_ma10: { key: "obv_ma10", group: "_week_ago_sk" },
    obv_ma20: { key: "obv_ma20", group: "_week_ago_sk" },
    obv_ma60: { key: "obv_ma60", group: "_week_ago_sk" },
    obv_ema5: { key: "obv_ema5", group: "_week_ago_sk" },
    obv_ema10: { key: "obv_ema10", group: "_week_ago_sk" },
    obv_ema20: { key: "obv_ema20", group: "_week_ago_sk" },
    obv_ema60: { key: "obv_ema60", group: "_week_ago_sk" },
    mfi: { key: "mfi", group: "_week_ago_sk" },
  };

  protected getTimeOptions(): readonly string[] {
    return [
      "本週",
      "上週",
      "上上週",
      "3週前",
      "4週前",
      "5週前",
      "自定義數值",
    ];
  }

  private convertDayToNumber(day: string): number {
    const dayMapping: Record<string, number> = {
      本週: 0,
      上週: 1,
      上上週: 2,
      "3週前": 3,
      "4週前": 4,
      "5週前": 5,
    };
    return dayMapping[day] || 0;
  }

  public generateExpression(prompt: StorePrompt): string[] {
    const { day1, indicator1, operator, day2, indicator2 } = prompt;
    const operatorKey = this.convertOperator(operator);

    const day1Mapping = this.mapping[indicator1];
    const day1Key = `"${this.convertDayToNumber(day1)}${day1Mapping.group}".${day1Mapping.key
      }`;

    if (day2 === "自定義數值") {
      return [day1Key, operatorKey, indicator2];
    }

    const day2Mapping = this.mapping[indicator2];
    const day2Key = `"${this.convertDayToNumber(day2)}${day2Mapping.group}".${day2Mapping.key
      }`;

    return [day1Key, operatorKey, day2Key];
  }

  public generateSqlQuery({
    conditions,
    dates,
  }: {
    conditions: string[];
    dates: string[];
  }): string {
    const conditionsStr = conditions.join(" ");

    // 1. 提取所有需要的 alias
    const aliasRegex = /"(\d+)_week_ago(_sk)?"/g;
    const requiredAliases = new Set<string>();
    let match;
    while ((match = aliasRegex.exec(conditionsStr)) !== null) {
      if (match[1] !== "0") {
        requiredAliases.add(match[0].replace(/"/g, ""));
      }
    }

    // 2. 確定哪些週需要 JOIN
    const requiredWeeks = new Set<string>();
    requiredAliases.forEach((alias) => {
      const match = alias.match(/^(\d+)_week_ago/);
      if (match) {
        requiredWeeks.add(match[1]);
      }
    });

    // 3. 生成 JOIN
    const weekJoins = Array.from(requiredWeeks)
      .sort()
      .map((number) => {
        const needDeal =
          conditionsStr.includes(`"${number}_week_ago"`) ||
          conditionsStr.includes(`'${number}_week_ago'`);
        const needSkills =
          conditionsStr.includes(`"${number}_week_ago_sk"`) ||
          conditionsStr.includes(`'${number}_week_ago_sk'`);

        let joins = "";
        const idx = parseInt(number);
        if (!dates[idx]) return "";

        if (needDeal) {
          joins += ` JOIN weekly_deal "${number}_week_ago" ON "0_week_ago".stock_id = "${number}_week_ago".stock_id AND "${number}_week_ago".t = '${dates[idx]}'`;
        }
        if (needSkills) {
          joins += ` JOIN weekly_skills "${number}_week_ago_sk" ON "0_week_ago".stock_id = "${number}_week_ago_sk".stock_id AND "${number}_week_ago_sk".t = '${dates[idx]}'`;
        }
        return joins;
      })
      .join("\n");

    const query = `
      SELECT "0_week_ago".stock_id as stock_id
      FROM weekly_deal "0_week_ago"
      JOIN weekly_skills "0_week_ago_sk" ON "0_week_ago".stock_id = "0_week_ago_sk".stock_id AND "0_week_ago".t = "0_week_ago_sk".t
      ${weekJoins}
      WHERE "0_week_ago".t = '${dates[0]}' AND ${conditions.join(" AND ")}
    `;

    return query.trim();
  }
}

export const stockWeeklyQueryBuilder = new StockWeeklyQueryBuilder();
