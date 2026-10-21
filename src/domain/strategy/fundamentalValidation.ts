import type { FundamentalPrompt, FundamentalPrompts } from "../../types";
import {
  FUNDAMENTAL_INDICATORS,
  STRATEGY_OPERATORS,
} from "./fundamentalCatalog";
import type { StrategyValidationIssue } from "./validation";

export interface FundamentalValidationResult {
  valid: boolean;
  normalized: FundamentalPrompts | null;
  errors: StrategyValidationIssue[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateFundamentalConditions(
  input: unknown,
): FundamentalValidationResult {
  const errors: StrategyValidationIssue[] = [];
  if (!Array.isArray(input)) {
    return {
      valid: false,
      normalized: null,
      errors: [
        {
          path: "fundamental_conditions",
          code: "invalid_type",
          message: "fundamental_conditions 必須是陣列。",
        },
      ],
    };
  }
  if (input.length > 50) {
    errors.push({
      path: "fundamental_conditions",
      code: "too_many_conditions",
      message: "基本面條件最多 50 個。",
    });
  }

  const normalized: FundamentalPrompts = [];
  input.forEach((value, index) => {
    const basePath = `fundamental_conditions.${index}`;
    if (!isRecord(value)) {
      errors.push({
        path: basePath,
        code: "invalid_type",
        message: "基本面條件必須是物件。",
      });
      return;
    }

    const indicator =
      typeof value.indicator === "string" ? value.indicator.trim() : "";
    const operator =
      typeof value.operator === "string" ? value.operator.trim() : "";
    const comparisonValue =
      typeof value.value === "number"
        ? String(value.value)
        : typeof value.value === "string"
          ? value.value.trim()
          : "";

    if (!FUNDAMENTAL_INDICATORS[indicator]) {
      errors.push({
        path: `${basePath}.indicator`,
        code: "unsupported_indicator",
        message: `不支援基本面指標「${indicator}」。`,
      });
    }
    if (!(STRATEGY_OPERATORS as readonly string[]).includes(operator)) {
      errors.push({
        path: `${basePath}.operator`,
        code: "unsupported_operator",
        message: `不支援運算子「${operator}」。`,
      });
    }
    if (!comparisonValue) {
      errors.push({
        path: `${basePath}.value`,
        code: "required",
        message: "value 不可為空。",
      });
    } else if (!Number.isFinite(Number(comparisonValue))) {
      const right = FUNDAMENTAL_INDICATORS[comparisonValue];
      const left = FUNDAMENTAL_INDICATORS[indicator];
      if (!right) {
        errors.push({
          path: `${basePath}.value`,
          code: "unsupported_indicator",
          message: `value 必須是數值或已知指標，收到「${comparisonValue}」。`,
        });
      } else if (left && left.table !== right.table) {
        errors.push({
          path: `${basePath}.value`,
          code: "cross_table_comparison",
          message: "目前只支援比較同一基本面資料表的指標。",
        });
      }
    }

    normalized.push({
      indicator,
      operator,
      value: Number.isFinite(Number(comparisonValue))
        ? String(Number(comparisonValue))
        : comparisonValue,
    } satisfies FundamentalPrompt);
  });

  return {
    valid: errors.length === 0,
    normalized: errors.length === 0 ? normalized : null,
    errors,
  };
}
