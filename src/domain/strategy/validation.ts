import type { PromptValue, StorePrompt } from "../../types";
import {
  getTechnicalCapability,
  type StrategyTimeframe,
} from "./capabilities";

export interface StrategyDraft {
  name: string;
  conditions: PromptValue;
}

export interface StrategyValidationIssue {
  path: string;
  code: string;
  message: string;
}

export interface StrategyValidationResult {
  valid: boolean;
  normalized: StrategyDraft | null;
  errors: StrategyValidationIssue[];
  warnings: StrategyValidationIssue[];
  conditionCount: number;
}

const TIMEFRAMES: StrategyTimeframe[] = ["daily", "weekly", "hourly"];
const CONDITION_KEYS = ["day1", "indicator1", "operator", "day2", "indicator2"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function validateCondition(
  value: unknown,
  timeframe: StrategyTimeframe,
  index: number,
  errors: StrategyValidationIssue[],
): StorePrompt | null {
  const basePath = `conditions.${timeframe}.${index}`;
  if (!isRecord(value)) {
    errors.push({ path: basePath, code: "invalid_type", message: "條件必須是物件。" });
    return null;
  }

  const fields = Object.fromEntries(
    CONDITION_KEYS.map((key) => [key, nonEmptyString(value[key])]),
  ) as Record<(typeof CONDITION_KEYS)[number], string | null>;

  for (const key of CONDITION_KEYS) {
    if (fields[key] === null) {
      errors.push({
        path: `${basePath}.${key}`,
        code: "required",
        message: `${key} 必須是非空字串。`,
      });
    }
  }
  if (CONDITION_KEYS.some((key) => fields[key] === null)) return null;

  const condition = fields as unknown as StorePrompt;
  const capability = getTechnicalCapability(timeframe);
  const indicatorIds = new Set(capability.indicators.map((indicator) => indicator.id));
  const operators = new Set(capability.operators);
  const leftTimes = new Set(capability.leftTimeOptions);
  const rightTimes = new Set(capability.rightTimeOptions);

  if (!leftTimes.has(condition.day1)) {
    errors.push({ path: `${basePath}.day1`, code: "unsupported_time", message: `timeframe ${timeframe} 不支援時間「${condition.day1}」。` });
  }
  if (!rightTimes.has(condition.day2)) {
    errors.push({ path: `${basePath}.day2`, code: "unsupported_time", message: `timeframe ${timeframe} 不支援時間「${condition.day2}」。` });
  }
  if (!indicatorIds.has(condition.indicator1)) {
    errors.push({ path: `${basePath}.indicator1`, code: "unsupported_indicator", message: `timeframe ${timeframe} 不支援指標「${condition.indicator1}」。` });
  }
  if (!operators.has(condition.operator)) {
    errors.push({ path: `${basePath}.operator`, code: "unsupported_operator", message: `不支援運算子「${condition.operator}」。` });
  }

  if (condition.day2 === "自定義數值") {
    const numericValue = Number(condition.indicator2);
    if (!Number.isFinite(numericValue)) {
      errors.push({ path: `${basePath}.indicator2`, code: "invalid_number", message: "與自定義數值比較時，indicator2 必須是有限數值。" });
    } else {
      condition.indicator2 = String(numericValue);
    }
  } else if (!indicatorIds.has(condition.indicator2)) {
    errors.push({ path: `${basePath}.indicator2`, code: "unsupported_indicator", message: `timeframe ${timeframe} 不支援指標「${condition.indicator2}」。` });
  }

  return condition;
}

export function validateStrategy(input: unknown): StrategyValidationResult {
  const errors: StrategyValidationIssue[] = [];
  const warnings: StrategyValidationIssue[] = [];
  if (!isRecord(input)) {
    return {
      valid: false,
      normalized: null,
      errors: [{ path: "$", code: "invalid_type", message: "策略必須是物件。" }],
      warnings,
      conditionCount: 0,
    };
  }

  const name = nonEmptyString(input.name);
  if (!name) errors.push({ path: "name", code: "required", message: "策略名稱不可為空。" });
  const rawConditions = input.conditions;
  if (!isRecord(rawConditions)) {
    errors.push({ path: "conditions", code: "invalid_type", message: "conditions 必須是物件。" });
  }

  const normalizedConditions: PromptValue = { daily: [], weekly: [], hourly: [] };
  let conditionCount = 0;
  if (isRecord(rawConditions)) {
    for (const timeframe of TIMEFRAMES) {
      const values = rawConditions[timeframe];
      if (!Array.isArray(values)) {
        errors.push({ path: `conditions.${timeframe}`, code: "invalid_type", message: `${timeframe} 必須是陣列。` });
        continue;
      }
      conditionCount += values.length;
      if (values.length > 50) {
        errors.push({ path: `conditions.${timeframe}`, code: "too_many_conditions", message: `單一 timeframe 最多 50 個條件。` });
      }
      for (let index = 0; index < values.length; index += 1) {
        const condition = validateCondition(values[index], timeframe, index, errors);
        if (condition) normalizedConditions[timeframe].push(condition);
      }
    }
  }

  if (conditionCount === 0) {
    errors.push({ path: "conditions", code: "empty_strategy", message: "策略至少需要一個技術條件。" });
  }
  if (conditionCount > 20) {
    warnings.push({ path: "conditions", code: "complex_strategy", message: "條件超過 20 個，篩選時間可能較長。" });
  }

  return {
    valid: errors.length === 0,
    normalized: errors.length === 0 && name ? { name, conditions: normalizedConditions } : null,
    errors,
    warnings,
    conditionCount,
  };
}
