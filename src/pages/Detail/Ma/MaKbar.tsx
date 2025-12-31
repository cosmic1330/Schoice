import { dateFormat } from "@ch20026103/anysis";
import { Mode } from "@ch20026103/anysis/dist/esm/stockSkills/utils/dateFormat";
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
  FormControlLabel,
  Stack,
  Step,
  StepButton,
  Stepper,
  Switch,
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import BaseCandlestickRectangle from "../../../components/RechartCustoms/BaseCandlestickRectangle";
import { DealsContext } from "../../../context/DealsContext";
import { useGapDetection } from "../../../hooks/useGapDetection";
import { useGapVisualization } from "../../../hooks/useGapVisualization";
import useIndicatorSettings from "../../../hooks/useIndicatorSettings";
import useMarketAnalysis from "../../../hooks/useMarketAnalysis";
import { UrlTaPerdOptions } from "../../../types";
import { calculateIndicators } from "../../../utils/indicatorUtils";

type CheckStatus = "pass" | "fail" | "manual";

interface StepCheck {
  label: string;
  status: CheckStatus;
}

interface StrategyStep {
  label: string;
  description: string;
  checks: StepCheck[];
}

export default function MaKbar({
  perd,
  visibleCount,
  setVisibleCount,
  rightOffset,
  setRightOffset,
}: {
  perd: UrlTaPerdOptions;
  visibleCount: number;
  setVisibleCount: React.Dispatch<React.SetStateAction<number>>;
  rightOffset: number;
  setRightOffset: React.Dispatch<React.SetStateAction<number>>;
}) {
  const { settings } = useIndicatorSettings();
  const deals = useContext(DealsContext);

  // Zoom & Pan Control
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const startOffset = useRef(0);

  // --- States ---
  const [activeStep, setActiveStep] = useState(0);
  const [showGaps, setShowGaps] = useState(false);
  const [showOnlyUnfilled, setShowOnlyUnfilled] = useState(false);
  const [hoveredGapDate, setHoveredGapDate] = useState<
    number | string | undefined
  >(undefined);
  const [visibleMAs, setVisibleMAs] = useState({
    ma5: true,
    ma10: true,
    ma20: true,
    ma60: true,
    ma240: true,
  });

  const { power } = useMarketAnalysis({
    ta: deals,
    perd,
  });

  // Re-calculate indicators based on custom settings
  const chartData = useMemo(() => {
    return calculateIndicators(deals, settings);
  }, [deals, settings]);

  // Handle Zoom (Wheel)
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const delta = Math.sign(e.deltaY);
      const step = 4; // Sensitivity

      setVisibleCount((prev) => {
        const next = prev + delta * step;
        const minBars = 30;
        const maxBars = chartData.length > 0 ? chartData.length : 1000;

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
        const maxOffset = Math.max(0, chartData.length - visibleCount);
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
  }, [chartData.length, visibleCount, rightOffset]);

  // Apply slice to chartData for rendering
  const slicedChartData = useMemo(() => {
    const end = rightOffset === 0 ? undefined : -rightOffset;
    const start = -(visibleCount + rightOffset);
    return chartData.slice(start, end);
  }, [chartData, visibleCount, rightOffset]);

  // Gap Detection
  const { gapsWithFillStatus, unfilledGaps, recentGaps, unfilledGapsCount } =
    useGapDetection(slicedChartData, 0.7);

  // Gap Visualization Data
  const { gapLines, enhancedChartData } = useGapVisualization({
    gaps: showOnlyUnfilled ? unfilledGaps : gapsWithFillStatus,
    chartData: slicedChartData,
    isVisible: showGaps,
    highlightedGapDate: hoveredGapDate,
  });

  // Signal Calculation (Historical)
  const signals = useMemo(() => {
    const result: {
      t: number | string;
      type: "buy" | "sell";
      price: number;
      reason: string;
    }[] = [];
    if (enhancedChartData.length < 2) return result;

    for (let i = 1; i < enhancedChartData.length; i++) {
      const current = enhancedChartData[i];
      const prev = enhancedChartData[i - 1];

      // Ensure we have values
      if (
        typeof current.ma5 !== "number" ||
        typeof current.ma20 !== "number" ||
        typeof prev.ma5 !== "number" ||
        typeof prev.ma20 !== "number"
      ) {
        continue;
      }

      // Golden Cross (Buy)
      if (prev.ma5 <= prev.ma20 && current.ma5 > current.ma20) {
        result.push({
          t: current.t!,
          type: "buy",
          price: current.l!,
          reason: "均線金叉",
        });
      }
      // Death Cross (Sell)
      else if (prev.ma5 >= prev.ma20 && current.ma5 < current.ma20) {
        result.push({
          t: current.t!,
          type: "sell",
          price: current.h!,
          reason: "均線死叉",
        });
      }
    }
    return result;
  }, [enhancedChartData]);

  // Derived Logic for Dashboard
  const { steps, score, recommendation } = useMemo(() => {
    if (enhancedChartData.length === 0)
      return { steps: [], score: 0, recommendation: "" };

    const current = enhancedChartData[enhancedChartData.length - 1];

    const price = current.c;
    const trend = current.trend as string;
    const ma5 = current.ma5;
    const ma20 = current.ma20;
    const ma240 = current.ma240;

    const isNum = (n: any): n is number => typeof n === "number";

    if (!isNum(price) || !isNum(ma5) || !isNum(ma20) || !isNum(ma240)) {
      return { steps: [], score: 0, recommendation: "Data Error" };
    }

    // 1. Trend Analysis
    const isBullish = trend === "多頭";
    const isBearish = trend === "空頭";
    const maStackOk = ma5 > ma20;

    // 2. Gap Analysis
    const lastGap = recentGaps.length > 0 ? recentGaps[0] : null;
    const recentUpGap = lastGap && lastGap.type === "up";
    const hasUnfilledUp = unfilledGaps.some((g) => g.type === "up");

    // 3. Power Analysis
    const powerStr = power as string;
    const isPowerBullish = powerStr.includes("多方");
    const isPowerBearish = powerStr.includes("空方");

    // 4. Signal (Current Candle)
    const lastSignal = signals.length > 0 ? signals[signals.length - 1] : null;
    const isRecentBuy =
      lastSignal &&
      lastSignal.type === "buy" &&
      enhancedChartData.length -
        enhancedChartData.indexOf(
          enhancedChartData.find((d) => d.t === lastSignal.t) as any
        ) <
        5;

    // Scoring
    let totalScore = 0;

    // Trend (40)
    if (isBullish) totalScore += 40;
    else if (maStackOk) totalScore += 20;
    if (isBearish) totalScore -= 20;

    // Gaps (30)
    if (recentUpGap) totalScore += 20;
    if (hasUnfilledUp) totalScore += 10;
    if (lastGap && lastGap.type === "down") totalScore -= 10;

    // Power (30)
    if (isPowerBullish) totalScore += 30;
    if (isPowerBearish) totalScore -= 20;

    // Bonus
    if (isRecentBuy) totalScore += 10;

    if (totalScore < 0) totalScore = 0;
    if (totalScore > 100) totalScore = 100;

    let rec = "Neutral";
    if (totalScore >= 80) rec = "Strong Buy";
    else if (totalScore >= 60) rec = "Buy";
    else if (totalScore <= 30) rec = "Sell";
    else rec = "Hold";

    const dashSteps: StrategyStep[] = [
      {
        label: "I. 趨勢分析",
        description: `MA 排列: ${trend}`,
        checks: [
          {
            label: `均線多頭排列 (${settings.ma5}>${settings.ma10}>${settings.ma20}>${settings.ma60}>${settings.ma240})`,
            status: isBullish ? "pass" : isBearish ? "fail" : "manual",
          },
          {
            label: `MA${settings.ma5} > MA${settings.ma20}: ${maStackOk}`,
            status: maStackOk ? "pass" : "fail",
          },
        ],
      },
      {
        label: "II. 缺口研判",
        description: `未補: ${unfilledGapsCount} / 近期: ${
          lastGap ? (lastGap.type === "up" ? "↑" : "↓") : "無"
        }`,
        checks: [
          { label: "近期出現向上跳空", status: recentUpGap ? "pass" : "fail" },
          {
            label: "存在未補多方缺口",
            status: hasUnfilledUp ? "pass" : "fail",
          },
        ],
      },
      {
        label: "III. 力道動能",
        description: powerStr,
        checks: [
          { label: "多方力道增強", status: isPowerBullish ? "pass" : "fail" },
          {
            label: "MACD 動能支持",
            status: isPowerBullish
              ? "pass"
              : isPowerBearish
              ? "fail"
              : "manual",
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
          { label: "近期金叉訊號", status: isRecentBuy ? "pass" : "manual" },
        ],
      },
    ];

    return { steps: dashSteps, score: totalScore, recommendation: rec };
  }, [
    enhancedChartData,
    recentGaps,
    unfilledGaps,
    unfilledGapsCount,
    power,
    signals,
  ]);

  const handleStep = (step: number) => () => {
    setActiveStep(step);
    // 根據步驟自動調整顯示
    if (step === 0) {
      // 趨勢分析：全開 MA，關閉缺口
      setVisibleMAs({
        ma5: true,
        ma10: true,
        ma20: true,
        ma60: true,
        ma240: true,
      });
      setShowGaps(false);
    } else if (step === 1) {
      // 缺口研判：關閉 MA，開啟缺口
      setVisibleMAs({
        ma5: false,
        ma10: false,
        ma20: false,
        ma60: false,
        ma240: false,
      });
      setShowGaps(true);
    } else if (step === 2) {
      // 力道動能：僅開短期 MA
      setVisibleMAs({
        ma5: true,
        ma10: true,
        ma20: true,
        ma60: false,
        ma240: false,
      });
      setShowGaps(false);
    } else if (step === 3) {
      // 綜合評估：全開
      setVisibleMAs({
        ma5: true,
        ma10: true,
        ma20: true,
        ma60: true,
        ma240: true,
      });
      setShowGaps(true);
    }
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

  // 自定義 Tooltip 組件來處理 hover 事件
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // 檢查當前 hover 的位置是否有缺口
      const currentGaps = (
        showOnlyUnfilled ? unfilledGaps : gapsWithFillStatus
      ).filter((gap) => gap.date === label);

      if (currentGaps.length > 0) {
        // 如果有缺口，設置高亮
        if (hoveredGapDate !== label) {
          setHoveredGapDate(label);
        }
      } else {
        // 如果沒有缺口，清除高亮
        if (hoveredGapDate !== undefined) {
          setHoveredGapDate(undefined);
        }
      }

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
          <p style={{ color: "#eee", margin: "0 0 5px 0" }}>
            {perd === UrlTaPerdOptions.Hour
              ? label
              : dateFormat(label, Mode.NumberToString)}
          </p>
          {payload.map((entry: any, index: number) => {
            if (entry.name && entry.name.includes("gap")) return null;
            return (
              <p key={index} style={{ color: entry.color, margin: 0 }}>
                {entry.name}:{" "}
                {typeof entry.value === "number"
                  ? entry.value.toFixed(2)
                  : entry.value}
              </p>
            );
          })}
          {currentGaps.length > 0 && (
            <div
              style={{
                marginTop: 8,
                borderTop: "1px solid #555",
                paddingTop: 4,
              }}
            >
              {currentGaps.map((g) => (
                <p
                  key={g.date}
                  style={{
                    color: g.type === "up" ? "#ff5252" : "#69f0ae",
                    margin: 0,
                  }}
                >
                  {g.type === "up" ? "支撐缺口" : "壓力缺口"}{" "}
                  {g.size.toFixed(2)} ({g.sizePercent.toFixed(1)}%)
                </p>
              ))}
            </div>
          )}
        </div>
      );
    }
    // 當沒有 hover 時清除高亮
    if (hoveredGapDate !== undefined) {
      setHoveredGapDate(undefined);
    }
    return null;
  };

  if (enhancedChartData.length === 0) {
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
          MA
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

            {/* Contextual Visibility Controls */}
            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: "none", md: "block" }, mx: 1 }}
            />
            <Stack direction="row" spacing={1} alignItems="center">
              {(activeStep === 0 || activeStep === 2 || activeStep === 3) && (
                <>
                  {[
                    {
                      key: "ma5" as const,
                      label: `MA${settings.ma5}`,
                      color: "#2196f3",
                    },
                    {
                      key: "ma10" as const,
                      label: `MA${settings.ma10}`,
                      color: "#ffeb3b",
                    },
                    {
                      key: "ma20" as const,
                      label: `MA${settings.ma20}`,
                      color: "#ff9800",
                    },
                    {
                      key: "ma60" as const,
                      label: `MA${settings.ma60}`,
                      color: "#f44336",
                    },
                    {
                      key: "ma240" as const,
                      label: `MA${settings.ma240}`,
                      color: "#9c27b0",
                    },
                  ]
                    .filter((m) =>
                      activeStep === 2
                        ? ["ma5", "ma10", "ma20"].includes(m.key)
                        : true
                    )
                    .map((m) => (
                      <Chip
                        key={m.key}
                        label={m.label}
                        size="small"
                        onClick={() =>
                          setVisibleMAs((prev) => ({
                            ...prev,
                            [m.key]: !prev[m.key],
                          }))
                        }
                        sx={{
                          height: 20,
                          fontSize: "0.65rem",
                          bgcolor: visibleMAs[m.key] ? m.color : "transparent",
                          color: visibleMAs[m.key] ? "#000" : "#888",
                          borderColor: visibleMAs[m.key] ? m.color : "#444",
                          "&:hover": {
                            bgcolor: visibleMAs[m.key]
                              ? m.color
                              : "rgba(255,255,255,0.1)",
                          },
                        }}
                      />
                    ))}
                </>
              )}

              {(activeStep === 1 || activeStep === 3) && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={showGaps}
                        onChange={(e) => setShowGaps(e.target.checked)}
                      />
                    }
                    label={
                      <Typography
                        variant="caption"
                        sx={{ fontSize: "0.65rem", color: "#888" }}
                      >
                        缺口
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={showOnlyUnfilled}
                        onChange={(e) => setShowOnlyUnfilled(e.target.checked)}
                        disabled={!showGaps}
                        color="secondary"
                      />
                    }
                    label={
                      <Typography
                        variant="caption"
                        sx={{ fontSize: "0.65rem", color: "#888" }}
                      >
                        僅未補
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                </Stack>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Combined Chart: Price (Main) + Volume (Overlay at bottom) */}
      <Box
        ref={chartContainerRef}
        sx={{ flexGrow: 1, minHeight: 0, width: "100%" }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={enhancedChartData}
            syncId="maSync"
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="t" hide />

            {/* Main Price Axis (Left) */}
            <YAxis domain={["auto", "auto"]} />

            {/* Volume Axis (Right, Hidden or Low-profile, Scaled to push bars down) */}
            <YAxis
              yAxisId="volAxis"
              orientation="right"
              domain={[0, (dataMax: number) => dataMax * 4]}
              width={40}
              tick={false}
              axisLine={false}
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

            {/* Volume Bars (Overlay) */}
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

            {visibleMAs.ma5 && (
              <Line
                dataKey="ma5"
                stroke="#2196f3"
                dot={false}
                activeDot={false}
                name={`MA${settings.ma5}`}
                strokeWidth={1.5}
              />
            )}
            {visibleMAs.ma10 && (
              <Line
                dataKey="ma10"
                stroke="#ffeb3b"
                dot={false}
                activeDot={false}
                name={`MA${settings.ma10}`}
                strokeWidth={1.5}
              />
            )}
            {visibleMAs.ma20 && (
              <Line
                dataKey="ma20"
                stroke="#ff9800"
                dot={false}
                activeDot={false}
                name={`MA${settings.ma20}`}
                strokeWidth={2}
              />
            )}
            {visibleMAs.ma60 && (
              <Line
                dataKey="ma60"
                stroke="#f44336"
                dot={false}
                activeDot={false}
                name={`MA${settings.ma60}`}
                strokeWidth={1.5}
              />
            )}
            {visibleMAs.ma240 && (
              <Line
                dataKey="ma240"
                stroke="#9c27b0"
                dot={false}
                activeDot={false}
                name={`MA${settings.ma240}`}
                strokeWidth={1.5}
              />
            )}

            {/* Signal Markers */}
            {signals.map((signal) => {
              const isLong = signal.type === "buy";
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
                              y={cy + 25}
                              textAnchor="middle"
                              fill={color}
                              fontSize={10}
                            >
                              {signal.reason}
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
                              fontSize={10}
                            >
                              {signal.reason}
                            </text>
                          </>
                        )}
                      </g>
                    );
                  }}
                />
              );
            })}

            {/* Gap Visualization */}
            {showGaps &&
              gapLines
                .map((gap) => [
                  <Line
                    key={`gap-upper-${gap.date}`}
                    dataKey={`gap_upper_${gap.date}`}
                    stroke={gap.upperLine.stroke}
                    strokeWidth={gap.upperLine.strokeWidth}
                    strokeDasharray={gap.upperLine.strokeDasharray}
                    opacity={gap.upperLine.opacity}
                    dot={false}
                    activeDot={false}
                    legendType="none"
                  />,
                  <Line
                    key={`gap-lower-${gap.date}`}
                    dataKey={`gap_lower_${gap.date}`}
                    stroke={gap.lowerLine.stroke}
                    strokeWidth={gap.lowerLine.strokeWidth}
                    strokeDasharray={gap.lowerLine.strokeDasharray}
                    opacity={gap.lowerLine.opacity}
                    dot={false}
                    activeDot={false}
                    legendType="none"
                  />,
                ])
                .flat()}
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Container>
  );
}
