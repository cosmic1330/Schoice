export type MarketResourcePhase = "idle" | "loading" | "ready" | "empty" | "error";
export type MarketFreshness = "unknown" | "fresh" | "stale";
export type MarketSession = "unknown" | "open" | "closed";

export interface MarketResourceState {
  phase: MarketResourcePhase;
  freshness: MarketFreshness;
  isRefreshing: boolean;
  marketSession: MarketSession;
  error?: Error;
  updatedAt?: number;
}

export interface MarketResourceInput {
  enabled: boolean;
  hasData: boolean;
  resolved: boolean;
  isLoading?: boolean;
  isValidating?: boolean;
  error?: Error;
  updatedAt?: number;
  marketSession?: MarketSession;
  staleAfterMs?: number;
  now?: number;
}

/** Pure state derivation; market holidays are intentionally not represented here. */
export const deriveMarketResourceState = (input: MarketResourceInput): MarketResourceState => {
  const marketSession = input.marketSession ?? "unknown";
  const now = input.now ?? Date.now();
  const ageStale = marketSession === "open" && input.updatedAt !== undefined &&
    input.staleAfterMs !== undefined && now - input.updatedAt >= input.staleAfterMs;
  const freshness: MarketFreshness = input.hasData
    ? (input.error ? "stale" : input.updatedAt === undefined ? "unknown" : ageStale ? "stale" : "fresh")
    : "unknown";

  if (!input.enabled) return { phase: "idle", freshness: "unknown", isRefreshing: false, marketSession };
  if (input.hasData) return { phase: "ready", freshness, isRefreshing: Boolean(input.isValidating), marketSession, error: input.error, updatedAt: input.updatedAt };
  if (input.error) return { phase: "error", freshness, isRefreshing: Boolean(input.isValidating), marketSession, error: input.error, updatedAt: input.updatedAt };
  if (input.isLoading || input.isValidating || !input.resolved) return { phase: "loading", freshness, isRefreshing: false, marketSession, updatedAt: input.updatedAt };
  return { phase: "empty", freshness, isRefreshing: false, marketSession, updatedAt: input.updatedAt };
};
