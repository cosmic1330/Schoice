import type { MarketResourcePhase } from "../../utils/marketResourceState";

/** The Chip surface owns its own as-of/source metadata and TDCC freshness. */
export const shouldShowDetailFreshness = (
  currentId: string,
  phase: MarketResourcePhase,
) => phase === "ready" && currentId !== "chip";
