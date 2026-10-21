import assert from "node:assert/strict";
import { test } from "node:test";
import { getStrategyCapabilities } from "./capabilities";
import { validateFundamentalConditions } from "./fundamentalValidation";
import { validateStrategy } from "./validation";

test("capabilities expose all strategy sections", () => {
  const capabilities = getStrategyCapabilities();
  assert.deepEqual(
    capabilities.map((item) => item.timeframe),
    ["daily", "weekly", "hourly", "fundamental"],
  );
});

test("validates and normalizes an inline strategy", () => {
  const result = validateStrategy({
    name: "  RSI 超賣  ",
    conditions: {
      daily: [
        {
          day1: "今天",
          indicator1: "rsi5",
          operator: "小於",
          day2: "自定義數值",
          indicator2: "030.0",
        },
      ],
      weekly: [],
      hourly: [],
    },
  });

  assert.equal(result.valid, true);
  assert.equal(result.normalized?.name, "RSI 超賣");
  assert.equal(result.normalized?.conditions.daily[0].indicator2, "30");
});

test("rejects custom values on the left and unknown indicators", () => {
  const result = validateStrategy({
    name: "invalid",
    conditions: {
      daily: [
        {
          day1: "自定義數值",
          indicator1: "made_up",
          operator: "小於",
          day2: "自定義數值",
          indicator2: "not-a-number",
        },
      ],
      weekly: [],
      hourly: [],
    },
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((issue) => issue.code === "unsupported_time"));
  assert.ok(result.errors.some((issue) => issue.code === "unsupported_indicator"));
  assert.ok(result.errors.some((issue) => issue.code === "invalid_number"));
});

test("validates fundamental constants and rejects cross-table comparisons", () => {
  const valid = validateFundamentalConditions([
    { indicator: "本益比", operator: "小於", value: 30 },
  ]);
  assert.equal(valid.valid, true);
  assert.equal(valid.normalized?.[0].value, "30");

  const invalid = validateFundamentalConditions([
    { indicator: "本益比", operator: "小於", value: "EPS近一季" },
  ]);
  assert.equal(invalid.valid, false);
  assert.ok(
    invalid.errors.some((issue) => issue.code === "cross_table_comparison"),
  );
});
