import {
  Box,
  Container,
  Divider,
  Stack,
  Typography,
  Stepper,
  Step,
  StepButton,
  Card,
  CardContent,
  Chip,
  CircularProgress,
} from "@mui/material";
import { useContext, useMemo, useState, useRef, useEffect } from "react";
import {
  Area,
  Bar,
  ComposedChart,
  Customized,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Scatter,
} from "recharts";
import ichimoku from "./ichimoku";
import { DealsContext } from "../../../context/DealsContext";
import BaseCandlestickRectangle from "../../../components/RechartCustoms/BaseCandlestickRectangle";
import { dateFormat } from "@ch20026103/anysis";
import { Mode } from "@ch20026103/anysis/dist/esm/stockSkills/utils/dateFormat";
import { UrlTaPerdOptions } from "../../../types";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import formatDateTime from "../../../utils/formatDateTime";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

// Define the structure for the chart data, including Ichimoku values
interface IchimokuChartData
  extends Partial<{
    t: number | string;
    o: number | null;
    h: number | null;
    l: number | null;
    c: number | null;
    v: number | null;
  }> {
  tenkan: number | null;
  kijun: number | null;
  senkouA: number | null;
  senkouB: number | null;
  chikou: number | null;
  kumo_bull: [number, number] | null;
  kumo_bear: [number, number] | null;
  buySignal?: number | null;
  exitSignal?: number | null;
  buyReason?: string;
  exitReason?: string;
}

type CheckStatus = "pass" | "fail" | "manual";

interface StepCheck {
  label: string;
  status: CheckStatus;
}

interface IchimokuStep {
  label: string;
  description: string;
  checks: StepCheck[];
}

const BuyArrow = (props: any) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  return (
    <g>
      <path
        d={`M${cx},${cy + 10} L${cx - 6},${cy + 20} L${cx + 6},${cy + 20} Z`}
        fill="#f44336"
        stroke="#c62828"
      />
      {payload.buyReason && (
        <text
          x={cx}
          y={cy + 35}
          textAnchor="middle"
          fill="#f44336"
          fontSize="10px"
        >
          {payload.buyReason}
        </text>
      )}
    </g>
  );
};

const ExitArrow = (props: any) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  return (
    <g>
      <path
        d={`M${cx},${cy - 10} L${cx - 6},${cy - 20} L${cx + 6},${cy - 20} Z`}
        fill="#4caf50"
        stroke="#2e7d32"
      />
      {payload.exitReason && (
        <text
          x={cx}
          y={cy - 30}
          textAnchor="middle"
          fill="#4caf50"
          fontSize="10px"
        >
          {payload.exitReason}
        </text>
      )}
    </g>
  );
};

const getNextTradingTime = (
  currentDate: Date,
  perd: UrlTaPerdOptions
): Date => {
  const nextDate = new Date(currentDate);

  if (perd === UrlTaPerdOptions.Hour) {
    const h = nextDate.getHours();
    const m = nextDate.getMinutes();

    // Sequence: 10:00 -> 11:00 -> 12:00 -> 13:00 -> 13:30 -> Next Day 10:00
    if (h < 10) {
      nextDate.setHours(10, 0, 0, 0);
    } else if (h === 10) {
      nextDate.setHours(11, 0, 0, 0);
    } else if (h === 11) {
      nextDate.setHours(12, 0, 0, 0);
    } else if (h === 12) {
      nextDate.setHours(13, 0, 0, 0);
    } else if (h === 13 && m < 30) {
      nextDate.setHours(13, 30, 0, 0);
    } else {
      // 13:30 or later -> Next Day 10:00
      nextDate.setDate(nextDate.getDate() + 1);
      nextDate.setHours(10, 0, 0, 0);
    }

    // Skip Weekends
    const day = nextDate.getDay();
    if (day === 6) {
      // Saturday -> Monday
      nextDate.setDate(nextDate.getDate() + 2);
    } else if (day === 0) {
      // Sunday -> Monday
      nextDate.setDate(nextDate.getDate() + 1);
    }
  } else if (perd === UrlTaPerdOptions.Day) {
    nextDate.setDate(nextDate.getDate() + 1);
    const day = nextDate.getDay();
    if (day === 6) {
      nextDate.setDate(nextDate.getDate() + 2);
    } else if (day === 0) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
  } else if (perd === UrlTaPerdOptions.Week) {
    nextDate.setDate(nextDate.getDate() + 7);
    const day = nextDate.getDay();
    if (day !== 5) {
      // Align to Friday (5)
      const daysToAdd = (5 - day + 7) % 7;
      nextDate.setDate(nextDate.getDate() + daysToAdd);
    }
  }

  return nextDate;
};

const parseTradeTime = (t: number, perd: UrlTaPerdOptions): Date => {
  const s = t.toString();
  if (perd === UrlTaPerdOptions.Hour && s.length >= 10) {
    // YYYYMMDDHHmm
    const year = parseInt(s.substring(0, 4));
    const month = parseInt(s.substring(4, 6)) - 1;
    const day = parseInt(s.substring(6, 8));
    const hour = parseInt(s.substring(8, 10));
    const min = parseInt(s.substring(10, 12));
    return new Date(year, month, day, hour, min);
  } else {
    // YYYYMMDD
    const year = parseInt(s.substring(0, 4));
    const month = parseInt(s.substring(4, 6)) - 1;
    const day = parseInt(s.substring(6, 8));
    return new Date(year, month, day);
  }
};

export default function Ichimoku({ perd }: { perd: UrlTaPerdOptions }) {
  const deals = useContext(DealsContext);
  const [activeStep, setActiveStep] = useState(0);

  // Zoom & Pan Control
  const [visibleCount, setVisibleCount] = useState(180);
  const [rightOffset, setRightOffset] = useState(0);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const startOffset = useRef(0);

  // Handle Zoom & Pan
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const delta = Math.sign(e.deltaY);
      const step = 5;

      setVisibleCount((prev) => {
        const next = prev + delta * step;
        const minBars = 52; // Minimum for Ichimoku
        const maxBars = deals.length > 0 ? deals.length + 26 : 1000;

        if (next < minBars) return minBars;
        if (next > maxBars) return maxBars;
        return next;
      });
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastX.current = e.clientX;
      startOffset.current = rightOffset;
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();

      const deltaX = e.clientX - lastX.current;
      const sensitivity = visibleCount / (container.clientWidth || 500);
      const barDelta = Math.round(deltaX * sensitivity * 1.5);

      if (barDelta === 0) return;

      setRightOffset((prev) => {
        let next = prev + barDelta;
        if (next < 0) next = 0;
        const maxOffset = Math.max(0, deals.length + 26 - visibleCount);
        if (next > maxOffset) next = maxOffset;
        return next;
      });

      lastX.current = e.clientX;
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [deals.length, visibleCount, rightOffset]);

  const chartData = useMemo((): IchimokuChartData[] => {
    if (!deals || deals.length < 52) return []; // Need enough data for Ichimoku

    // 1. Calculate raw Ichimoku values for each day
    const baseData = ichimoku.calculate(deals);

    // Helper: isNum
    const isNum = (n: number | null | undefined): n is number =>
      typeof n === "number";

    // 2. Create the final chart data with shifted values for existing data points
    let finalData: Omit<IchimokuChartData, "kumo_bull" | "kumo_bear">[] =
      baseData.map((d, i) => {
        const sourceForFutureSpans = i >= 26 ? baseData[i - 26] : null;
        const sourceForPastChikou =
          i + 26 < baseData.length ? baseData[i + 26] : null;

        return {
          ...d,
          senkouA: sourceForFutureSpans ? sourceForFutureSpans.senkouA : null,
          senkouB: sourceForFutureSpans ? sourceForFutureSpans.senkouB : null,
          chikou: sourceForPastChikou ? sourceForPastChikou.c : null,
        };
      });

    // --- Signal Logic Iteration ---
    // We need to iterate again to calculate scores for historical points to generate signals.
    // Note: Future Spans logic (Cloud) relies on shifting, so we must be careful with indices.

    // We'll calculate signals only for the valid range where we have full Ichimoku data
    // (roughly from index 26/52 onwards depending on strictness).
    let lastSignalState: "buy" | "neutral" | "sell" = "neutral";

    finalData = finalData.map((current, i) => {
      if (i < 52) return current; // Not enough data for full calc

      const prev = finalData[i - 1];

      // --- Calculate Score for this point 'i' ---
      // 1. Trend
      const price = current.c;
      const cloudTop =
        isNum(current.senkouA) && isNum(current.senkouB)
          ? Math.max(current.senkouA, current.senkouB)
          : null;
      const prevCloudTop =
        isNum(prev.senkouA) && isNum(prev.senkouB)
          ? Math.max(prev.senkouA, prev.senkouB)
          : null;

      const trendPriceAboveCloud =
        isNum(price) && isNum(cloudTop) && price > cloudTop;
      const trendGreenCloud =
        isNum(current.senkouA) &&
        isNum(current.senkouB) &&
        current.senkouA > current.senkouB;
      const trendRisingCloud =
        isNum(cloudTop) && isNum(prevCloudTop) && cloudTop >= prevCloudTop;

      // 2. Signal
      const signalTkCross =
        isNum(current.tenkan) &&
        isNum(current.kijun) &&
        current.tenkan > current.kijun;
      const signalCrossAboveCloud =
        signalTkCross &&
        isNum(cloudTop) &&
        isNum(current.tenkan) &&
        Math.min(current.tenkan!, current.kijun!) > cloudTop!;
      const signalKijunRising =
        isNum(current.kijun) &&
        isNum(prev.kijun) &&
        current.kijun! >= prev.kijun!;

      // 3. Chikou (Compare current C to C 26 periods ago)
      const pastPriceIndex = i - 26;
      const pastPrice =
        pastPriceIndex >= 0 ? finalData[pastPriceIndex].c : null;
      const chikouAbovePrice =
        isNum(current.c) && isNum(pastPrice) && current.c > pastPrice;

      // 4. Future (Check projected cloud at i + 26)
      // Note: The 'current' data point structure ALREADY contains shifted senkou spans.
      // BUT, for "Future Green Cloud", we need to look at the cloud 26 days *ahead* of the current price candle.
      // In our data structure, 'senkouA' at index 'i' corresponds to the cloud *at* price candle 'i'.
      // So we need to look at senkouA/B at index 'i + 26' (if it exists in our *calculated* baseData before slicing? No, baseData is raw).
      // Let's approximate: the 'future' cloud spans are actually in baseData at index i.
      // Because senkouA calculation is: (tenkan + kijun) / 2 shifted forward 26.
      // So baseData[i].senkouA is the value plotted at T+26.
      // In our finalData mapping, finalData[i].senkouA comes from baseData[i-26].
      // So to check "Future Cloud" (at T+26), we look at baseData[i].senkouA.

      const futureSource = baseData[i]; // This IS the future cloud data relative to price at i
      const futureCloudGreen =
        isNum(futureSource.senkouA) &&
        isNum(futureSource.senkouB) &&
        futureSource.senkouA > futureSource.senkouB;

      // Future Rising: compare baseData[i] cloud top to baseData[i-1] cloud top
      const prevFutureSource = baseData[i - 1];
      const futureTop =
        isNum(futureSource.senkouA) && isNum(futureSource.senkouB)
          ? Math.max(futureSource.senkouA, futureSource.senkouB)
          : null;
      const prevFutureTop =
        isNum(prevFutureSource.senkouA) && isNum(prevFutureSource.senkouB)
          ? Math.max(prevFutureSource.senkouA, prevFutureSource.senkouB)
          : null;
      const futureCloudRising =
        isNum(futureTop) && isNum(prevFutureTop) && futureTop >= prevFutureTop;

      // 5. Volume (simplified for historical check - just compare to prev)
      // Using a proper 20MA for every point is expensive inside this loop, let's simplify to: Vol > Prev Vol or Vol > 0
      const volumeCheck =
        isNum(current.v) && isNum(prev.v) && current.v > prev.v;

      // Sum Score
      let score = 0;
      if (trendPriceAboveCloud) score += 10;
      if (trendGreenCloud) score += 10;
      if (trendRisingCloud) score += 10;
      if (signalTkCross) score += 10;
      if (signalCrossAboveCloud) score += 10;
      if (signalKijunRising) score += 10;
      if (chikouAbovePrice) score += 10;
      if (futureCloudGreen) score += 10;
      if (futureCloudRising) score += 10;
      if (volumeCheck) score += 10;

      let buySignal: number | null = null;
      let exitSignal: number | null = null;
      let buyReason: string | undefined;
      let exitReason: string | undefined;

      // State Machine Logic
      if (lastSignalState === "buy") {
        // We are currently holding a position. Look for EXIT signals only.
        // EXIT Logic: Price Closes Below Cloud (Hard Stop / Trend Reversal)
        if (isNum(price) && isNum(cloudTop) && price < cloudTop) {
          exitSignal = (current.h || 0) * 1.02; // Place above high
          exitReason = "跌破雲帶";
          lastSignalState = "neutral"; // Reset state
        }
      } else {
        // We are not holding. Look for BUY signals only.
        // BUY Logic: Score >= 80 (Strong Buy) AND Price must be above Cloud (Basic Trend Req)
        if (score >= 80 && trendPriceAboveCloud) {
          buySignal = (current.l || 0) * 0.98; // Place below low
          buyReason = "高分買進";
          lastSignalState = "buy";
        }
      }

      return {
        ...current,
        buySignal,
        exitSignal,
        buyReason,
        exitReason,
      };
    });

    // 3. Add future data points for the cloud to extend beyond the last price
    const lastDataPoint = baseData[baseData.length - 1];
    if (lastDataPoint) {
      let currentDate = parseTradeTime(lastDataPoint.t as number, perd);

      for (let i = 1; i <= 26; i++) {
        currentDate = getNextTradingTime(currentDate, perd);

        const sourceIndex = baseData.length - 27 + i;
        const sourceForFutureSpans =
          sourceIndex >= 0 && sourceIndex < baseData.length
            ? baseData[sourceIndex]
            : null;

        finalData.push({
          t:
            perd === UrlTaPerdOptions.Hour
              ? formatDateTime(currentDate.getTime())
              : dateFormat(currentDate.getTime(), Mode.TimeStampToNumber),
          o: null,
          h: null,
          l: null,
          c: null,
          v: null,
          tenkan: null,
          kijun: null,
          chikou: null,
          senkouA: sourceForFutureSpans ? sourceForFutureSpans.senkouA : null,
          senkouB: sourceForFutureSpans ? sourceForFutureSpans.senkouB : null,
        });
      }
    }

    // 4. Process data for conditional cloud coloring
    return finalData
      .map((d) => {
        const { senkouA, senkouB } = d;
        let kumo_bull: [number, number] | null = null;
        let kumo_bear: [number, number] | null = null;

        if (senkouA !== null && senkouB !== null) {
          if (senkouA > senkouB) {
            kumo_bull = [senkouB, senkouA];
            kumo_bear = [senkouA, senkouA]; // Zero-height area
          } else {
            kumo_bear = [senkouA, senkouB];
            kumo_bull = [senkouB, senkouB]; // Zero-height area
          }
        }
        return { ...d, kumo_bull, kumo_bear };
      })
      .slice(
        -(visibleCount + rightOffset),
        rightOffset === 0 ? undefined : -rightOffset
      );
  }, [deals, perd, visibleCount, rightOffset]);

  const { steps, score, recommendation } = useMemo(() => {
    if (chartData.length === 0)
      return { steps: [], score: 0, recommendation: "" };

    // Find the index of the last *real* candle (current time)
    // The data includes 26 future points, so we look back from end
    const firstNullIndex = chartData.findIndex((d) => d.c === null);
    const lastRealIndex =
      firstNullIndex === -1 ? chartData.length - 1 : firstNullIndex - 1;

    // Safety check if lastRealIndex is valid
    if (lastRealIndex < 0 || lastRealIndex >= chartData.length) {
      return { steps: [], score: 0, recommendation: "Error" };
    }

    const current = chartData[lastRealIndex];
    const prev = lastRealIndex > 0 ? chartData[lastRealIndex - 1] : current;

    // Helper for safe number check
    const isNum = (n: number | null | undefined): n is number =>
      typeof n === "number";

    // --- A. Trend Checks ---
    const price = current.c;
    const cloudTop =
      isNum(current.senkouA) && isNum(current.senkouB)
        ? Math.max(current.senkouA, current.senkouB)
        : null;
    const prevCloudTop =
      isNum(prev.senkouA) && isNum(prev.senkouB)
        ? Math.max(prev.senkouA, prev.senkouB)
        : null;

    const trendPriceAboveCloud: CheckStatus =
      isNum(price) && isNum(cloudTop) && price > cloudTop ? "pass" : "fail";

    const trendGreenCloud: CheckStatus =
      isNum(current.senkouA) &&
      isNum(current.senkouB) &&
      current.senkouA > current.senkouB
        ? "pass"
        : "fail";

    const trendRisingCloud: CheckStatus =
      isNum(cloudTop) && isNum(prevCloudTop) && cloudTop >= prevCloudTop
        ? "pass"
        : "fail";

    // --- B. Signal Checks ---
    const signalTkCross: CheckStatus =
      isNum(current.tenkan) &&
      isNum(current.kijun) &&
      current.tenkan > current.kijun
        ? "pass"
        : "fail";

    const signalCrossAboveCloud: CheckStatus =
      signalTkCross === "pass" &&
      isNum(current.tenkan) &&
      isNum(current.kijun) &&
      isNum(cloudTop) &&
      Math.min(current.tenkan, current.kijun) > cloudTop
        ? "pass"
        : "fail";

    const signalKijunRising: CheckStatus =
      isNum(current.kijun) && isNum(prev.kijun) && current.kijun >= prev.kijun
        ? "pass"
        : "fail";

    // --- C. Confirmation Checks (Chikou) ---
    // Chikou is plotted 26 bars behind.
    // The value of chikou at (lastRealIndex) is effectively current.c
    // We compare current.c to the price at (lastRealIndex - 26)
    const pastPriceIndex = lastRealIndex - 26;
    const pastPrice = pastPriceIndex >= 0 ? chartData[pastPriceIndex].c : null;

    const chikouAbovePrice: CheckStatus =
      isNum(current.c) && isNum(pastPrice) && current.c > pastPrice
        ? "pass"
        : "fail";

    // --- D. Future Checks ---
    // Look at the furthest future point
    const futureIndex = chartData.length - 1;
    const future = chartData[futureIndex];
    const prevFuture = chartData[futureIndex - 1];

    const futureCloudGreen: CheckStatus =
      isNum(future.senkouA) &&
      isNum(future.senkouB) &&
      future.senkouA > future.senkouB
        ? "pass"
        : "fail";

    const futureTop =
      isNum(future.senkouA) && isNum(future.senkouB)
        ? Math.max(future.senkouA, future.senkouB)
        : null;
    const prevFutureTop =
      isNum(prevFuture.senkouA) && isNum(prevFuture.senkouB)
        ? Math.max(prevFuture.senkouA, prevFuture.senkouB)
        : null;

    const futureCloudRising: CheckStatus =
      isNum(futureTop) && isNum(prevFutureTop) && futureTop >= prevFutureTop
        ? "pass"
        : "fail";

    // --- E. Overall / Volume ---
    // Simple MA(20) of volume
    const volMaPeriod = 20;
    let volSum = 0;
    let count = 0;
    for (let i = 0; i < volMaPeriod; i++) {
      const idx = lastRealIndex - i;
      if (idx >= 0 && isNum(chartData[idx].v)) {
        volSum += chartData[idx].v!;
        count++;
      }
    }
    const volMa = count > 0 ? volSum / count : 0;

    const volumeCheck: CheckStatus =
      isNum(current.v) && current.v > volMa ? "pass" : "fail";

    // Price Levels for Reference
    const kijunPrice = isNum(current.kijun) ? current.kijun.toFixed(2) : "N/A";
    const cloudBottom =
      isNum(current.senkouA) && isNum(current.senkouB)
        ? Math.min(current.senkouA, current.senkouB).toFixed(2)
        : "N/A";

    // Scoring
    let totalScore = 0;
    const autoChecks = [
      trendPriceAboveCloud,
      trendGreenCloud,
      trendRisingCloud,
      signalTkCross,
      signalCrossAboveCloud,
      signalKijunRising,
      chikouAbovePrice,
      futureCloudGreen,
      futureCloudRising,
      volumeCheck,
    ];

    // 10 checks, 10 points each -> 100 max
    autoChecks.forEach((status) => {
      if (status === "pass") totalScore += 10;
    });

    let rec = "Reject";
    if (totalScore >= 80) rec = "Buy (Strong)";
    else if (totalScore >= 60) rec = "Watch";
    else rec = "Reject";

    const resultSteps: IchimokuStep[] = [
      {
        label: "A. 趨勢確認",
        description: "K 線 vs 雲區 (Trend Filter)",
        checks: [
          {
            label: "價格站在雲上 (Trend > Cloud)",
            status: trendPriceAboveCloud,
          },
          { label: "雲為綠色 (Bullish Kumo)", status: trendGreenCloud },
          { label: "雲呈現上升角度 (Upward Slope)", status: trendRisingCloud },
        ],
      },
      {
        label: "B. 進場訊號",
        description: "TK Cross (短中期動能)",
        checks: [
          { label: "Tenkan > Kijun (黃金交叉)", status: signalTkCross },
          {
            label: "交叉點位於雲上 (Strong Signal)",
            status: signalCrossAboveCloud,
          },
          { label: "Kijun-sen 保持向上或持平", status: signalKijunRising },
        ],
      },
      {
        label: "C. 動能確認",
        description: "Chikou Span (延遲線)",
        checks: [
          { label: "滯後線 > 26 天前價格", status: chikouAbovePrice },
          { label: "26 根 K 棒內無明顯阻力", status: "manual" },
        ],
      },
      {
        label: "D. 未來結構",
        description: "Future Kumo (前瞻)",
        checks: [
          { label: "未來雲為綠色", status: futureCloudGreen },
          { label: "未來雲角度向上", status: futureCloudRising },
        ],
      },
      {
        label: "E. 綜合評估",
        description: `得分: ${totalScore} - ${rec}`,
        checks: [
          { label: "當前量 > 20MA量", status: volumeCheck },
          { label: `參考停損 (Kijun): ${kijunPrice}`, status: "manual" },
          { label: `雲帶下緣 (Cloud): ${cloudBottom}`, status: "manual" },
          { label: "大盤與週線趨勢一致", status: "manual" },
        ],
      },
    ];

    return { steps: resultSteps, score: totalScore, recommendation: rec };
  }, [chartData]);

  const handleStep = (step: number) => () => {
    setActiveStep(step);
  };

  const getStatusIcon = (status: CheckStatus) => {
    switch (status) {
      case "pass":
        return <CheckCircleIcon fontSize="small" color="success" />;
      case "fail":
        return <CancelIcon fontSize="small" color="error" />;
      case "manual":
      default:
        return <HelpOutlineIcon fontSize="small" color="disabled" />;
    }
  };

  // Visibility logic
  const showKumo = activeStep >= 0;
  const showTK = activeStep >= 1;
  const showChikou = activeStep >= 2;
  const showVolume = activeStep >= 4;

  if (chartData.length === 0) {
    return (
      <Box
        height="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container
      component="main"
      maxWidth={false}
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        pt: 1,
        px: 2,
        pb: 1,
      }}
    >
      <Stack spacing={2} direction="row" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h6" component="div" color="white">
          Ichimoku
        </Typography>

        <Chip
          label={`${score}分 - ${recommendation}`}
          color={score >= 80 ? "success" : score >= 60 ? "warning" : "error"}
          variant="outlined"
          size="small"
        />

        <Divider orientation="vertical" flexItem />
        <Box sx={{ flexGrow: 1 }}>
          <Stepper nonLinear activeStep={activeStep}>
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepButton color="inherit" onClick={handleStep(index)}>
                  {step.label}
                </StepButton>
              </Step>
            ))}
          </Stepper>
        </Box>
      </Stack>

      {/* Checklist Card */}
      <Card variant="outlined" sx={{ mb: 1, bgcolor: "background.default" }}>
        <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems="center"
          >
            <Box sx={{ minWidth: 200, flexShrink: 0 }}>
              <Typography variant="subtitle1" color="primary" fontWeight="bold">
                {steps[activeStep]?.description}
              </Typography>
            </Box>
            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: "none", md: "block" } }}
            />
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              {steps[activeStep]?.checks.map((check, idx) => (
                <Chip
                  key={idx}
                  icon={getStatusIcon(check.status)}
                  label={check.label}
                  variant="outlined"
                  color={
                    check.status === "pass"
                      ? "success"
                      : check.status === "fail"
                      ? "error"
                      : "default"
                  }
                  size="small"
                />
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Box ref={chartContainerRef} sx={{ flexGrow: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="t" />
            <YAxis domain={["auto", "auto"]} />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, (dataMax: number) => dataMax * 4]}
              hide={!showVolume}
            />

            <Tooltip
              offset={50}
              contentStyle={{
                backgroundColor: "#222",
                border: "none",
                borderRadius: 4,
              }}
              itemStyle={{ fontSize: 12 }}
              labelStyle={{ color: "#aaa", marginBottom: 5 }}
            />

            {/* Candles - Always first for BaseCandlestickRectangle stability */}
            <Line
              dataKey="h"
              stroke="#fff"
              opacity={0}
              dot={false}
              activeDot={false}
              legendType="none"
            />
            <Line
              dataKey="c"
              stroke="#fff"
              opacity={0}
              dot={false}
              activeDot={false}
              legendType="none"
            />
            <Line
              dataKey="l"
              stroke="#fff"
              opacity={0}
              dot={false}
              activeDot={false}
              legendType="none"
            />
            <Line
              dataKey="o"
              stroke="#fff"
              opacity={0}
              dot={false}
              activeDot={false}
              legendType="none"
            />
            <Customized component={BaseCandlestickRectangle} />

            {/* Volume - Rendered after candles */}
            {showVolume && (
              <Bar
                dataKey="v"
                yAxisId="right"
                fill="#90caf9"
                opacity={0.3}
                name="Volume"
                barSize={10}
              />
            )}

            {/* Signals */}
            {activeStep >= 4 && (
              <>
                <Scatter
                  dataKey="buySignal"
                  shape={<BuyArrow />}
                  legendType="none"
                />
                <Scatter
                  dataKey="exitSignal"
                  shape={<ExitArrow />}
                  legendType="none"
                />
              </>
            )}

            {/* Cloud */}
            {showKumo && (
              <>
                <Area
                  type="monotone"
                  dataKey="kumo_bull"
                  fill="rgba(244, 67, 54, 0.2)"
                  stroke="none"
                  name="Bullish Cloud"
                />
                <Area
                  type="monotone"
                  dataKey="kumo_bear"
                  fill="rgba(76, 175, 80, 0.2)"
                  stroke="none"
                  name="Bearish Cloud"
                />
                <Line
                  type="monotone"
                  dataKey="senkouA"
                  stroke="rgba(244, 67, 54, 0.6)"
                  strokeWidth={2}
                  dot={false}
                  name="Senkou A"
                />
                <Line
                  type="monotone"
                  dataKey="senkouB"
                  stroke="rgba(76, 175, 80, 0.6)"
                  strokeWidth={2}
                  dot={false}
                  name="Senkou B"
                />
              </>
            )}

            {/* TK Lines */}
            {showTK && (
              <>
                <Line
                  type="monotone"
                  dataKey="tenkan"
                  stroke="#29b6f6"
                  strokeWidth={1}
                  dot={false}
                  name="Tenkan-sen (轉換)"
                />
                <Line
                  type="monotone"
                  dataKey="kijun"
                  stroke="#efaa50"
                  strokeWidth={2}
                  dot={false}
                  name="Kijun-sen (基準)"
                />
              </>
            )}

            {/* Chikou */}
            {showChikou && (
              <Line
                type="monotone"
                dataKey="chikou"
                stroke="#bdbdbd"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="Chikou Span (滯後)"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Container>
  );
}
