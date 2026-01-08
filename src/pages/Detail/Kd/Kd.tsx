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
  Stack,
  Step,
  StepButton,
  Stepper,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Customized,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import BaseCandlestickRectangle from "../../../components/RechartCustoms/BaseCandlestickRectangle";
import { DealsContext } from "../../../context/DealsContext";
import useIndicatorSettings from "../../../hooks/useIndicatorSettings";
import { DivergenceSignalType } from "../../../types";
import detectKdDivergence from "../../../utils/detectKdDivergence";
import {
  calculateIndicators,
  EnhancedDealData,
} from "../../../utils/indicatorUtils";
import ChartTooltip from "../Tooltip/ChartTooltip";

interface KdChartData extends Partial<EnhancedDealData> {
  // signals and other properties if needed
}

type CheckStatus = "pass" | "fail" | "manual";

interface StepCheck {
  label: string;
  status: CheckStatus;
}

interface KdStep {
  label: string;
  description: string;
  checks: StepCheck[];
}

export default function Kd({
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

  const chartData = useMemo((): KdChartData[] => {
    return calculateIndicators(deals, settings).slice(
      -(visibleCount + rightOffset),
      rightOffset === 0 ? undefined : -rightOffset
    ) as KdChartData[];
  }, [deals, settings, visibleCount, rightOffset]);

  const signals = useMemo(() => {
    // We need to convert chartData back to the format detectKdDivergence expects if possible,
    // or just run it on the source deals slice if needed.
    // detectKdDivergence expects {t, h, l, k, d}.
    // We can map from chartData which has all of these.
    const inputForDivergence = chartData.map((d) => ({
      t: d.t as number,
      h: d.h as number,
      l: d.l as number,
      k: d.k as number,
      d: d.d as number,
    }));
    return detectKdDivergence(inputForDivergence);
  }, [chartData]);

  const { steps, score, recommendation } = useMemo(() => {
    if (chartData.length === 0)
      return { steps: [], score: 0, recommendation: "" };

    const current = chartData[chartData.length - 1];
    const prev = chartData[chartData.length - 2] || current;

    const isNum = (n: any): n is number => typeof n === "number";

    const price = current.c;
    const kVal = current.k;
    const dVal = current.d;
    const bollMa = current.bollMa;
    const vol = current.v;
    const volMa = current.volMa20;
    const prevK = prev.k || 0;
    const prevD = prev.d || 0;

    if (
      !isNum(price) ||
      !isNum(kVal) ||
      !isNum(dVal) ||
      !isNum(bollMa) ||
      !isNum(vol) ||
      !isNum(volMa)
    ) {
      return { steps: [], score: 0, recommendation: "Data Error" };
    }

    // I. Regime
    const volRatio = vol / volMa;
    const isVolStable = volRatio > 0.6;
    const bollMaRising = bollMa > (prev.bollMa || 0);
    const trendStatus = bollMaRising ? "Uptrend" : "Downtrend/Flat";

    // II. Entry
    const isOversold = kVal < 20 && dVal < 20;
    const isOverbought = kVal > 80 && dVal > 80;
    const goldCross = prevK < prevD && kVal > dVal;
    const deathCross = prevK > prevD && kVal < dVal;

    // Check for recent bullish divergence (last 3 candles)
    const recentBullishDiv = signals.some(
      (s) =>
        s.type === DivergenceSignalType.BULLISH_DIVERGENCE && s.t === current.t
    );
    const recentBearishDiv = signals.some(
      (s) =>
        s.type === DivergenceSignalType.BEARISH_DIVERGENCE && s.t === current.t
    );

    // III. Risk
    const stopLoss = (price * 0.97).toFixed(2); // 3% trail

    // Score
    let totalScore = 0;
    // 1. Volume (20)
    if (isVolStable) totalScore += 20;
    // 2. Trend (20)
    if (bollMaRising || price > bollMa) totalScore += 20;
    // 3. KD Position (40)
    if (isOversold && goldCross) totalScore += 40; // Strong buy
    else if (goldCross && price > bollMa) totalScore += 30; // Trend Buy
    else if (recentBullishDiv) totalScore += 30; // Divergence Buy
    else if (kVal > dVal && kVal > prevK) totalScore += 10; // Momentum

    if (isOverbought || deathCross || recentBearishDiv) totalScore -= 20;

    // 4. Price Action (20)
    if (price > (current.o || 0)) totalScore += 20;

    if (totalScore < 0) totalScore = 0;

    let rec = "Reject";
    if (totalScore >= 80) rec = "Strong Buy";
    else if (totalScore >= 60) rec = "Watch";
    else if (deathCross || isOverbought) rec = "Sell/Exit";
    else rec = "Neutral";

    const kdSteps: KdStep[] = [
      {
        label: "I. 綜合評估",
        description: `得分: ${totalScore} - ${rec}`,
        checks: [
          {
            label: "趨勢動能強 (K > D)",
            status: kVal > dVal ? "pass" : "fail",
          },
          {
            label: "無頂部背離",
            status: recentBearishDiv ? "fail" : "pass",
          },
          { label: "量價配合", status: isVolStable ? "pass" : "manual" },
        ],
      },
      {
        label: "II. 市場環境",
        description: "流動性與趨勢 (Regime)",
        checks: [
          {
            label: `成交量穩定 (>60% MA): ${(volRatio * 100).toFixed(0)}%`,
            status: isVolStable ? "pass" : "fail",
          },
          {
            label: `趨勢方向 (中軌): ${trendStatus}`,
            status: bollMaRising ? "pass" : "manual",
          },
          { label: "波動度正常 (ATR)", status: "manual" },
        ],
      },
      {
        label: "III. 入場條件",
        description: "交叉與背離 (Entry)",
        checks: [
          {
            label: `KD 黃金交叉: ${goldCross ? "Yes" : "No"}`,
            status: goldCross ? "pass" : "fail",
          },
          {
            label: `超賣區 (<20): ${isOversold ? "Yes" : "No"}`,
            status: isOversold ? "pass" : "fail",
          },
          {
            label: `底背離信號: ${recentBullishDiv ? "Yes" : "No"}`,
            status: recentBullishDiv ? "pass" : "manual",
          },
        ],
      },
      {
        label: "IV. 風險控管",
        description: "停損與部位 (Risk)",
        checks: [
          { label: `建議停損: ${stopLoss}`, status: "manual" },
          {
            label: "KD 極端值減倉 (>85)",
            status: kVal > 85 ? "fail" : "pass",
          },
          { label: "死亡交叉警示", status: deathCross ? "fail" : "pass" },
        ],
      },
    ];

    return { steps: kdSteps, score: totalScore, recommendation: rec };
  }, [chartData, signals]);

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
        <Typography variant="h6" component="div" color="white">
          KD
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
        {/* Price Chart */}
        <ResponsiveContainer width="100%" height="60%">
          <ComposedChart
            data={chartData}
            syncId="kdSync"
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="t" hide />
            <YAxis domain={["auto", "auto"]} />
            <YAxis
              yAxisId="volAxis"
              orientation="right"
              domain={[0, (dataMax: number) => dataMax * 4]}
              tick={false}
              axisLine={false}
              width={0}
            />
            <Tooltip content={<ChartTooltip />} offset={50} />
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

            <Bar
              dataKey="v"
              yAxisId="volAxis"
              name="Volume"
              shape={(props: any) => {
                const { x, y, width, height, payload } = props;
                const isUp = payload.c > payload.o;
                return (
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={isUp ? "#f44336" : "#4caf50"}
                    opacity={0.2}
                  />
                );
              }}
            />

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

            {/* Divergence Signals on Price Chart */}
            {signals.map((signal) => {
              const isBearish =
                signal.type === DivergenceSignalType.BEARISH_DIVERGENCE;
              // Calculate y position: slightly above High for bearish, slightly below Low for bullish
              // We need to look up the price again because signal might only have k/d/t
              // But we passed {t, h, l ...} to detectKdDivergence?
              // Wait, detectKdDivergence output 'signals' only has {t, k, d, type, description}.
              // We need to find the H or L from chartData.
              const dataPoint = chartData.find((d) => d.t === signal.t);
              const yPos = isBearish ? dataPoint?.h || 0 : dataPoint?.l || 0;

              return (
                <ReferenceDot
                  key={signal.t}
                  x={signal.t}
                  y={yPos}
                  shape={(props: any) => {
                    const { cx, cy } = props;
                    if (!cx || !cy) return <g />;

                    return (
                      <g>
                        {isBearish ? (
                          // Down Triangle (Green)
                          <path
                            d={`M${cx - 5},${cy - 10} L${cx + 5},${
                              cy - 10
                            } L${cx},${cy} Z`}
                            fill="#4caf50"
                          />
                        ) : (
                          // Up Triangle (Red)
                          <path
                            d={`M${cx - 5},${cy + 10} L${cx + 5},${
                              cy + 10
                            } L${cx},${cy} Z`}
                            fill="#f44336"
                          />
                        )}
                        <text
                          x={cx}
                          y={isBearish ? cy - 15 : cy + 20}
                          textAnchor="middle"
                          fill={isBearish ? "#4caf50" : "#f44336"}
                          fontSize={12}
                          fontWeight="bold"
                          dy={isBearish ? 0 : 3}
                        >
                          {isBearish ? "頂背離" : "底背離"}
                        </text>
                      </g>
                    );
                  }}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>

        {/* KD Chart */}
        <ResponsiveContainer width="100%" height="35%">
          <ComposedChart
            data={chartData}
            syncId="kdSync"
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="t" hide />
            <YAxis domain={[0, 100]} ticks={[0, 20, 50, 80, 100]} />
            <Tooltip content={<ChartTooltip />} offset={50} />
            <ReferenceLine
              y={80}
              stroke="#f44336"
              strokeDasharray="3 3"
              label={{ value: "Overbought", fill: "#f44336", fontSize: 10 }}
            />
            <ReferenceLine
              y={20}
              stroke="#4caf50"
              strokeDasharray="3 3"
              label={{ value: "Oversold", fill: "#4caf50", fontSize: 10 }}
            />
            <ReferenceLine y={50} stroke="#666" strokeDasharray="3 3" />

            <Line
              dataKey="k"
              stroke="#2196f3"
              dot={false}
              activeDot={false}
              strokeWidth={2}
              name="K"
            />
            <Line
              dataKey="d"
              stroke="#ff9800"
              dot={false}
              activeDot={false}
              strokeWidth={2}
              name="D"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Container>
  );
}
