import { QueryBuilderMappingItem, StorePrompt } from "../types";

export interface QueryBuilderOptions {
  indicators: string[];
  operators: string[];
  timeOptions: readonly string[];
  otherIndicators?: string[];
}

export abstract class BaseQueryBuilder {
  protected abstract mapping: Record<string, QueryBuilderMappingItem>;

  public getOptions(): QueryBuilderOptions {
    return {
      indicators: Object.keys(this.mapping),
      operators: ["大於", "小於", "等於", "大於等於", "小於等於"],
      timeOptions: this.getTimeOptions(),
      otherIndicators: this.getOtherIndicators(),
    };
  }

  protected abstract getTimeOptions(): readonly string[];

  protected getOtherIndicators(): string[] {
    return [];
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

  public getMapping(): Record<string, QueryBuilderMappingItem> {
    return { ...this.mapping };
  }

  public abstract generateExpression(prompt: StorePrompt): string[];

  public abstract generateSqlQuery(args: any): string;
}
