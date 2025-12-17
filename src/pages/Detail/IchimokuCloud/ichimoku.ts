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
  const processedData = deals.map((deal, i) => {
    // Tenkan-sen (Conversion Line): (9-period high + 9-period low) / 2
    const tenkanSlice = deals.slice(Math.max(0, i - 8), i + 1);
    const tenkanHigh = Math.max(...tenkanSlice.map((d) => d.h));
    const tenkanLow = Math.min(...tenkanSlice.map((d) => d.l));
    const tenkan = i >= 8 ? (tenkanHigh + tenkanLow) / 2 : null;

    // Kijun-sen (Base Line): (26-period high + 26-period low) / 2
    const kijunSlice = deals.slice(Math.max(0, i - 25), i + 1);
    const kijunHigh = Math.max(...kijunSlice.map((d) => d.h));
    const kijunLow = Math.min(...kijunSlice.map((d) => d.l));
    const kijun = i >= 25 ? (kijunHigh + kijunLow) / 2 : null;

    // Senkou Span B (Leading Span B): (52-period high + 52-period low) / 2
    const senkouBSlice = deals.slice(Math.max(0, i - 51), i + 1);
    const senkouBHigh = Math.max(...senkouBSlice.map((d) => d.h));
    const senkouBLow = Math.min(...senkouBSlice.map((d) => d.l));
    const senkouB = i >= 51 ? (senkouBHigh + senkouBLow) / 2 : null;

    // Senkou Span A (Leading Span A): (Tenkan-sen + Kijun-sen) / 2
    const senkouA = tenkan && kijun ? (tenkan + kijun) / 2 : null;

    return {
      ...deal,
      tenkan,
      kijun,
      senkouA,
      senkouB,
      // Chikou Span is just the close price, to be shifted by the component.
      chikou: deal.c,
    };
  });

  return processedData;
}

export default { calculate };
