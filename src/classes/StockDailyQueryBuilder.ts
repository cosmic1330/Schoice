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
    obv_ma5: { key: "obv_ma5", group: "_day_ago_sk" },
    obv_ma10: { key: "obv_ma10", group: "_day_ago_sk" },
    obv_ma20: { key: "obv_ma20", group: "_day_ago_sk" },
    obv_ma60: { key: "obv_ma60", group: "_day_ago_sk" },
    obv_ema5: { key: "obv_ema5", group: "_day_ago_sk" },
    obv_ema10: { key: "obv_ema10", group: "_day_ago_sk" },
    obv_ema20: { key: "obv_ema20", group: "_day_ago_sk" },
    obv_ema60: { key: "obv_ema60", group: "_day_ago_sk" },
    mfi: { key: "mfi", group: "_day_ago_sk" },
    轉換線: { key: "tenkan", group: "_day_ago_sk" },
    基準線: { key: "kijun", group: "_day_ago_sk" },
    先行帶A: { key: "senkouA", group: "_day_ago_sk" },
    先行帶B: { key: "senkouB", group: "_day_ago_sk" },
    延遲線: { key: "chikou", group: "_day_ago_sk" },
    正向動能: { key: "di_plus", group: "_day_ago_sk" },
    負向動能: { key: "di_minus", group: "_day_ago_sk" },
    ADX: { key: "adx", group: "_day_ago_sk" },
  };

  protected othersMapping: Record<string, QueryBuilderMappingItem> = {
    "營收近一月(累計年增率)": {
      key: "revenue_recent_m1_yoy_acc",
      group: "recent_fundamental",
    },
    "營收近二月(累計年增率)": {
      key: "revenue_recent_m2_yoy_acc",
      group: "recent_fundamental",
    },
    "營收近三月(累計年增率)": {
      key: "revenue_recent_m3_yoy_acc",
      group: "recent_fundamental",
    },
    "營收近四月(累計年增率)": {
      key: "revenue_recent_m4_yoy_acc",
      group: "recent_fundamental",
    },
  };

  protected getTimeOptions(): readonly string[] {
    return [
      "今天",
      "昨天",
      "前天",
      "3天前",
      "4天前",
      "5天前",
      "自定義數值",
      // "其他",
    ];
  }

  protected getOtherIndicators(): string[] {
    return Object.keys(this.othersMapping);
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

    let day1Key = "";
    if (day1 === "其他") {
      const day1Mapping = this.othersMapping[indicator1];
      day1Key = `"${day1Mapping.group}".${day1Mapping.key}`;
    } else {
      const day1Mapping = this.mapping[indicator1];
      day1Key = `"${this.convertDayToNumber(day1)}${day1Mapping.group}".${
        day1Mapping.key
      }`;
    }

    let day2Key = "";
    if (day2 === "自定義數值") {
      day2Key = indicator2;
    } else if (day2 === "其他") {
      const day2Mapping = this.othersMapping[indicator2];
      day2Key = `"${day2Mapping.group}".${day2Mapping.key}`;
    } else {
      const day2Mapping = this.mapping[indicator2];
      day2Key = `"${this.convertDayToNumber(day2)}${day2Mapping.group}".${
        day2Mapping.key
      }`;
    }
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

    // 1. 提取所有需要的 alias，例如 "1_day_ago", "2_day_ago_sk" 等
    // Regex: 尋找 "數字_day_ago(_sk)?" 這樣的pattern
    // 注意: 我們現在使用雙引號包覆 alias
    const aliasRegex = /"(\d+)_day_ago(_sk)?"/g;
    const requiredAliases = new Set<string>();
    let match;
    while ((match = aliasRegex.exec(conditionsStr)) !== null) {
      if (match[1] !== "0") {
        // 0_day_ago 是主表，不需要額外 join
        requiredAliases.add(match[0].replace(/"/g, ""));
      }
    }

    // 2. 為了確保同一天若同時用到 deal 和 skills，或者是為了邏輯簡單，我們可以用 Set 來記錄哪幾天需要 join
    const requiredDays = new Set<string>();
    requiredAliases.forEach((alias) => {
      const match = alias.match(/^(\d+)_day_ago/);
      if (match) {
        requiredDays.add(match[1]);
      }
    });

    // 3. 根據需要的天下生成 JOIN
    const dayJoins = Array.from(requiredDays)
      .sort() // 排序讓 SQL 比較好讀
      .map((number) => {
        // 如果 conditions 裡面有明確用到 _day_ago (deal) 或是 _day_ago_sk (skills)
        // 為了保險起見，簡單的做法是: 如果該天有被用到，就兩個都 join (或根據需要優化)
        // 但為了效能最佳化，我們檢查具體是哪張表被用到
        const needDeal =
          conditionsStr.includes(`"${number}_day_ago"`) ||
          conditionsStr.includes(`'${number}_day_ago'`); // 相容可能殘留的單引號
        const needSkills =
          conditionsStr.includes(`"${number}_day_ago_sk"`) ||
          conditionsStr.includes(`'${number}_day_ago_sk'`);

        let joins = "";
        const idx = parseInt(number);
        // 如果 dates 長度不足，防呆
        if (!dates[idx]) return "";

        if (needDeal) {
          joins += ` JOIN daily_deal "${number}_day_ago" ON "0_day_ago".stock_id = "${number}_day_ago".stock_id AND "${number}_day_ago".t = '${dates[idx]}'`;
        }
        if (needSkills) {
          joins += ` LEFT JOIN daily_skills "${number}_day_ago_sk" ON "0_day_ago".stock_id = "${number}_day_ago_sk".stock_id AND "${number}_day_ago_sk".t = '${dates[idx]}'`;
        }
        return joins;
      })
      .join("\n");

    const stockIdCondition = stockIds
      ? ` AND "0_day_ago".stock_id IN ('${stockIds.join("','")}')`
      : "";

    const query = `
      SELECT "0_day_ago".stock_id as stock_id
      FROM daily_deal "0_day_ago"
      LEFT JOIN daily_skills "0_day_ago_sk" ON "0_day_ago".stock_id = "0_day_ago_sk".stock_id AND "0_day_ago".t = "0_day_ago_sk".t
      ${dayJoins}
      WHERE "0_day_ago".t = '${
        dates[0]
      }' ${stockIdCondition} AND ${conditions.join(" AND ")}
    `;

    return query.trim();
  }
}

export const stockDailyQueryBuilder = new StockDailyQueryBuilder();
