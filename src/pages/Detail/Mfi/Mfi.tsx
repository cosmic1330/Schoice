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
import {
  Bar,
  CartesianGrid,
  Cell,
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
import macd from "../../../cls_tools/macd";
import BaseCandlestickRectangle from "../../../components/RechartCustoms/BaseCandlestickRectangle";
import { DealsContext } from "../../../context/DealsContext";
import useIndicatorSettings from "../../../hooks/useIndicatorSettings";
import {
  calculateIndicators,
  EnhancedDealData,
} from "../../../utils/indicatorUtils";
import ChartTooltip from "../Tooltip/ChartTooltip";

interface MfiChartData extends Partial<EnhancedDealData> {
  buySignal?: number | null;
  exitSignal?: number | null;
  buyReason?: string;
  exitReason?: string;
  // MACD
  macdOsc?: number | null;
  macdDif?: number | null;
  macdDem?: number | null;
}

type CheckStatus = "pass" | "fail" | "manual";

interface StepCheck {
  label: string;
  status: CheckStatus;
}

interface MfiStep {
  label: string;
  description: string;
  checks: StepCheck[];
}

export default function Mfi({
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

  const chartData = useMemo((): MfiChartData[] => {
    if (!deals || deals.length === 0) return [];

    // 1. Initial enhancement (MAs, Boll, RSI, MFI)
    const enhancedData = calculateIndicators(deals, settings);

    // 2. Full dataset signal calculation
    let macdState = macd.init(deals[0]);
    const fullDataWithMacd = enhancedData.map((d, i) => {
      if (i > 0) macdState = macd.next(d as any, macdState);
      return {
        ...d,
        macdOsc: macdState.osc,
        macdDif: (macdState as any).dif,
        macdDem: (macdState as any).dem,
      };
    });

    const fullDataWithSignals = fullDataWithMacd.map((d, i, arr) => {
      let buySignal: number | null = null;
      let exitSignal: number | null = null;
      let buyReason: string | undefined;
      let exitReason: string | undefined;

      if (i > 0) {
        const prev = arr[i - 1];
        const currMfi = d.mfi || 50;
        const prevMfi = prev.mfi || 50;

        // Buy: Oversold (<20) and Turning Up
        if (prevMfi < 20 && currMfi > prevMfi) {
          buySignal = d.l ? d.l * 0.98 : null;
          buyReason = "超賣反轉";
        }
        // Sell: Overbought (>80) and Turning Down
        else if (prevMfi > 80 && currMfi < prevMfi) {
          exitSignal = d.h ? d.h * 1.02 : null;
          exitReason = "超買反轉";
        }
      }

      return { ...d, buySignal, exitSignal, buyReason, exitReason };
    });

    // 3. Slice for visible area
    const slicedData = fullDataWithSignals.slice(
      -(visibleCount + rightOffset),
      rightOffset === 0 ? undefined : -rightOffset
    );

    return slicedData;
  }, [deals, settings, visibleCount, rightOffset]);

  const { steps, score, recommendation } = useMemo(() => {
    if (chartData.length === 0)
      return { steps: [], score: 0, recommendation: "" };

    const current = chartData[chartData.length - 1];
    const prev = chartData[chartData.length - 2] || current;

    const isNum = (n: any): n is number => typeof n === "number";

    const price = current.c;
    const mfiVal = current.mfi;
    const bollMa = current.bollMa;
    const vol = current.v;
    const volMa = current.volMa20;
    const macdOsc = current.macdOsc || 0;

    if (
      !isNum(price) ||
      !isNum(mfiVal) ||
      !isNum(bollMa) ||
      !isNum(vol) ||
      !isNum(volMa)
    ) {
      return { steps: [], score: 0, recommendation: "Data Error" };
    }

    // I. Regime
    const volRatio = vol / volMa;
    const isVolStable = volRatio > 0.6; // Not dead volume
    const bollMaRising = bollMa > (prev.bollMa || 0);
    const trendStatus = bollMaRising ? "Uptrend" : "Downtrend/Flat";

    // II. Entry
    const isOversold = mfiVal < 20;
    const isOverbought = mfiVal > 80;
    const mfiRising = mfiVal > (prev.mfi || 0);
    const macdBullish = macdOsc > 0 && macdOsc > (prev.macdOsc || 0);

    // III. Risk
    const stopLoss = (price * 0.97).toFixed(2); // 3% trail or recent low

    // Score
    let totalScore = 0;
    // 1. Volume (20)
    if (isVolStable) totalScore += 20;
    // 2. Trend (20)
    if (bollMaRising || price > bollMa) totalScore += 20;
    // 3. MFI Position (30)
    if (isOversold && mfiRising) totalScore += 30; // Perfect buy setup
    else if (mfiVal > 40 && mfiVal < 60 && mfiRising && price > bollMa)
      totalScore += 20; // Momentum continuation
    else if (isOverbought) totalScore -= 20; // Warning

    // 4. MACD Confirmation (10)
    if (macdBullish) totalScore += 10;

    // 5. Price Action (20)
    if (price > (current.o || 0)) totalScore += 20; // Green candle

    if (totalScore < 0) totalScore = 0;
    if (totalScore > 100) totalScore = 100;

    let rec = "Reject";
    if (totalScore >= 80) rec = "Strong Buy";
    else if (totalScore >= 60) rec = "Watch";
    else if (isOverbought) rec = "Sell/Exit";
    else rec = "Neutral";

    const mfiSteps: MfiStep[] = [
      {
        label: "I. 綜合評估",
        description: `得分: ${totalScore} - ${rec}`,
        checks: [
          {
            label: "趨勢動能強 (MFI > 50 & Rising)",
            status: mfiVal > 50 && mfiRising ? "pass" : "fail",
          },
          { label: "無頂部背離 (Bearish Div)", status: "manual" },
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
        description: "超賣反轉或動能 (Entry)",
        checks: [
          {
            label: `MFI < 20 (超賣): ${mfiVal.toFixed(1)}`,
            status: isOversold ? "pass" : mfiVal < 30 ? "manual" : "fail",
          },
          {
            label: "MFI 低點抬高 (Turn Up)",
            status: mfiVal > (prev.mfi || 0) ? "pass" : "fail",
          },
          {
            label: `MACD 翻紅: ${macdBullish ? "Yes" : "No"}`,
            status: macdBullish ? "pass" : "manual",
          },
        ],
      },
      {
        label: "IV. 風險控管",
        description: "停損與部位 (Risk)",
        checks: [
          { label: `建議停損: ${stopLoss}`, status: "manual" },
          {
            label: "MFI 極端值減倉 (<15/>85)",
            status: mfiVal < 15 || mfiVal > 85 ? "fail" : "pass",
          },
          { label: "單筆風險 < 1.2%", status: "manual" },
        ],
      },
    ];

    return { steps: mfiSteps, score: totalScore, recommendation: rec };
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
        <MuiTooltip title="MFI 較敏感，MACD 較穩重。兩者結合可減少 MFI 頻繁震盪產生的雜訊。\n 價格是否觸碰布林軌道邊界?MACD 是否出現轉向交叉? 有的話可信度越高">
          <Typography variant="h6" component="div" color="white">
            MFI
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
        sx={{
          flexGrow: 1,
          minHeight: 0,
          width: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Price Chart */}
        <ResponsiveContainer width="100%" height="65%">
          <ComposedChart
            data={chartData}
            syncId="mfiSync"
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

            {chartData.map((d) => {
              const isBuy = typeof d.buySignal === "number";
              const isExit = typeof d.exitSignal === "number";
              if (!isBuy && !isExit) return null;

              const yPos = isBuy ? d.l! * 0.99 : d.h! * 1.01;
              const color = isBuy ? "#f44336" : "#4caf50";

              return (
                <ReferenceDot
                  key={`signal-${d.t}`}
                  x={d.t}
                  y={yPos}
                  r={4}
                  stroke="none"
                  shape={(props: any) => {
                    const { cx, cy } = props;
                    if (!cx || !cy) return <g />;

                    return (
                      <g>
                        {isBuy ? (
                          // Buy (Red)
                          <>
                            <path
                              d={`M${cx - 5},${cy + 10} L${cx + 5},${
                                cy + 10
                              } L${cx},${cy} Z`}
                              fill={color}
                            />
                          </>
                        ) : (
                          // Exit (Green)
                          <>
                            <path
                              d={`M${cx - 5},${cy - 10} L${cx + 5},${
                                cy - 10
                              } L${cx},${cy} Z`}
                              fill={color}
                            />
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

        {/* Combined MFI & MACD Chart */}
        <ResponsiveContainer width="100%" height="35%">
          <ComposedChart
            data={chartData}
            syncId="mfiSync"
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="t" hide />

            {/* Left Axis: MACD Osc */}
            <YAxis
              yAxisId="left"
              orientation="left"
              stroke="#666"
              fontSize={10}
            />

            {/* Right Axis: MFI */}
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              ticks={[20, 50, 80]}
              stroke="#2196f3"
              fontSize={10}
              width={0}
            />

            <Tooltip content={<ChartTooltip />} offset={50} />

            <ReferenceLine
              y={80}
              yAxisId="right"
              stroke="#f44336"
              strokeDasharray="3 3"
              label={{
                value: "Overbought",
                fill: "#f44336",
                fontSize: 10,
                position: "insideRight",
              }}
            />
            <ReferenceLine
              y={20}
              yAxisId="right"
              stroke="#4caf50"
              strokeDasharray="3 3"
              label={{
                value: "Oversold",
                fill: "#4caf50",
                fontSize: 10,
                position: "insideRight",
              }}
            />
            <ReferenceLine
              y={50}
              yAxisId="right"
              stroke="#666"
              strokeDasharray="3 3"
            />
            <ReferenceLine y={0} yAxisId="left" stroke="#666" opacity={0.5} />

            {/* MACD Bars (Left Axis) */}
            <Bar
              dataKey="macdOsc"
              yAxisId="left"
              name="Osc"
              fill="#ffeb3b"
              barSize={3}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={(entry.macdOsc || 0) > 0 ? "#f44336" : "#4caf50"}
                  opacity={0.5}
                />
              ))}
            </Bar>

            {/* MFI Line (Right Axis) */}
            <Line
              dataKey="mfi"
              yAxisId="right"
              stroke="#2196f3"
              dot={false}
              activeDot={false}
              strokeWidth={2}
              name="MFI"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Container>
  );
}
