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
  Area,
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
import { calculateIndicators } from "../../../utils/indicatorUtils";

interface MrChartData
  extends Partial<{
    t: number | string;
    o: number | null;
    h: number | null;
    l: number | null;
    c: number | null;
    v: number | null;
  }> {
  rsi: number | null;
  osc: number | null;
  bollMa: number | null;
  bollUb: number | null;
  bollLb: number | null;
  longZone: number | null; // For Area chart
  shortZone: number | null; // For Area chart
  positiveOsc: number | null;
  negativeOsc: number | null;
}

type CheckStatus = "pass" | "fail" | "manual";

interface StepCheck {
  label: string;
  status: CheckStatus;
}

interface MrStep {
  label: string;
  description: string;
  checks: StepCheck[];
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "#222",
          padding: "10px",
          borderRadius: "4px",
          border: "1px solid #444",
          fontSize: "12px",
        }}
      >
        <p style={{ color: "#eee", margin: "0 0 5px 0" }}>{label}</p>
        {payload.map((entry: any) => {
          // Hide auxiliary areas
          if (entry.name === "longZone" || entry.name === "shortZone")
            return null;

          const val =
            typeof entry.value === "number"
              ? entry.value.toFixed(2)
              : entry.value;
          return (
            <p key={entry.name} style={{ color: entry.color, margin: 0 }}>
              {entry.name}: {val}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

export default function MR({
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
  const deals = useContext(DealsContext);
  const { settings } = useIndicatorSettings();
  const [activeStep, setActiveStep] = useState(0);

  // Zoom & Pan Control
  // const [visibleCount, setVisibleCount] = useState(160);
  // const [rightOffset, setRightOffset] = useState(0);
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

  const chartData = useMemo((): MrChartData[] => {
    const data = calculateIndicators(deals, settings);

    return data
      .map((item) => {
        const { rsi: rsiVal, osc } = item;

        // Logic:
        // Long Zone: RSI > 50 && Osc > 0
        // Short Zone: RSI < 50 && Osc < 0
        const isLong = (rsiVal || 0) > 50 && (osc || 0) > 0;
        const isShort = (rsiVal || 0) < 50 && (osc || 0) < 0;

        return {
          ...item,
          longZone: isLong ? rsiVal : null,
          shortZone: isShort ? rsiVal : null,
          positiveOsc: (osc || 0) > 0 ? osc : 0,
          negativeOsc: (osc || 0) < 0 ? osc : 0,
        };
      })
      .slice(
        -(visibleCount + rightOffset),
        rightOffset === 0 ? undefined : -rightOffset
      );
  }, [deals, visibleCount, rightOffset, settings]);

  // Calculate Entry Signals (State Transition)
  const signals = useMemo(() => {
    const result = [];
    for (let i = 1; i < chartData.length; i++) {
      const curr = chartData[i];
      const prev = chartData[i - 1];

      const currLong = (curr.rsi || 0) > 50 && (curr.osc || 0) > 0;
      const prevLong = (prev.rsi || 0) > 50 && (prev.osc || 0) > 0;

      const currShort = (curr.rsi || 0) < 50 && (curr.osc || 0) < 0;
      const prevShort = (prev.rsi || 0) < 50 && (prev.osc || 0) < 0;

      if (currLong && !prevLong) {
        result.push({ t: curr.t, type: "entry_long", price: curr.c });
      } else if (currShort && !prevShort) {
        result.push({ t: curr.t, type: "entry_short", price: curr.c });
      }
    }
    return result;
  }, [chartData]);

  const { steps, score, recommendation } = useMemo(() => {
    if (chartData.length === 0)
      return { steps: [], score: 0, recommendation: "" };

    const current = chartData[chartData.length - 1];
    const prev = chartData[chartData.length - 2] || current;

    const isNum = (n: any): n is number => typeof n === "number";

    const price = current.c;
    const rsiVal = current.rsi;
    const osc = current.osc;
    const bollMa = current.bollMa;

    if (!isNum(price) || !isNum(rsiVal) || !isNum(osc) || !isNum(bollMa)) {
      return { steps: [], score: 0, recommendation: "Data Error" };
    }

    const isLongZone = rsiVal > 50 && osc > 0;
    const isShortZone = rsiVal < 50 && osc < 0;
    const trendUp = price > bollMa;
    const rsiRising = rsiVal > (prev.rsi || 0);
    const oscRising = osc > (prev.osc || 0);

    // Scoring
    let totalScore = 0;

    // 1. Zone Status (40)
    if (isLongZone) totalScore += 40;
    else if (rsiVal > 50 || osc > 0) totalScore += 20; // Partial bull
    if (isShortZone) totalScore -= 40;

    // 2. Trend (20)
    if (trendUp) totalScore += 20;

    // 3. Momentum (40)
    if (rsiRising) totalScore += 20;
    if (oscRising) totalScore += 20;

    if (totalScore < 0) totalScore = 0;
    if (totalScore > 100) totalScore = 100;

    let rec = "Neutral";
    if (totalScore >= 80) rec = "Strong Buy";
    else if (totalScore >= 60) rec = "Buy";
    else if (totalScore <= 20) rec = "Sell";
    else rec = "Hold";

    const mrSteps: MrStep[] = [
      {
        label: "I. 指標狀態",
        description: "MR 雙指標 (RSI & MACD)",
        checks: [
          {
            label: `RSI(5) > 50: ${rsiVal.toFixed(1)}`,
            status: rsiVal > 50 ? "pass" : "fail",
          },
          {
            label: `MACD Osc > 0: ${osc.toFixed(2)}`,
            status: osc > 0 ? "pass" : "fail",
          },
        ],
      },
      {
        label: "II. 訊號判定",
        description: "多空區域確認",
        checks: [
          {
            label: `多方共振 (RSI>50 & Osc>0): ${isLongZone ? "Yes" : "No"}`,
            status: isLongZone ? "pass" : "fail",
          },
          {
            label: `空方共振 (RSI<50 & Osc<0): ${isShortZone ? "Yes" : "No"}`,
            status: isShortZone ? "fail" : "pass",
          },
        ],
      },
      {
        label: "III. 趨勢與動能",
        description: "MA20 與 動能方向",
        checks: [
          {
            label: `價格 > 中軌: ${trendUp ? "Yes" : "No"}`,
            status: trendUp ? "pass" : "fail",
          },
          {
            label: `RSI 上升中: ${rsiRising ? "Yes" : "No"}`,
            status: rsiRising ? "pass" : "fail",
          },
        ],
      },
      {
        label: "IV. 綜合評估",
        description: `得分: ${totalScore} - ${rec}`,
        checks: [
          {
            label: `目前建議: ${rec}`,
            status: totalScore >= 60 ? "pass" : "manual",
          },
        ],
      },
    ];

    return { steps: mrSteps, score: totalScore, recommendation: rec };
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
        <Typography variant="h6" component="div" color="white">
          MR
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

      <Box ref={chartContainerRef} sx={{ flexGrow: 1, minHeight: 0 }}>
        {/* Main Price Chart (65%) */}
        <ResponsiveContainer width="100%" height="65%">
          <ComposedChart data={chartData} syncId="mrSync">
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="t" hide />
            <YAxis domain={["auto", "auto"]} />
            <YAxis
              yAxisId="right_dummy"
              orientation="right"
              tick={false}
              axisLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} offset={50} />
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

            {/* Entry Signal Markers */}
            {signals.map((signal) => {
              const isLong = signal.type === "entry_long";
              const yPos = isLong ? signal.price! * 0.99 : signal.price! * 1.01;
              const color = isLong ? "#f44336" : "#4caf50";

              return (
                <ReferenceDot
                  key={signal.t}
                  x={signal.t}
                  y={yPos}
                  r={4}
                  stroke="none"
                  shape={(props: any) => {
                    const { cx, cy } = props;
                    if (!cx || !cy) return <g />;

                    return (
                      <g>
                        {isLong ? (
                          // Long Entry
                          <>
                            <path
                              d={`M${cx - 5},${cy + 10} L${cx + 5},${
                                cy + 10
                              } L${cx},${cy} Z`}
                              fill={color}
                            />
                            <text
                              x={cx}
                              y={cy + 22}
                              textAnchor="middle"
                              fill={color}
                              fontSize={11}
                              fontWeight="bold"
                            >
                              買進
                            </text>
                          </>
                        ) : (
                          // Short Entry
                          <>
                            <path
                              d={`M${cx - 5},${cy - 10} L${cx + 5},${
                                cy - 10
                              } L${cx},${cy} Z`}
                              fill={color}
                            />
                            <text
                              x={cx}
                              y={cy - 15}
                              textAnchor="middle"
                              fill={color}
                              fontSize={11}
                              fontWeight="bold"
                            >
                              賣出
                            </text>
                          </>
                        )}
                      </g>
                    );
                  }}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Combined RSI & MACD Chart (35%) */}
        <ResponsiveContainer width="100%" height="35%">
          <ComposedChart data={chartData} syncId="mrSync">
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="t" />

            {/* Left Axis for MACD Osc */}
            <YAxis
              yAxisId="left"
              orientation="left"
              stroke="#888"
              fontSize={10}
            />

            {/* Right Axis for RSI (0-100) */}
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              stroke="#2196f3"
              fontSize={10}
              width={40}
            />

            <Tooltip content={<CustomTooltip />} offset={50} />

            <ReferenceLine y={0} yAxisId="left" stroke="#666" opacity={0.5} />
            <ReferenceLine
              y={50}
              yAxisId="right"
              stroke="#666"
              strokeDasharray="3 3"
              opacity={0.5}
            />

            {/* MACD Bars (Left Axis) */}
            <Bar
              yAxisId="left"
              dataKey="positiveOsc"
              fill="#f44336"
              barSize={3}
              name="Osc +"
            />
            <Bar
              yAxisId="left"
              dataKey="negativeOsc"
              fill="#4caf50"
              barSize={3}
              name="Osc -"
            />

            {/* RSI Zones (Right Axis) */}
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="longZone"
              fill="#ffcdd2"
              stroke="none"
              baseValue={50}
              opacity={0.3}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="shortZone"
              fill="#c8e6c9"
              stroke="none"
              baseValue={50}
              opacity={0.3}
            />
            <Line
              yAxisId="right"
              dataKey="rsi"
              stroke="#2196f3"
              dot={false}
              strokeWidth={2}
              name="RSI (5)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Container>
  );
}
