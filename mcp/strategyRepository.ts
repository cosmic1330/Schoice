import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import type { PromptValue } from "../src/types";
import { loadMcpConfig, type McpConfig } from "./config";

export type StrategyTypeFilter = "bull" | "bear" | "all";

export interface StrategyRecord {
  strategyId: string;
  name: string;
  type: "bull" | "bear";
  conditions?: PromptValue;
  alarmEnabled: boolean;
  updatedAt: string;
  index: number | null;
}

interface StrategyRow {
  prompt_id: string | number;
  prompt_type: string | null;
  prompt_name: string | null;
  conditions: string | PromptValue | null;
  updated_at: string;
  alarm: boolean | null;
  index: number | null;
}

export interface ListStrategiesOptions {
  type: StrategyTypeFilter;
  includeConditions: boolean;
  search?: string;
  limit: number;
}

export interface CreateStrategyOptions {
  name: string;
  type: "bull" | "bear";
  conditions: PromptValue;
  alarmEnabled: boolean;
}

function createAuthenticatedClient(config: McpConfig): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${config.supabaseAccessToken}`,
      },
    },
  });
}

function parseConditions(value: StrategyRow["conditions"]): PromptValue {
  if (typeof value === "string") return JSON.parse(value) as PromptValue;
  if (value && typeof value === "object") return value;
  return { daily: [], weekly: [], hourly: [] };
}

export class StrategyRepository {
  private readonly config: McpConfig;
  private readonly client: SupabaseClient;

  constructor(config: McpConfig = loadMcpConfig()) {
    this.config = config;
    this.client = createAuthenticatedClient(config);
  }

  private async authenticatedUserId(): Promise<string> {
    const { data, error } = await this.client.auth.getUser(
      this.config.supabaseAccessToken,
    );
    if (error || !data.user) {
      throw new Error(`Supabase authentication failed: ${error?.message ?? "no user"}`);
    }
    return data.user.id;
  }

  async list(options: ListStrategiesOptions): Promise<StrategyRecord[]> {
    const userId = await this.authenticatedUserId();
    let query = this.client
      .from("user_prompts")
      .select(
        "prompt_id,prompt_type,prompt_name,conditions,updated_at,alarm,index",
      )
      .eq("user_id", userId)
      .eq("trash", false)
      .order("updated_at", { ascending: false })
      .limit(options.limit);

    if (options.type !== "all") query = query.eq("prompt_type", options.type);
    if (options.search) {
      const escaped = options.search.replaceAll("%", "\\%").replaceAll("_", "\\_");
      query = query.ilike("prompt_name", `%${escaped}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Unable to list strategies: ${error.message}`);

    return ((data ?? []) as StrategyRow[])
      .filter(
        (row): row is StrategyRow & { prompt_type: "bull" | "bear" } =>
          row.prompt_type === "bull" || row.prompt_type === "bear",
      )
      .map((row) => ({
        strategyId: String(row.prompt_id),
        name: row.prompt_name?.trim() || "未命名策略",
        type: row.prompt_type,
        ...(options.includeConditions
          ? { conditions: parseConditions(row.conditions) }
          : {}),
        alarmEnabled: row.alarm === true,
        updatedAt: row.updated_at,
        index: row.index,
      }));
  }

  async get(strategyId: string): Promise<StrategyRecord | null> {
    const userId = await this.authenticatedUserId();
    const { data, error } = await this.client
      .from("user_prompts")
      .select(
        "prompt_id,prompt_type,prompt_name,conditions,updated_at,alarm,index",
      )
      .eq("user_id", userId)
      .eq("prompt_id", strategyId)
      .eq("trash", false)
      .maybeSingle();

    if (error) throw new Error(`Unable to get strategy: ${error.message}`);
    const row = data as StrategyRow | null;
    if (!row || (row.prompt_type !== "bull" && row.prompt_type !== "bear")) {
      return null;
    }
    return {
      strategyId: String(row.prompt_id),
      name: row.prompt_name?.trim() || "未命名策略",
      type: row.prompt_type,
      conditions: parseConditions(row.conditions),
      alarmEnabled: row.alarm === true,
      updatedAt: row.updated_at,
      index: row.index,
    };
  }

  async create(options: CreateStrategyOptions): Promise<StrategyRecord> {
    const userId = await this.authenticatedUserId();
    const strategyId = nanoid();
    const { data, error } = await this.client
      .from("user_prompts")
      .insert({
        user_id: userId,
        prompt_type: options.type,
        prompt_name: options.name,
        conditions: JSON.stringify(options.conditions),
        prompt_id: strategyId,
        trash: false,
        alarm: options.alarmEnabled,
      })
      .select(
        "prompt_id,prompt_type,prompt_name,conditions,updated_at,alarm,index",
      )
      .single();

    if (error) throw new Error(`Unable to create strategy: ${error.message}`);
    const row = data as StrategyRow | null;
    if (!row || (row.prompt_type !== "bull" && row.prompt_type !== "bear")) {
      throw new Error("Unable to create strategy: Supabase returned no strategy.");
    }
    return {
      strategyId: String(row.prompt_id),
      name: row.prompt_name?.trim() || options.name,
      type: row.prompt_type,
      conditions: parseConditions(row.conditions),
      alarmEnabled: row.alarm === true,
      updatedAt: row.updated_at,
      index: row.index,
    };
  }
}
