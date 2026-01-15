import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Tooltip as MuiTooltip,
  Stack,
  Step,
  StepButton,
  Stepper,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Customized,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import BaseCandlestickRectangle from "../../../components/RechartCustoms/BaseCandlestickRectangle";
import { DealsContext } from "../../../context/DealsContext";
import useIndicatorSettings from "../../../hooks/useIndicatorSettings";
import { calculateIndicators } from "../../../utils/indicatorUtils";
import ChartTooltip from "../Tooltip/ChartTooltip";
import Fundamental from "../Tooltip/Fundamental";

interface BolleanChartData
  extends Partial<{
    t: number | string;
    o: number | null;
    h: number | null;
    l: number | null;
    c: number | null;
    v: number | null;
  }> {
  bollUb: number | null;
  bollMa: number | null;
  bollLb: number | null;
  bandWidth?: number | null;
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

interface BolleanStep {
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

export default function Bollean({
  visibleCount,
  setVisibleCount,
  rightOffset,
  setRightOffset,
}: {
  visibleCount: number;
  setVisibleCount: React.Dispatch<React.SetStateAction<number>>;
  rightOffset: number;
  setRightOffset: React.Dispatch<React.SetStateAction<number>>;
}) {
  const { settings } = useIndicatorSettings();
  const deals = useContext(DealsContext);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const handleSwitchStep = () => {
      setActiveStep((prev) => (prev + 1) % 4); // 4 steps total
    };
    window.addEventListener("detail-switch-step", handleSwitchStep);
    return () =>
      window.removeEventListener("detail-switch-step", handleSwitchStep);
  }, []);
  const { id } = useParams();

  // Zoom & Pan Control
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const startOffset = useRef(0);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const delta = Math.sign(e.deltaY);
      const step = 4;

      setVisibleCount((prev) => {
        const next = prev + delta * step;
        const minBars = 30;
        const maxBars = deals.length > 0 ? deals.length : 1000;

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
        const maxOffset = Math.max(0, deals.length - visibleCount);
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

  const chartData = useMemo((): BolleanChartData[] => {
    if (!deals || deals.length === 0) return [];

    // Initial pass: Calculate Bands using centralized utility
    const baseData = calculateIndicators(deals, settings);

    // Second pass: Calculate Signals & Logic
    let lastSignalState: "buy" | "neutral" = "neutral";

    // Helper to check valid number
    const isNum = (n: any): n is number => typeof n === "number";

    return baseData
      .map((d, i) => {
        if (i < settings.boll) return d; // Skip initial stabilization

        const prev = baseData[i - 1];

        const price = d.c;
        const ub = d.bollUb;
        const lb = d.bollLb;
        const ma = d.bollMa;
        const width = d.bandWidth;

        if (
          !isNum(price) ||
          ub === null ||
          lb === null ||
          ma === null ||
          width === null
        )
          return d;

        // 1. Trend Filter
        const maRising = ma > (prev.bollMa || 0);
        const priceAboveMa = price > ma;

        // 2. Squeeze Breakout Condition
        // BandWidth low (< 0.10 or relative low - using 0.15 as generic placeholder for "tight")
        // Note: Absolute bandwidth depends on asset class. Percentage width is safer.
        // README says < 30% percentile, which requires history.
        // Simplified: width < 0.10 (10%) is often "squeeze" for stocks. Let's use 0.15 for now.
        const isSqueeze = width < 0.15;
        const breakoutUp =
          isSqueeze && price > ub && (d.v || 0) > (prev.v || 0) * 1.3; // Volume spike

        // 3. Reversal (Long)
        // Price touched Lower Band then closed higher (Hammer/Pinbar logic simplified)
        const touchedLb = (d.l || 0) <= lb;
        const closeHigh = price > (d.o || 0);
        const reversalLong = touchedLb && closeHigh && maRising; // Trend following dip buy

        // Scoring for BUY
        let score = 0;
        if (maRising) score += 20;
        if (priceAboveMa) score += 20;
        if (breakoutUp) score += 40; // High weight for breakout
        if (reversalLong) score += 30;

        let buySignal: number | null = null;
        let exitSignal: number | null = null;
        let buyReason: string | undefined;
        let exitReason: string | undefined;

        if (lastSignalState === "buy") {
          // Exit Logic
          // 1. Price falls below MA (Trend break)
          // 2. Price touches UB then fails to make new high (simplified: close < prev close after touching UB) - too noisy?
          // Let's use simple MA break or strict Hard Stop below previous low.
          if (price < ma) {
            exitSignal = (d.h || 0) * 1.02;
            exitReason = "跌破中軌";
            lastSignalState = "neutral";
          }
        } else {
          // Buy Logic
          // Score threshold or specific setup
          if ((breakoutUp || reversalLong) && score >= 50) {
            buySignal = (d.l || 0) * 0.98;
            buyReason = "突破/反轉";
            lastSignalState = "buy";
          }
        }

        return {
          ...d,
          buySignal,
          exitSignal,
          buyReason,
          exitReason,
        };
      })
      .slice(
        -(visibleCount + rightOffset),
        rightOffset === 0 ? undefined : -rightOffset
      );
  }, [deals, visibleCount, rightOffset]);

  // MA Deduction Points for BOLL chart
  const maDeductionPoints = useMemo(() => {
    if (chartData.length === 0) return [];
    const latest = chartData[chartData.length - 1];
    const points: {
      t: number | string;
      price: number;
      label: string;
      color: string;
      period: number;
    }[] = [];

    const maConfigs = [
      { key: "deduction5", color: "#2196f3", period: settings.ma5 },
      { key: "deduction10", color: "#ffeb3b", period: settings.ma10 },
      { key: "deduction20", color: "#ff9800", period: settings.ma20 },
      { key: "deduction60", color: "#f44336", period: settings.ma60 },
      { key: "deduction120", color: "#4caf50", period: settings.ma120 },
    ];

    maConfigs.forEach((config) => {
      const t = (latest as any)[config.key];
      if (t) {
        // Find price in full deals by current timestamp
        // indicatorUtils already calculated these. We need price at time t.
        const fullData = calculateIndicators(deals, settings);
        const target = fullData.find((d) => d.t === t);
        if (target) {
          points.push({
            t,
            price: target.c,
            label: `MA${config.period}扣抵`,
            color: config.color,
            period: config.period,
          });
        }
      }
    });

    return points;
  }, [chartData, deals, settings]);

  const { steps, score, recommendation } = useMemo(() => {
    if (chartData.length === 0)
      return { steps: [], score: 0, recommendation: "" };

    const current = chartData[chartData.length - 1];
    const prev = chartData[chartData.length - 2] || current;

    const isNum = (n: any): n is number => typeof n === "number";

    const price = current.c;
    const ub = current.bollUb;
    const lb = current.bollLb;
    const ma = current.bollMa;
    const width = current.bandWidth;

    // Safety
    if (
      !isNum(price) ||
      !isNum(ub) ||
      !isNum(lb) ||
      !isNum(ma) ||
      !isNum(width)
    ) {
      return { steps: [], score: 0, recommendation: "Data Error" };
    }

    // I. Market Environment
    // 1. Band Width
    const isSqueeze = width < 0.15; // < 15% width as proxy for "Low"
    const isWide = width > 0.3; // > 30% as "High/Volatile"

    // 2. Trend
    const maSlope = ma - (prev.bollMa || ma);
    const maRising = maSlope > 0;
    const pricePosition =
      price > ma ? "Bullish (Above MA)" : "Bearish (Below MA)";

    // II. Entry Conditions
    const volSpike = (current.v || 0) > (prev.v || 0) * 1.3;
    const touchedLb = (current.l || 0) <= lb;
    const reversalCandle = touchedLb && price > (current.o || 0); // Simple check

    // III. Risk
    const stopLoss = price > ma ? ma.toFixed(2) : (price * 0.98).toFixed(2); // Simple rule

    // IV. Score
    let totalScore = 0;
    // Trend (40%)
    if (maRising) totalScore += 20;
    if (price > ma) totalScore += 20;
    // Volatility (20%)
    if (!isWide) totalScore += 20; // Prefer not too volatile unless breaking out
    // Signal (40%)
    if (volSpike) totalScore += 20;
    if (reversalCandle || (price > ub && isSqueeze)) totalScore += 20;

    let rec = "Reject";
    if (totalScore >= 80) rec = "Strong Buy";
    else if (totalScore >= 60) rec = "Watch";
    else rec = "Neutral";

    const bolleanSteps: BolleanStep[] = [
      {
        label: "I. 綜合評估",
        description: `得分: ${totalScore} - ${rec}`,
        checks: [
          { label: "趨勢明確 (MA斜率)", status: maRising ? "pass" : "fail" },
          { label: "成交量配合", status: volSpike ? "pass" : "manual" },
          { label: "無假突破跡象", status: "manual" },
        ],
      },
      {
        label: "II. 市場環境",
        description: "波動度與趨勢 (Macro & Regime)",
        checks: [
          {
            label: `帶寬狀態: ${
              isSqueeze ? "壓縮 (<15%)" : isWide ? "擴張 (>30%)" : "正常"
            }`,
            status: "manual",
          },
          {
            label: `趨勢方向: ${maRising ? "上彎 (偏多)" : "下彎 (偏空)"}`,
            status: maRising ? "pass" : "fail",
          },
          {
            label: `價格位置: ${pricePosition}`,
            status: price > ma ? "pass" : "fail",
          },
        ],
      },
      {
        label: "III. 入場條件",
        description: "多/空策略與突破 (Entry)",
        checks: [
          {
            label: "突破上軌且放量 (Squeeze Breakout)",
            status: price > ub && volSpike ? "pass" : "fail",
          },
          {
            label: "觸及下軌並反轉 (Reversal)",
            status: reversalCandle ? "pass" : "fail",
          },
          {
            label: "中軌向上支撐",
            status: maRising && price > ma ? "pass" : "fail",
          },
        ],
      },
      {
        label: "IV. 風險控管",
        description: "停損與部位 (Risk Control)",
        checks: [
          { label: `建議停損位: ${stopLoss} (中軌)`, status: "manual" },
          {
            label: `帶寬: ${(width * 100).toFixed(1)}% (過寬減倉)`,
            status: isWide ? "fail" : "pass",
          },
          { label: "單筆風險 < 1.5%", status: "manual" },
        ],
      },
    ];

    return { steps: bolleanSteps, score: totalScore, recommendation: rec };
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
        <MuiTooltip title={<Fundamental id={id} />} arrow>
          <Typography variant="h6" component="div" color="white">
            Bolling
          </Typography>
        </MuiTooltip>

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

      <Card variant="outlined" sx={{ mb: 1, bgcolor: "background.default" }}>
        <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            alignItems="center"
          >
            <Typography variant="subtitle2" color="primary" fontWeight="bold">
              {steps[activeStep]?.description}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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

      <Box
        ref={chartContainerRef}
        sx={{ flexGrow: 1, minHeight: 0, width: "100%" }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="t" hide />
            <YAxis domain={["auto", "auto"]} />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, (dataMax: number) => dataMax * 4]}
              width={0}
              tick={false}
              axisLine={false}
            />

            <Tooltip
              content={<ChartTooltip hideKeys={["buySignal", "exitSignal"]} />}
              offset={50}
            />

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

            {(activeStep === 0 || activeStep === 2) && (
              <Bar
                dataKey="v"
                yAxisId="right"
                fill="#90caf9"
                opacity={0.3}
                name="Volume"
                barSize={10}
              />
            )}

            <Line
              dataKey="bollMa"
              stroke="#2196f3"
              strokeWidth={1.5}
              dot={false}
              activeDot={false}
              name={`${settings.boll} MA (Mid)`}
            />
            <Line
              dataKey="bollUb"
              stroke="#ff9800"
              strokeDasharray="3 3"
              dot={false}
              activeDot={false}
              name="Upper Band"
            />
            <Line
              dataKey="bollLb"
              stroke="#ff9800"
              strokeDasharray="3 3"
              dot={false}
              activeDot={false}
              name="Lower Band"
            />

            {/* Signals */}
            {(activeStep === 0 || activeStep === 2) && (
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

            {/* Deduction Markers */}
            {maDeductionPoints.map((p) => (
              <ReferenceLine
                key={`${p.label}-${p.t}`}
                x={p.t}
                stroke={p.color}
                strokeDasharray="3 3"
                opacity={0.4}
                isFront={false}
                label={(props: any) => {
                  const { viewBox } = props;
                  if (!viewBox) return <g />;
                  const { x } = viewBox;
                  return (
                    <g>
                      <rect
                        x={x - 15}
                        y={5}
                        width={30}
                        height={18}
                        fill="#1a1a1a"
                        rx={4}
                        stroke={p.color}
                        strokeWidth={1}
                        opacity={0.8}
                      />
                      <text
                        x={x}
                        y={18}
                        textAnchor="middle"
                        fill={p.color}
                        fontSize={10}
                        fontWeight="bold"
                      >
                        {p.period}
                      </text>
                    </g>
                  );
                }}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Container>
  );
}
