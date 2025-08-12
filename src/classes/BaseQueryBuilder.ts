import { QueryBuilderMappingItem, StorePrompt } from "../types";

export abstract class BaseQueryBuilder {
  protected abstract mapping: Record<string, QueryBuilderMappingItem>;
  
  public getOptions(): Record<string, readonly string[]> {
    return {
      indicators: Object.keys(this.mapping),
      operators: ["大於", "小於", "等於", "大於等於", "小於等於"],
      ...this.getSpecificOptions(),
    }
  }

  protected getSpecificOptions(): Record<string, readonly string[]> {
    return {};
  }

  protected convertOperator(operator: string): string {
    const operatorMapping: Record<string, string> = {
      "小於": "<",
      "大於": ">",
      "等於": "=",
      "大於等於": ">=",
      "小於等於": "<=",
    };
    return operatorMapping[operator] || "=";
  }

  public abstract generateExpression(prompt: StorePrompt): string[];

  public abstract generateSqlQuery(args: any): string;
}
