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
  Tooltip as RechartsTooltip,
  ReferenceDot,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import ma from "../../../cls_tools/ma";
import macd from "../../../cls_tools/macd";
import obvTool from "../../../cls_tools/obv";
import rsi from "../../../cls_tools/rsi";
import BaseCandlestickRectangle from "../../../components/RechartCustoms/BaseCandlestickRectangle";
import { DealsContext } from "../../../context/DealsContext";
import ChartTooltip from "../Tooltip/ChartTooltip";
import { calculateObvSignals } from "./obvStrategy";

// Types
interface ObvChartData extends Partial<{
  t: number | string;
  o: number | null;
  h: number | null;
  l: number | null;
  c: number | null;
  v: number | null;
}> {
  // Price Indicators
  ma60: number | null;
  ma20: number | null; // Keep for reference
  volMa20: number | null;
  // OBV Indicators
  obv: number | null;
  obvMa20: number | null;
  // RSI & MACD
  rsi: number | null;
  macdOsc: number | null;
  macdDif: number | null;
  // Signals
  obvDivergenceEntry?: number | null;
  fakeBreakout?: number | null;
  accumulation?: number | null;
  exitWeakness?: number | null;
  stopLoss?: number | null;
  signalReason?: string | null;
  // Others
  obvHist?: number | null;
}

type CheckStatus = "pass" | "fail" | "manual";

interface StepCheck {
  label: string;
  status: CheckStatus;
}

interface AnalysisStep {
  label: string;
  description: string;
  checks: StepCheck[];
}

export default function Obv({
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
  const fullDeals = useContext(DealsContext);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const handleSwitchStep = () => {
      setActiveStep((prev) => (prev + 1) % 3); // 3 steps total
    };
    window.addEventListener("detail-switch-step", handleSwitchStep);
    return () =>
      window.removeEventListener("detail-switch-step", handleSwitchStep);
  }, []);

  // Zoom & Pan Control
  // const [visibleCount, setVisibleCount] = useState(150);
  // const [rightOffset, setRightOffset] = useState(0);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const startOffset = useRef(0);

  // --- Interaction Logic ---
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
        const maxBars = fullDeals.length > 0 ? fullDeals.length : 1000;

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
        const maxOffset = Math.max(0, fullDeals.length - visibleCount);
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
  }, [fullDeals.length, visibleCount, rightOffset]);

  // Safety Clamp
  useEffect(() => {
    const maxOffset = Math.max(0, fullDeals.length - visibleCount);
    if (rightOffset > maxOffset) {
      setRightOffset(maxOffset);
    }
  }, [fullDeals.length, visibleCount, rightOffset]);

  // --- Data Processing ---
  const signals = useMemo(() => {
    if (!fullDeals || fullDeals.length === 0) return [];
    return calculateObvSignals(fullDeals);
  }, [fullDeals]);

  const chartData = useMemo((): ObvChartData[] => {
    if (!fullDeals || fullDeals.length === 0) return [];

    // Initial states for cls_tools
    let obvState = obvTool.init(fullDeals[0]);
    let ma20State = ma.init(fullDeals[0], 20);
    let ma60State = ma.init(fullDeals[0], 60);
    let rsiState = rsi.init(fullDeals[0], 14);
    let macdState = macd.init(fullDeals[0]);
    let volMa20State = ma.init({ c: fullDeals[0].v } as any, 20);

    // Pre-calculate OBV for its MA
    const obvValues: number[] = [];
    for (let i = 0; i < fullDeals.length; i++) {
      if (i > 0) obvState = obvTool.next(fullDeals[i], obvState);
      obvValues.push(obvState.obv);
    }

    let obvMaState20 = ma.init({ c: obvValues[0] } as any, 20);
    const obvMaValues20 = [obvMaState20.ma];
    for (let i = 1; i < obvValues.length; i++) {
      obvMaState20 = ma.next({ c: obvValues[i] } as any, obvMaState20, 20);
      obvMaValues20.push(obvMaState20.ma);
    }

    // Map Signals
    const signalMap = new Map(signals.map((s) => [s.t, s]));

    const allData = fullDeals.map((d, i) => {
      if (i > 0) {
        ma20State = ma.next(d, ma20State, 20);
        ma60State = ma.next(d, ma60State, 60);
        rsiState = rsi.next(d, rsiState, 14);
        macdState = macd.next(d, macdState);
        volMa20State = ma.next({ c: d.v } as any, volMa20State, 20);
      }

      const signal = signalMap.get(d.t);
      const obvVal = obvValues[i];
      const obvMa20 = obvMaValues20[i];

      return {
        ...d,
        ma20: i >= 19 ? ma20State.ma : null,
        ma60: i >= 59 ? ma60State.ma : null,
        volMa20: i >= 19 ? volMa20State.ma : null,
        obv: obvVal,
        obvMa20: i >= 19 ? obvMa20 : null,
        obvHist: obvVal !== null && obvMa20 !== null ? obvVal - obvMa20 : null,
        rsi: i >= 13 ? rsiState.rsi : null,
        macdOsc: macdState.osc,
        macdDif: (macdState as any).dif || null,
        obvDivergenceEntry:
          signal?.type === "OBV_DIVERGENCE_ENTRY" ? d.l * 0.99 : null,
        fakeBreakout: signal?.type === "FAKE_BREAKOUT" ? d.h * 1.02 : null,
        accumulation: signal?.type === "ACCUMULATION" ? d.l * 0.98 : null,
        exitWeakness: signal?.type === "EXIT_WEAKNESS" ? d.l * 0.98 : null,
        stopLoss: (signal as any)?.type === "STOP_LOSS" ? d.h * 1.02 : null,
        signalReason: signal?.reason || null,
      };
    });

    return allData.slice(
      -(visibleCount + rightOffset),
      rightOffset === 0 ? undefined : -rightOffset,
    );
  }, [fullDeals, signals, visibleCount, rightOffset]);

  // --- Analysis Steps Logic ---
  const { steps, score, recommendation } = useMemo(() => {
    if (chartData.length === 0)
      return { steps: [], score: 0, recommendation: "" };

    const current = chartData[chartData.length - 1];
    // Helper Checks
    // Scoring Logic
    let totalScore = 0;
    const currentPrice = current.c || 0;
    const currentMa60 = current.ma60 || null;
    const currentObv = current.obv || null;
    const currentObvMa = current.obvMa20 || null;
    const currentRsi = current.rsi || null;
    const currentOsc = current.macdOsc || null;
    const currentVol = current.v || 0;
    const currentVolMa = current.volMa20 || null;

    // 1. Trend (Price vs MA60) - 25pts
    if (currentMa60 !== null && currentPrice > currentMa60) totalScore += 25;

    // 2. Volume & Momentum (OBV & Attack Vol) - 25pts
    let volScore = 0;
    if (
      currentObvMa !== null &&
      currentObv !== null &&
      currentObv > currentObvMa
    )
      volScore += 15;
    if (currentVolMa !== null && currentVol > currentVolMa * 1.5)
      volScore += 10;
    totalScore += volScore;

    // 3. Momentum (RSI) - 25pts
    if (currentRsi !== null) {
      if (currentRsi > 40 && currentRsi < 70) totalScore += 25;
      else if (currentRsi >= 70) totalScore += 10;
    }

    // 4. Turning Point (MACD) - 25pts
    if (currentOsc !== null && currentOsc > 0) totalScore += 25;

    let rec = "Neutral";
    if (totalScore >= 75) rec = "Strong Buy";
    else if (totalScore >= 50) rec = "Buy";
    else if (totalScore <= 25) rec = "Sell";

    const analysisSteps: AnalysisStep[] = [
      {
        label: "I. 綜合訊號",
        description: `得分: ${totalScore} - ${rec}`,
        checks: [
          {
            label: `目前建議: ${rec}`,
            status: totalScore >= 50 ? "pass" : "fail",
          },
        ],
      },
      {
        label: "II. 量能與趨勢",
        description: "OBV 與 攻擊量確認",
        checks: [
          {
            label: "價格 > MA60",
            status:
              currentMa60 !== null && currentPrice > currentMa60
                ? "pass"
                : "fail",
          },
          {
            label: "OBV 轉強 / 攻擊量",
            status: volScore >= 15 ? "pass" : "fail",
          },
        ],
      },
      {
        label: "III. 動能指標",
        description: "RSI 與 MACD",
        checks: [
          {
            label: `RSI(14): ${
              currentRsi !== null ? currentRsi.toFixed(1) : "N/A"
            }`,
            status:
              currentRsi !== null && currentRsi > 40 && currentRsi < 70
                ? "pass"
                : "manual",
          },
          {
            label: `MACD Osc: ${
              currentOsc !== null ? currentOsc.toFixed(2) : "N/A"
            }`,
            status: currentOsc !== null && currentOsc > 0 ? "pass" : "fail",
          },
        ],
      },
    ];

    return { steps: analysisSteps, score: totalScore, recommendation: rec };
  }, [chartData]);

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
      {/* Header Section */}
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{ mb: 1, flexShrink: 0 }}
      >
        <MuiTooltip
          title={
            <Box sx={{ p: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{ mb: 1, fontWeight: "bold" }}
              >
                DMI 指標說明
              </Typography>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                  <tr
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}
                  >
                    <th style={{ textAlign: "left", padding: "4px" }}>
                      線條名稱
                    </th>
                    <th style={{ textAlign: "left", padding: "4px" }}>
                      代表意義
                    </th>
                    <th style={{ textAlign: "left", padding: "4px" }}>
                      簡單口訣
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "4px", verticalAlign: "top" }}>
                      +DI (正趨向線)
                    </td>
                    <td style={{ padding: "4px", verticalAlign: "top" }}>
                      代表多頭（買方）的力量。
                    </td>
                    <td style={{ padding: "4px", verticalAlign: "top" }}>
                      越高代表多頭越強。
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px", verticalAlign: "top" }}>
                      -DI (負趨向線)
                    </td>
                    <td style={{ padding: "4px", verticalAlign: "top" }}>
                      代表空頭（賣方）的力量。
                    </td>
                    <td style={{ padding: "4px", verticalAlign: "top" }}>
                      越高代表空頭越強。
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px", verticalAlign: "top" }}>
                      ADX (平均趨向指數)
                    </td>
                    <td style={{ padding: "4px", verticalAlign: "top" }}>
                      {`ADX > 25: 代表市場進入強勢趨勢期`}
                    </td>
                    <td style={{ padding: "4px", verticalAlign: "top" }}>
                      {`ADX < 20： 代表市場進入悶盤/盤整期`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Box>
          }
          arrow
        >
          <Typography
            variant="h6"
            component="h1"
            fontWeight="bold"
            color="white"
          >
            OBV
          </Typography>
        </MuiTooltip>

        <Chip
          label={`${score}分 - ${recommendation}`}
          color={score >= 60 ? "success" : "error"}
          variant="outlined"
          size="small"
        />

        <Divider orientation="vertical" flexItem />

        <Box sx={{ flexGrow: 1 }}>
          <Stepper nonLinear activeStep={activeStep}>
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepButton
                  color="inherit"
                  onClick={() => setActiveStep(index)}
                >
                  {step.label}
                </StepButton>
              </Step>
            ))}
          </Stepper>
        </Box>
      </Stack>

      {/* Analysis Details Card */}
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

      {/* Charts Area */}
      <Box
        ref={chartContainerRef}
        sx={{
          flexGrow: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          width: "100%",
        }}
      >
        {/* 1. Price Chart (40%) */}
        <ResponsiveContainer width="100%" height="75%">
          <ComposedChart
            data={chartData}
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
            syncId="obvSync"
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="#fff" />
            <XAxis dataKey="t" hide />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "rgba(255,255,255,0.7)" }}
              stroke="rgba(255,255,255,0.3)"
            />
            <YAxis
              yAxisId="volAxis"
              orientation="right"
              domain={[0, (dataMax: number) => dataMax * 4]}
              tick={false}
              axisLine={false}
              width={0}
            />

            <RechartsTooltip content={<ChartTooltip showSignals={true} />} />

            <Line
              dataKey="h"
              stroke="#fff"
              opacity={0}
              dot={false}
              legendType="none"
              name="高"
            />
            <Line
              dataKey="c"
              stroke="#fff"
              opacity={0}
              dot={false}
              legendType="none"
              name="收"
            />
            <Line
              dataKey="l"
              stroke="#fff"
              opacity={0}
              dot={false}
              legendType="none"
              name="低"
            />
            <Line
              dataKey="o"
              stroke="#fff"
              opacity={0}
              dot={false}
              legendType="none"
              name="開"
            />

            {/* Price Indicators */}
            <Line
              dataKey="ma60"
              stroke="#64b5f6"
              strokeWidth={1}
              dot={false}
              name="MA60"
            />
            <Line
              dataKey="ma20"
              stroke="#f1af20ff"
              strokeWidth={0.5}
              dot={false}
              name="MA20"
            />

            <Customized
              component={BaseCandlestickRectangle}
              upColor="#ff4d4f"
              downColor="#52c41a"
            />

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
            {/* Signal Markers */}
            {chartData.map((d) => {
              const entry = d.obvDivergenceEntry !== null;
              const fakeBreak = d.fakeBreakout !== null;
              const accum = d.accumulation !== null;
              const weak = d.exitWeakness !== null;
              const stop = d.stopLoss !== null;

              if (!entry && !fakeBreak && !accum && !weak && !stop) return null;

              const isEntry = entry || accum;
              const signalPrice = isEntry ? d.l! : d.h!;
              const yPos = isEntry ? signalPrice * 0.98 : signalPrice * 1.02;

              let icon = "";
              let color = "";
              let label = "";

              if (entry) {
                icon = "🚀";
                color = "#FFD700"; // Gold
                label = "DivEnt";
              } else if (fakeBreak) {
                icon = "▼";
                color = "#f44336"; // Red
                label = "Fake";
              } else if (accum) {
                icon = "●";
                color = "#2196f3"; // Blue
                label = "Accum";
              } else if (weak) {
                icon = "X";
                color = "#ff9800"; // Orange
                label = "Weak";
              } else if (stop) {
                icon = "X";
                color = "#f44336"; // Red
                label = "Stop";
              }

              return (
                <ReferenceDot
                  key={`signal-${d.t}`}
                  x={d.t}
                  y={yPos}
                  r={5}
                  stroke="none"
                  shape={(props: any) => {
                    const { cx, cy } = props;
                    return (
                      <g>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={10}
                          fill={color}
                          fillOpacity={0.2}
                        />
                        <text
                          x={cx}
                          y={cy}
                          dy={5}
                          textAnchor="middle"
                          fill={color}
                          fontSize={12}
                          fontWeight="bold"
                        >
                          {icon}
                        </text>
                        <text
                          x={cx}
                          y={cy}
                          dy={22}
                          textAnchor="middle"
                          fill={color}
                          fontSize={8}
                        >
                          {label}
                        </text>
                      </g>
                    );
                  }}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>

        {/* 2. OBV Chart (20%) */}
        <ResponsiveContainer width="100%" height="20%">
          <ComposedChart
            data={chartData}
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
            syncId="obvSync"
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="#fff" />
            <XAxis dataKey="t" hide />
            <YAxis
              domain={["auto", "auto"]}
              tickFormatter={(v) => (v / 1000000).toFixed(1) + "M"}
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }}
              stroke="rgba(255,255,255,0.3)"
              label={{
                value: "OBV",
                angle: -90,
                position: "insideLeft",
                fill: "#2196f3",
              }}
            />
            <RechartsTooltip content={<ChartTooltip showSignals={false} />} />
            <Line
              dataKey="obv"
              stroke="#2196f3"
              strokeWidth={2}
              dot={false}
              name="OBV"
            />
            <Line
              dataKey="obvMa20"
              stroke="#fff"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              name="OBV MA20"
              opacity={0.5}
            />
            <Bar dataKey="obvHist" name="OBV Histogram">
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={(entry.obvHist || 0) >= 0 ? "#f44336" : "#52c41a"}
                  fillOpacity={0.3}
                />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Container>
  );
}
