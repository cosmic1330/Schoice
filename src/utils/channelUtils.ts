const SLOPE_THRESHOLD = 0.0001;

export interface ChannelPoint {
  index: number;
  value: number;
}

export interface ChannelResult {
  slope: number;
  upperIntercept: number;
  lowerIntercept: number;
  type: "ascending" | "descending" | "horizontal";
}

/**
 * Finds local maxima and minima in a series of price data.
 */
export function findLocalExtrema(
  data: (number | null)[],
  window: number = 3,
  type: "high" | "low",
): ChannelPoint[] {
  const extrema: ChannelPoint[] = [];

  for (let i = 1; i < data.length - 1; i++) {
    const current = data[i];
    if (current === null || current === undefined) continue;

    let isExtremum = true;
    const actualWindow = Math.min(window, i, data.length - 1 - i);

    for (let j = i - actualWindow; j <= i + actualWindow; j++) {
      if (i === j) continue;
      const compare = data[j];
      if (compare === null || compare === undefined) continue;

      if (type === "high" ? compare > current : compare < current) {
        isExtremum = false;
        break;
      }
    }

    if (isExtremum) {
      extrema.push({ index: i, value: current });
    }
  }

  return extrema;
}

/**
 * Simple Linear Regression (Ordinary Least Squares).
 * Uses all points in the provided range.
 */
function linearRegression(
  x: number[],
  y: number[],
): { slope: number; intercept: number } | null {
  const n = x.length;
  if (n < 2) return null;

  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumXX += x[i] * x[i];
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * Calculates a robust Linear Regression Channel (LRC).
 * Uses Standard Deviation to define boundaries, which is more stable
 * and better for identifying future support and resistance.
 */
export function calculateChannel(
  highs: (number | null)[],
  lows: (number | null)[],
  multiplier: number = 2.0, // Default to 2.0 SD (Pearson Channel)
): ChannelResult | null {
  // 1. Preparation: Filter valid points
  const validData: { i: number; h: number; l: number; m: number }[] = [];
  for (let i = 0; i < highs.length; i++) {
    const h = highs[i];
    const l = lows[i];
    if (h != null && l != null) {
      validData.push({ i, h, l, m: (h + l) / 2 });
    }
  }

  if (validData.length < 2) return null;

  // 2. Linear Regression on Mid-points
  const x = validData.map((d) => d.i);
  const y = validData.map((d) => d.m);
  const reg = linearRegression(x, y);
  if (!reg) return null;

  const { slope, intercept } = reg;

  // 3. Determine Boundaries using Standard Deviation of Residuals
  // Residual = Distance between price mid-point and the trendline
  const residuals = validData.map((d) => {
    const trendValue = slope * d.i + intercept;
    return d.m - trendValue;
  });

  // Calculate Mean (should be near 0 for OLS)
  const meanResidual =
    residuals.reduce((acc, val) => acc + val, 0) / residuals.length;

  // Calculate Standard Deviation of Residuals
  const variance =
    residuals.reduce((acc, val) => acc + Math.pow(val - meanResidual, 2), 0) /
    residuals.length;
  const stdDev = Math.sqrt(variance);

  // Apply multiplier for boundaries
  const upperIntercept = intercept + stdDev * multiplier;
  const lowerIntercept = intercept - stdDev * multiplier;

  // 4. Classification
  let type: "ascending" | "descending" | "horizontal" = "horizontal";
  const avgPrice = (upperIntercept + lowerIntercept) / 2;
  const normalizedSlope = avgPrice !== 0 ? slope / avgPrice : 0;

  if (normalizedSlope > SLOPE_THRESHOLD) type = "ascending";
  else if (normalizedSlope < -SLOPE_THRESHOLD) type = "descending";

  return { slope, upperIntercept, lowerIntercept, type };
}
