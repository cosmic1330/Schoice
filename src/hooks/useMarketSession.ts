import { useEffect, useState } from "react";
import { FutureIds } from "../types";
import { isNasdaqMarketOpen, isTaiwanMarketOpen, isWtxMarketOpen } from "../utils/marketUtils";
import { MarketSession } from "../utils/marketResourceState";

export const marketSessionForSymbol = (symbol: string, date = new Date()): MarketSession => {
  if (symbol === FutureIds.WTX) return isWtxMarketOpen(date) ? "open" : "closed";
  if (symbol === FutureIds.NASDAQ || symbol === FutureIds.NASDAQ_FUTURE) return isNasdaqMarketOpen(date) ? "open" : "closed";
  return isTaiwanMarketOpen(date) ? "open" : "closed";
};
export const useDocumentVisibility = () => {
  const [visible, setVisible] = useState(() => typeof document === "undefined" || document.visibilityState === "visible");
  useEffect(() => { const update = () => setVisible(document.visibilityState === "visible"); document.addEventListener("visibilitychange", update); return () => document.removeEventListener("visibilitychange", update); }, []);
  return visible;
};
export const useMarketSession = (symbol: string) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30_000); return () => window.clearInterval(timer); }, []);
  return marketSessionForSymbol(symbol, new Date(now));
};
export const useFreshnessNow = (updatedAt: number | undefined, staleAfterMs: number, session: MarketSession) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { if (!updatedAt || session !== "open") return; const delay = Math.max(0, updatedAt + staleAfterMs - Date.now()); const timer = window.setTimeout(() => setNow(Date.now()), delay); return () => window.clearTimeout(timer); }, [updatedAt, staleAfterMs, session]);
  return now;
};
