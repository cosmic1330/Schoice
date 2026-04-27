import {
  Box,
  CircularProgress,
  Container,
  Stack,
  Typography,
  Tooltip as MuiTooltip,
} from "@mui/material";
import { useContext, useEffect, useMemo, useRef } from "react";
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
import BaseCandlestickRectangle from "../../../components/RechartCustoms/BaseCandlestickRectangle";
import { DealsContext } from "../../../context/DealsContext";
import useIndicatorSettings from "../../../hooks/useIndicatorSettings";
import { calculateIndicators } from "../../../utils/indicatorUtils";
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
  osc: number | null;
  dif: number | null;
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
  const { settings } = useIndicatorSettings();
  const fullDeals = useContext(DealsContext);

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

    const enhancedData = calculateIndicators(fullDeals, settings);

    // Map Signals
    const signalMap = new Map(signals.map((s) => [s.t, s]));

    const allData = enhancedData.map((d) => {
      const signal = signalMap.get(d.t);

      return {
        ...d,
        obvDivergenceEntry:
          signal?.type === "OBV_DIVERGENCE_ENTRY" ? d.l * 0.99 : null,
        fakeBreakout: signal?.type === "FAKE_BREAKOUT" ? d.h * 1.02 : null,
        accumulation: signal?.type === "ACCUMULATION" ? d.l * 0.98 : null,
        exitWeakness: signal?.type === "EXIT_WEAKNESS" ? d.l * 0.98 : null,
        stopLoss: (signal as any)?.type === "STOP_LOSS" ? d.h * 1.02 : null,
        signalReason: signal?.reason || null,
        obvHist: d.obv !== null && d.obvMa20 !== null ? d.obv - d.obvMa20 : null,
      } as ObvChartData;
    });

    return allData.slice(
      -(visibleCount + rightOffset),
      rightOffset === 0 ? undefined : -rightOffset,
    );
  }, [fullDeals, signals, visibleCount, rightOffset, settings]);

  // --- Analysis Steps Logic ---

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
                OBV 指標說明
              </Typography>
              <Typography variant="caption" display="block">
                量行價先，OBV上升代表資金進場。
              </Typography>
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
      </Stack>


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
