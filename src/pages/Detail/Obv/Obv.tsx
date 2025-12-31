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
  CartesianGrid,
  ComposedChart,
  Customized,
  Line,
  Tooltip as RechartsTooltip,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import obvTool from "../../../cls_tools/obv";
import BaseCandlestickRectangle from "../../../components/RechartCustoms/BaseCandlestickRectangle";
import { DealsContext } from "../../../context/DealsContext";
import { calculateObvSignals } from "../../../utils/obvStrategy";
import {
  calculateBollingerBands,
  calculateDMI,
  calculateSMA,
} from "../../../utils/technicalIndicators";

// Types
interface ObvChartData
  extends Partial<{
    t: number | string;
    o: number | null;
    h: number | null;
    l: number | null;
    c: number | null;
    v: number | null;
  }> {
  // Price Indicators
  ma20: number | null;
  ma50: number | null;
  bbUpper: number | null;
  bbLower: number | null;
  // OBV Indicators
  obv: number | null;
  obvMa20: number | null;
  obvOscillator: number | null;
  // DMI Indicators
  diPlus: number | null;
  diMinus: number | null;
  adx: number | null;
  // Signals
  longEntry?: number | null;
  shortEntry?: number | null;
  longExit?: number | null;
  shortExit?: number | null;
  signalReason?: string | null;
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

// Helper to format YYYYMMDD number to Date string
const formatDateTick = (tick: number | string) => {
  const str = tick.toString();
  if (str.length === 8) {
    return `${str.slice(0, 4)}/${str.slice(4, 6)}/${str.slice(6)}`;
  }
  return str;
};

const CustomTooltip = ({ active, payload, label, showSignals = true }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const dateStr = formatDateTick(label);

    // Sort payload: Signal entries first, then DMI, then OBV, then Price
    const sortedPayload = [...payload].sort((a, b) => {
      // Signals first
      const isSignalA = [
        "longEntry",
        "shortEntry",
        "longExit",
        "shortExit",
      ].includes(a.dataKey);
      const isSignalB = [
        "longEntry",
        "shortEntry",
        "longExit",
        "shortExit",
      ].includes(b.dataKey);
      if (isSignalA && !isSignalB) return -1;
      if (!isSignalA && isSignalB) return 1;
      return 0;
    });

    return (
      <div
        style={{
          backgroundColor: "rgba(20, 20, 30, 0.9)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(4px)",
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
          padding: "12px",
          textAlign: "left",
        }}
      >
        <p
          style={{
            color: "#eee",
            marginBottom: 8,
            margin: 0,
            fontWeight: "bold",
            fontSize: "0.9rem",
          }}
        >
          {dateStr}
        </p>

        {showSignals && data.signalReason && (
          <div
            style={{
              marginTop: 8,
              marginBottom: 8,
              padding: "4px 8px",
              backgroundColor: "rgba(33, 150, 243, 0.2)",
              borderRadius: 4,
              borderLeft: "4px solid #2196f3",
            }}
          >
            <Typography
              variant="body2"
              fontWeight="bold"
              color="#64b5f6"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {data.signalReason}
            </Typography>
          </div>
        )}

        {sortedPayload.map((entry: any, index: number) => {
          // Filter out internal/invisible items or secondary signal indicators
          if (["h", "l", "o", "t"].includes(entry.dataKey)) return null;
          if (entry.value === null || entry.value === undefined) return null;

          return (
            <p
              key={index}
              style={{
                color: entry.color,
                margin: "2px 0",
                fontSize: "0.8rem",
                display: "flex",
                justifyContent: "space-between",
                minWidth: "120px",
              }}
            >
              <span>{entry.name}:</span>
              <span style={{ marginLeft: "12px", fontWeight: "bold" }}>
                {typeof entry.value === "number"
                  ? entry.value.toFixed(2)
                  : entry.value}
              </span>
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

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
  const deals = useMemo(() => {
    return fullDeals.slice(
      -(visibleCount + rightOffset),
      rightOffset === 0 ? undefined : -rightOffset
    );
  }, [fullDeals, visibleCount, rightOffset]);

  const signals = useMemo(() => {
    if (!deals || deals.length === 0) return [];
    return calculateObvSignals(deals);
  }, [deals]);

  const chartData = useMemo((): ObvChartData[] => {
    if (!deals || deals.length === 0) return [];

    // Calculate Indicators
    const closes = deals.map((d) => d.c);

    // OBV
    let obvData = obvTool.init(deals[0]);
    const obvValues = [obvData.obv];
    for (let i = 1; i < deals.length; i++) {
      obvData = obvTool.next(deals[i], obvData);
      obvValues.push(obvData.obv);
    }
    const obvMa20 = calculateSMA(obvValues, 20);

    // Price MAs & BB
    const ma20 = calculateSMA(closes, 20);
    const ma50 = calculateSMA(closes, 50);
    const bb20 = calculateBollingerBands(closes, 20, 2);

    // DMI
    const { diPlus, diMinus, adx } = calculateDMI(deals, 14);

    // Map Signals
    const signalMap = new Map(signals.map((s) => [s.t, s]));

    return deals.map((d, i) => {
      const signal = signalMap.get(d.t);
      const obvVal = obvValues[i];
      const obvMa = obvMa20[i];
      const obvOsc = obvVal !== null && obvMa !== null ? obvVal - obvMa : null;

      return {
        ...d,
        ma20: ma20[i],
        ma50: ma50[i],
        bbUpper: bb20.upper[i],
        bbLower: bb20.lower[i],
        obv: obvVal,
        obvMa20: obvMa,
        obvOscillator: obvOsc,
        diPlus: diPlus[i],
        diMinus: diMinus[i],
        adx: adx[i],
        longEntry: signal?.type === "LONG_ENTRY" ? d.l * 0.98 : null,
        shortEntry: signal?.type === "SHORT_ENTRY" ? d.h * 1.02 : null,
        longExit: signal?.type === "LONG_EXIT" ? d.h * 1.02 : null,
        shortExit: signal?.type === "SHORT_EXIT" ? d.l * 0.98 : null,
        signalReason: signal?.reason || null,
      };
    });
  }, [deals, signals]);

  // --- Analysis Steps Logic ---
  const { steps, score, recommendation } = useMemo(() => {
    if (chartData.length === 0)
      return { steps: [], score: 0, recommendation: "" };

    const current = chartData[chartData.length - 1];
    const prev = chartData[chartData.length - 2] || current;

    // Helper Checks
    const isUptrend =
      (current.diPlus || 0) > (current.diMinus || 0) && (current.adx || 0) > 20;
    const isDowntrend =
      (current.diMinus || 0) > (current.diPlus || 0) && (current.adx || 0) > 20;

    const obvRising = (current.obv || 0) > (current.obvMa20 || 0);
    const priceAboveMa = (current.c || 0) > (current.ma20 || 0);
    const adxRising = (current.adx || 0) > (prev.adx || 0);

    // Score Calculation
    let totalScore = 0;

    // 1. Trend (DMI) - 30pts
    if (isUptrend) totalScore += 30;
    else if (isDowntrend) totalScore -= 10;

    // 2. Volume (OBV) - 30pts
    if (obvRising) totalScore += 30;
    else if ((current.obv || 0) > (prev.obv || 0)) totalScore += 10;

    // 3. Price Action - 20pts
    if (priceAboveMa) totalScore += 20;

    // 4. Momentum (ADX Rising) - 20pts
    if (adxRising && (current.adx || 0) > 20) totalScore += 20;

    if (totalScore < 0) totalScore = 0;

    let rec = "Neutral";
    if (totalScore >= 80) rec = "Strong Buy";
    else if (totalScore >= 60) rec = "Buy";
    else if (totalScore <= 30) rec = "Sell";

    const analysisSteps: AnalysisStep[] = [
      {
        label: "I. 趨勢強度 (DMI)",
        description: "ADX 與 DI 方向",
        checks: [
          {
            label: `ADX 強度 (>20): ${(current.adx || 0).toFixed(1)}`,
            status: (current.adx || 0) > 20 ? "pass" : "fail",
          },
          {
            label: "多頭趨勢 (DI+ > DI-)",
            status:
              (current.diPlus || 0) > (current.diMinus || 0) ? "pass" : "fail",
          },
          {
            label: "動能增強 (ADX Rising)",
            status: adxRising ? "pass" : "manual",
          },
        ],
      },
      {
        label: "II. 量能分析 (OBV)",
        description: "OBV 趨勢確認",
        checks: [
          {
            label: "OBV > MA20",
            status: obvRising ? "pass" : "fail",
          },
          {
            label: "OBV 創新高",
            status: "manual", // Hard to check purely on last bar without lookback context here
          },
        ],
      },
      {
        label: "III. 綜合訊號",
        description: `得分: ${totalScore} - ${rec}`,
        checks: [
          {
            label: "價格 > MA20",
            status: priceAboveMa ? "pass" : "fail",
          },
          {
            label: "與前日相比走勢一致",
            status:
              (current.c || 0) > (prev.c || 0) ===
              (current.obv || 0) > (prev.obv || 0)
                ? "pass"
                : "fail",
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
            OBV.DMI
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
        }}
      >
        {/* 1. Price Chart (50%) */}
        <ResponsiveContainer width="100%" height="50%">
          <ComposedChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            syncId="obvSync"
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="#fff" />
            <XAxis dataKey="t" hide />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "rgba(255,255,255,0.7)" }}
              stroke="rgba(255,255,255,0.3)"
            />

            <RechartsTooltip content={<CustomTooltip showSignals={true} />} />

            <Line
              dataKey="h"
              stroke="#fff"
              opacity={0}
              dot={false}
              legendType="none"
            />
            <Line
              dataKey="c"
              stroke="#fff"
              opacity={0}
              dot={false}
              legendType="none"
            />
            <Line
              dataKey="l"
              stroke="#fff"
              opacity={0}
              dot={false}
              legendType="none"
            />
            <Line
              dataKey="o"
              stroke="#fff"
              opacity={0}
              dot={false}
              legendType="none"
            />

            {/* Price Indicators */}
            <Line
              dataKey="ma20"
              stroke="#f1af20ff"
              strokeWidth={1}
              dot={false}
              name="MA20"
            />
            <Line
              dataKey="ma50"
              stroke="#9c27b0"
              strokeWidth={1}
              dot={false}
              name="MA50"
            />
            <Line
              dataKey="bbUpper"
              stroke="#9e9e9e"
              strokeDasharray="3 3"
              dot={false}
              name="BB Up"
              opacity={0.5}
            />
            <Line
              dataKey="bbLower"
              stroke="#9e9e9e"
              strokeDasharray="3 3"
              dot={false}
              name="BB Low"
              opacity={0.5}
            />

            <Customized
              component={BaseCandlestickRectangle}
              upColor="#ff4d4f"
              downColor="#52c41a"
            />

            {/* Signal Markers */}
            {chartData.map((d) => {
              const isLong = d.longEntry !== null;
              const isShort = d.shortEntry !== null;
              if (!isLong && !isShort) return null;

              const signalPrice = isLong ? d.l! : d.h!;
              const yPos = isLong ? signalPrice * 0.99 : signalPrice * 1.01;
              const color = isLong ? "#f44336" : "#4caf50";

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
                        {isLong ? (
                          <path
                            d={`M${cx - 5},${cy + 10} L${cx + 5},${
                              cy + 10
                            } L${cx},${cy} Z`}
                            fill={color}
                          />
                        ) : (
                          <path
                            d={`M${cx - 5},${cy - 10} L${cx + 5},${
                              cy - 10
                            } L${cx},${cy} Z`}
                            fill={color}
                          />
                        )}
                      </g>
                    );
                  }}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>

        {/* 2. OBV Chart (25%) */}
        <ResponsiveContainer width="100%" height="25%">
          <ComposedChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
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
            <RechartsTooltip content={<CustomTooltip showSignals={false} />} />
            <Line
              dataKey="obv"
              stroke="#2196f3"
              strokeWidth={2}
              dot={false}
              name="OBV"
            />
            <Line
              dataKey="obvMa20"
              stroke="#ffeb3b"
              strokeWidth={1}
              dot={false}
              name="OBV MA20"
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* 3. DMI Chart (25%) */}
        <ResponsiveContainer width="100%" height="25%">
          <ComposedChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            syncId="obvSync"
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="#fff" />
            <XAxis
              dataKey="t"
              tickFormatter={formatDateTick}
              tick={{ fill: "rgba(255,255,255,0.7)" }}
              stroke="rgba(255,255,255,0.3)"
            />
            {/* Primary Left Axis: DMI (0-60) */}
            <YAxis
              domain={[0, 60]}
              tick={{ fill: "rgba(255,255,255,0.7)" }}
              stroke="rgba(255,255,255,0.3)"
              label={{
                value: "DMI",
                angle: -90,
                position: "insideLeft",
                fill: "#999",
              }}
            />

            <RechartsTooltip content={<CustomTooltip showSignals={false} />} />

            <ReferenceLine y={20} stroke="#666" strokeDasharray="3 3" />

            {/* DMI Lines (Foreground) */}
            <Line
              dataKey="adx"
              stroke="#ffeb3b"
              strokeWidth={2}
              dot={false}
              name="ADX"
            />
            <Line
              dataKey="diPlus"
              stroke="#ff4d4f"
              strokeWidth={1}
              dot={false}
              name="DI+"
            />
            <Line
              dataKey="diMinus"
              stroke="#52c41a"
              strokeWidth={1}
              dot={false}
              name="DI-"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Container>
  );
}
