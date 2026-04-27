import { Ichimoku } from "@ch20026103/anysis";

type Deal = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};
export interface IchimokuData extends Deal {
  tenkan: number | null;
  kijun: number | null;
  senkouA: number | null;
  senkouB: number | null;
  chikou: number | null;
}

/**
 * Calculates Ichimoku Cloud values for a given set of deals.
 * Note: This function does not perform the time-shifting for Senkou Spans and Chikou Span.
 * The calling component is responsible for shifting the data for correct visualization.
 * - Senkou Span A & B should be plotted 26 periods ahead.
 * - Chikou Span should be plotted 26 periods behind.
 * @param deals - Array of stock deals.
 * @returns An array of deals with Ichimoku data.
 */
function calculate(deals: Deal[]): IchimokuData[] {
  if (!deals || deals.length === 0) return [];

  const ichimoku = new Ichimoku();
  const results: IchimokuData[] = [];

  // Initialize with the first deal
  let currentData = ichimoku.init(deals[0]);
  results.push({
    ...deals[0],
    tenkan: currentData.ichimoku.tenkan,
    kijun: currentData.ichimoku.kijun,
    senkouA: currentData.ichimoku.senkouA,
    senkouB: currentData.ichimoku.senkouB,
    chikou: currentData.ichimoku.chikou,
  });

  // Process remaining deals
  for (let i = 1; i < deals.length; i++) {
    currentData = ichimoku.next(deals[i], currentData);
    results.push({
      ...deals[i],
      tenkan: currentData.ichimoku.tenkan,
      kijun: currentData.ichimoku.kijun,
      senkouA: currentData.ichimoku.senkouA,
      senkouB: currentData.ichimoku.senkouB,
      chikou: currentData.ichimoku.chikou,
    });
  }

  return results;
}

export default { calculate };
