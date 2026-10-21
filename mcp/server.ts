import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { getStrategyCapabilities } from "../src/domain/strategy/capabilities";
import { validateFundamentalConditions } from "../src/domain/strategy/fundamentalValidation";
import { validateStrategy } from "../src/domain/strategy/validation";
import { openSchoiceDatabase, type SchoiceDatabase } from "./localDatabase";
import { ScreeningService } from "./screeningService";
import { StockDetailService } from "./stockDetailService";
import {
  normalizeMarketTypes,
  StockSearchService,
} from "./stockSearchService";
import { StrategyRepository } from "./strategyRepository";

const VERSION = "0.2.0";

export interface MutationApprovalRequest {
  action: "create_strategy";
  strategyName: string;
  strategyType: "bull" | "bear";
  conditionCount: number;
}

export interface SchoiceMcpServerOptions {
  approveMutation?: (request: MutationApprovalRequest) => Promise<boolean>;
}

const technicalConditionSchema = z.object({
  day1: z.string().trim().min(1).describe("Left-side relative time, such as 今天, 本週, or 現在."),
  indicator1: z.string().trim().min(1).describe("Left-side indicator ID returned by get_strategy_capabilities."),
  operator: z.enum(["大於", "小於", "等於", "大於等於", "小於等於"]),
  day2: z.string().trim().min(1).describe("Right-side relative time, or 自定義數值 for a constant."),
  indicator2: z.string().trim().min(1).describe("Right-side indicator ID, or a numeric string when day2 is 自定義數值."),
});

const inlineStrategySchema = z.object({
  name: z.string().trim().min(1).max(200),
  conditions: z.object({
    daily: z.array(technicalConditionSchema).max(50),
    weekly: z.array(technicalConditionSchema).max(50),
    hourly: z.array(technicalConditionSchema).max(50),
  }),
});

const fundamentalConditionSchema = z.object({
  indicator: z.string().trim().min(1).describe("Fundamental indicator ID returned by get_strategy_capabilities."),
  operator: z.enum(["大於", "小於", "等於", "大於等於", "小於等於"]),
  value: z.union([z.number(), z.string().trim().min(1)]).describe("A numeric constant or another fundamental indicator ID from the same source table."),
});

function jsonToolResult(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

function errorToolResult(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }],
    isError: true,
  };
}

function invalidInputToolResult(details: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ error: "VALIDATION_FAILED", details }, null, 2),
      },
    ],
    isError: true,
  };
}

export function createSchoiceMcpServer(
  options: SchoiceMcpServerOptions = {},
): McpServer {
  const server = new McpServer(
    { name: "schoice", version: VERSION },
    {
      instructions:
        "Use these tools to inspect, validate, create, and execute Schoice stock-screening strategies. Local market-data tools are read-only; create_strategy is the only tool that writes user data and requires authenticated Supabase credentials.",
    },
  );

  server.registerTool(
    "get_strategy_capabilities",
    {
      description:
        "List the supported technical or fundamental indicators, operators, units, and timeframe options for Schoice strategies.",
      inputSchema: z.object({
        timeframe: z
          .enum(["all", "daily", "weekly", "hourly", "fundamental"])
          .default("all")
          .describe("Capability section to return."),
      }),
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ timeframe }) =>
      jsonToolResult({ capabilities: getStrategyCapabilities(timeframe) }),
  );

  server.registerTool(
    "list_strategies",
    {
      description:
        "List the authenticated Schoice user's saved bull or bear strategies. Requires Supabase MCP environment variables.",
      inputSchema: z.object({
        type: z.enum(["bull", "bear", "all"]).default("all"),
        include_conditions: z.boolean().default(true),
        search: z.string().trim().min(1).max(100).optional(),
        limit: z.number().int().min(1).max(100).default(50),
      }),
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    async ({ type, include_conditions, search, limit }) => {
      try {
        const strategies = await new StrategyRepository().list({
          type,
          includeConditions: include_conditions,
          search,
          limit,
        });
        return jsonToolResult({ count: strategies.length, strategies });
      } catch (error) {
        return errorToolResult(error);
      }
    },
  );

  server.registerTool(
    "create_strategy",
    {
      description:
        "Validate and create a bull or bear strategy for the authenticated Schoice user. The new strategy is saved to Supabase and becomes available in the desktop app.",
      inputSchema: z.object({
        type: z.enum(["bull", "bear"]),
        strategy: inlineStrategySchema,
        alarm_enabled: z.boolean().default(false),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ type, strategy, alarm_enabled }) => {
      try {
        const validation = validateStrategy(strategy);
        if (!validation.valid || !validation.normalized) {
          return invalidInputToolResult({ strategy: validation });
        }
        if (options.approveMutation) {
          const approved = await options.approveMutation({
            action: "create_strategy",
            strategyName: validation.normalized.name,
            strategyType: type,
            conditionCount: Object.values(validation.normalized.conditions).reduce(
              (total, conditions) => total + conditions.length,
              0,
            ),
          });
          if (!approved) {
            return errorToolResult("Strategy creation was cancelled in the Schoice app.");
          }
        }
        const created = await new StrategyRepository().create({
          name: validation.normalized.name,
          type,
          conditions: validation.normalized.conditions,
          alarmEnabled: alarm_enabled,
        });
        return jsonToolResult({
          created: true,
          strategy: created,
          warnings: validation.warnings,
        });
      } catch (error) {
        return errorToolResult(error);
      }
    },
  );

  server.registerTool(
    "validate_strategy",
    {
      description:
        "Validate and normalize either an inline Schoice strategy or one saved under the authenticated user's strategy ID.",
      inputSchema: z
        .object({
          strategy_id: z.string().trim().min(1).optional(),
          strategy: inlineStrategySchema.optional(),
        })
        .refine(
          (value) => Number(value.strategy_id !== undefined) + Number(value.strategy !== undefined) === 1,
          { message: "Provide exactly one of strategy_id or strategy." },
        ),
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    async ({ strategy_id, strategy }) => {
      try {
        let candidate: unknown = strategy;
        if (strategy_id) {
          const saved = await new StrategyRepository().get(strategy_id);
          if (!saved) {
            return errorToolResult(`Strategy ${strategy_id} was not found.`);
          }
          candidate = { name: saved.name, conditions: saved.conditions };
        }
        return jsonToolResult(validateStrategy(candidate));
      } catch (error) {
        return errorToolResult(error);
      }
    },
  );

  server.registerTool(
    "search_stocks",
    {
      description:
        "Resolve a Taiwan stock code, company name, or industry term against the local Schoice stock catalog.",
      inputSchema: z.object({
        query: z.string().trim().min(1).max(100),
        market_types: z
          .array(
            z.enum([
              "TWSE",
              "OTC",
              "TPEX",
              "TIB",
              "上市",
              "上櫃",
              "上市臺灣創新板",
            ]),
          )
          .max(3)
          .optional(),
        industry_groups: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
        limit: z.number().int().min(1).max(100).default(20),
      }),
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ query, market_types, industry_groups, limit }) => {
      let database: SchoiceDatabase | undefined;
      try {
        database = openSchoiceDatabase();
        const stocks = new StockSearchService(database).search({
          query,
          marketTypes: market_types,
          industryGroups: industry_groups,
          limit,
        });
        return jsonToolResult({ count: stocks.length, stocks, source: "local_sqlite" });
      } catch (error) {
        return errorToolResult(error);
      } finally {
        database?.close();
      }
    },
  );

  server.registerTool(
    "get_stock_detail",
    {
      description:
        "Get a local analysis snapshot for one stock: metadata, latest daily/weekly/hourly candles and key indicators, valuation, EPS/revenue, investor positions, and data coverage.",
      inputSchema: z.object({
        stock_id: z.string().trim().min(1).max(20),
      }),
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ stock_id }) => {
      let database: SchoiceDatabase | undefined;
      try {
        database = openSchoiceDatabase();
        return jsonToolResult({
          ...new StockDetailService(database).detail(stock_id),
          source: "local_sqlite",
        });
      } catch (error) {
        return errorToolResult(error);
      } finally {
        database?.close();
      }
    },
  );

  server.registerTool(
    "get_stock_history",
    {
      description:
        "Get bounded chronological OHLCV and selected technical-indicator history for one stock and timeframe. Use get_strategy_capabilities for supported indicator IDs.",
      inputSchema: z.object({
        stock_id: z.string().trim().min(1).max(20),
        timeframe: z.enum(["daily", "weekly", "hourly"]),
        indicators: z
          .array(z.string().trim().min(1))
          .max(30)
          .optional()
          .describe("Indicator IDs; defaults to key trend and momentum indicators."),
        as_of: z
          .union([
            z.literal("latest"),
            z.string().regex(/^\d{8}(\d{4})?$/),
          ])
          .default("latest"),
        limit: z.number().int().min(1).max(500).default(120),
      }),
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ stock_id, timeframe, indicators, as_of, limit }) => {
      let database: SchoiceDatabase | undefined;
      try {
        database = openSchoiceDatabase();
        return jsonToolResult({
          ...new StockDetailService(database).history({
            stockId: stock_id,
            timeframe,
            indicators,
            asOf: as_of,
            limit,
          }),
          source: "local_sqlite",
        });
      } catch (error) {
        return errorToolResult(error);
      } finally {
        database?.close();
      }
    },
  );

  server.registerTool(
    "screen_stocks",
    {
      description:
        "Run a saved or inline Schoice strategy against local daily, weekly, and hourly indicators, optionally intersecting fundamental conditions. Returns condition-level evidence for every match.",
      inputSchema: z
        .object({
          strategy_id: z.string().trim().min(1).optional(),
          strategy: inlineStrategySchema.optional(),
          fundamental_conditions: z.array(fundamentalConditionSchema).max(50).default([]),
          as_of: z
            .union([z.literal("latest"), z.string().regex(/^\d{8}$/)])
            .default("latest"),
          universe: z
            .object({
              stock_ids: z.array(z.string().trim().min(1).max(20)).max(500).optional(),
              market_types: z
                .array(
                  z.enum([
                    "TWSE",
                    "OTC",
                    "TPEX",
                    "TIB",
                    "上市",
                    "上櫃",
                    "上市臺灣創新板",
                  ]),
                )
                .max(3)
                .optional(),
              industry_groups: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
            })
            .default({}),
          limit: z.number().int().min(1).max(100).default(50),
          offset: z.number().int().min(0).max(10_000).default(0),
        })
        .refine(
          (value) => Number(value.strategy_id !== undefined) + Number(value.strategy !== undefined) === 1,
          { message: "Provide exactly one of strategy_id or strategy." },
        ),
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
    },
    async ({
      strategy_id,
      strategy,
      fundamental_conditions,
      as_of,
      universe,
      limit,
      offset,
    }) => {
      let database: SchoiceDatabase | undefined;
      try {
        let candidate: unknown = strategy;
        if (strategy_id) {
          const saved = await new StrategyRepository().get(strategy_id);
          if (!saved) return errorToolResult(`Strategy ${strategy_id} was not found.`);
          candidate = { name: saved.name, conditions: saved.conditions };
        }
        const strategyValidation = validateStrategy(candidate);
        if (!strategyValidation.valid || !strategyValidation.normalized) {
          return invalidInputToolResult({ strategy: strategyValidation });
        }
        const fundamentalValidation = validateFundamentalConditions(
          fundamental_conditions,
        );
        if (!fundamentalValidation.valid || !fundamentalValidation.normalized) {
          return invalidInputToolResult({ fundamental: fundamentalValidation });
        }

        database = openSchoiceDatabase();
        const result = new ScreeningService(database).screen({
          strategyName: strategyValidation.normalized.name,
          conditions: strategyValidation.normalized.conditions,
          fundamentalConditions: fundamentalValidation.normalized,
          universe: {
            stockIds: universe.stock_ids,
            marketTypes: normalizeMarketTypes(universe.market_types),
            industryGroups: universe.industry_groups,
          },
          asOf: as_of,
          limit,
          offset,
        });
        return jsonToolResult({ ...result, source: "local_sqlite" });
      } catch (error) {
        return errorToolResult(error);
      } finally {
        database?.close();
      }
    },
  );

  return server;
}
