import Database from "@tauri-apps/plugin-sql";
import { supabase } from "../tools/supabase";
import { FundamentalPrompts } from "../types";
import { FUNDAMENTAL_INDICATORS } from "../domain/strategy/fundamentalCatalog";

export class StockFundamentalQueryBuilder {
  private db: Database | null = null;

  protected mapping: Record<string, { key: string; table: string }> =
    FUNDAMENTAL_INDICATORS;

  protected operatorMapping: Record<string, string> = {
    小於: "<",
    大於: ">",
    等於: "=",
    大於等於: ">=",
    小於等於: "<=",
  };

  public setDatabase(db: Database) {
    this.db = db;
  }

  async getStocksByConditions({
    conditions,
    stockIds,
  }: {
    conditions: FundamentalPrompts;
    stockIds?: string[];
  }) {
    let stockIdsFromTables: Record<string, string[]> = {};

    // 分組條件按表格
    const groupedConditions = conditions.reduce((acc, condition) => {
      const config = this.mapping[condition.indicator];
      if (!config) return acc;
      const table = config.table;
      if (!acc[table]) acc[table] = [];
      acc[table].push(condition);
      return acc;
    }, {} as Record<string, FundamentalPrompts>);

    const MARKET_SIZE_THRESHOLD = 1500; // 台灣上市櫃股票約 1700+，若本地低於此數值視為不齊全

    for (const [table, tableConditions] of Object.entries(groupedConditions)) {
      let filteredData: any[] = [];
      let localData: any[] = [];
      let cloudData: any[] = [];

      // 1. 嘗試從本地 SQLite 獲取資料
      if (this.db) {
        try {
          const result: any[] = await this.db.select(`SELECT * FROM ${table}`);
          if (result && result.length > 0) {
            localData = result;
          }
        } catch (e) {
          console.warn(`[QueryBuilder] 本地表格 ${table} 查詢失敗:`, e);
        }
      }

      // 2. 判斷是否需要補充雲端資料
      // 如果本地沒資料，或者資料量明顯不足以覆蓋全市場，則從雲端獲取
      if (localData.length < MARKET_SIZE_THRESHOLD) {
        try {
          const { data, error } = await supabase.from(table).select("*");
          if (!error && data) {
            cloudData = data;
          } else if (error) {
            console.error(`[QueryBuilder] 雲端表格 ${table} 查詢失敗:`, error);
          }
        } catch (e) {
          console.error(`[QueryBuilder] 雲端獲取失敗:`, e);
        }
      }

      // 3. 資料合併策略：以本地為主，雲端為輔 (補充本地缺失的股票)
      if (cloudData.length > 0) {
        const localStockIds = new Set(localData.map(d => d.stock_id));
        const missingFromLocal = cloudData.filter(cd => !localStockIds.has(cd.stock_id));
        filteredData = [...localData, ...missingFromLocal];
      } else {
        filteredData = localData;
      }

      // 最終安全檢查：如果兩邊都沒資料，回傳空
      if (filteredData.length === 0) {
        stockIdsFromTables[table] = [];
        continue;
      }

      // 4. 執行條件過濾
      for (const condition of tableConditions) {
        const indicator = this.mapping[condition.indicator].key;
        const operator = this.operatorMapping[condition.operator];
        const value = condition.value;

        if (!operator) {
          throw new Error(`不支援的運算子: ${condition.operator}`);
        }

        // value 是數字
        if (!isNaN(Number(value))) {
          filteredData = filteredData.filter((row) => {
            const rowVal = row[indicator];
            if (rowVal == null) return false;
            switch (operator) {
              case "=":
                return rowVal === parseFloat(value);
              case ">":
                return rowVal > parseFloat(value);
              case ">=":
                return rowVal >= parseFloat(value);
              case "<":
                return rowVal < parseFloat(value);
              case "<=":
                return rowVal <= parseFloat(value);
              default:
                return false;
            }
          });
        } else if (this.mapping[value] && this.mapping[value].table === table) {
          // value 是 mapping 的 key，且屬於相同的 table
          const valueKey = this.mapping[value].key;
          filteredData = filteredData.filter((row) => {
            const rowVal = row[indicator];
            const compareVal = row[valueKey];
            if (rowVal == null || compareVal == null) return false;
            switch (operator) {
              case "=":
                return rowVal === compareVal;
              case ">":
                return rowVal > compareVal;
              case ">=":
                return rowVal >= compareVal;
              case "<":
                return rowVal < compareVal;
              case "<=":
                return rowVal <= compareVal;
              default:
                return false;
            }
          });
        }
      }

      // stockIds 篩選
      if (stockIds && stockIds.length > 0) {
        filteredData = filteredData.filter((row) =>
          stockIds.includes(row.stock_id)
        );
      }
      stockIdsFromTables[table] = filteredData.map((r) => r.stock_id);
    }
    // 取交集：滿足所有表格條件的股票
    const allStockIds = Object.values(stockIdsFromTables);
    if (allStockIds.length > 1) {
      return allStockIds.reduce((a, b) => a.filter((id) => b.includes(id)));
    }

    // 如果只有一個表格有條件，返回該表格的結果
    return allStockIds[0] || [];
  }

  public getOptions() {
    const indicators = Object.keys(this.mapping);
    const valuesByIndicator = indicators.reduce((acc, indicator) => {
      const table = this.mapping[indicator].table;
      acc[indicator] = indicators.filter(
        (key) => this.mapping[key].table === table
      );
      return acc;
    }, {} as Record<string, string[]>);

    return {
      indicators,
      operators: Object.keys(this.operatorMapping),
      valuesByIndicator,
    };
  }
}

export const stockFundamentalQueryBuilder = new StockFundamentalQueryBuilder();
