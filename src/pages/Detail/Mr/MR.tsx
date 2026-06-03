import {
  Box,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useMemo, useRef } from "react";
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
import { DivergenceSignalType, UrlTaPerdOptions } from "../../../types";
import detectMacdDivergence from "../../../utils/detectMacdDivergence";
import detectRsiDivergence from "../../../utils/detectRsiDivergence";
import { calculateIndicators } from "../../../utils/indicatorUtils";
import ChartTooltip from "../Tooltip/ChartTooltip";

interface Signal {
  t: number;
  type: string;
  price: number;
}

interface MrChartData extends Partial<{
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
  overboughtZone: number | null;
  oversoldZone: number | null;
  positiveOsc: number | null;
  negativeOsc: number | null;
}

export default function MR({
  perd,
  visibleCount,
  setVisibleCount,
  rightOffset,
  setRightOffset,
}: {
  perd?: UrlTaPerdOptions;
  visibleCount: number;
  setVisibleCount: React.Dispatch<React.SetStateAction<number>>;
  rightOffset: number;
  setRightOffset: React.Dispatch<React.SetStateAction<number>>;
}) {
  const deals = useContext(DealsContext);
  const { settings } = useIndicatorSettings();

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

        // Overbought/Oversold Zones for reference
        const isOverbought = (rsiVal || 0) >= 70;
        const isOversold = (rsiVal || 0) <= 30;

        return {
          ...item,
          overboughtZone: isOverbought ? rsiVal : null,
          oversoldZone: isOversold ? rsiVal : null,
          positiveOsc: (osc || 0) > 0 ? osc : 0,
          negativeOsc: (osc || 0) < 0 ? osc : 0,
        };
      })
      .slice(
        -(visibleCount + rightOffset),
        rightOffset === 0 ? undefined : -rightOffset,
      );
  }, [deals, visibleCount, rightOffset, settings]);

  // Calculate Entry Signals (RSI Divergence + MACD Divergence + Weekly Oversold)
  const signals = useMemo(() => {
    // Helper to find price by timestamp safely
    const findPrice = (t: string | number, type: DivergenceSignalType): number | undefined => {
      const target = chartData.find((d) => String(d.t) === String(t));
      if (!target) return undefined;
      const price = type === DivergenceSignalType.BULLISH_DIVERGENCE ? target.l : target.h;
      return price ?? undefined;
    };

    // 1. Detect RSI Divergences
    const rsiDivergences = detectRsiDivergence(
      chartData.map((d) => ({
        t: d.t || 0,
        h: d.h || 0,
        l: d.l || 0,
        rsi: d.rsi,
        osc: d.osc,
      })),
    );

    const rsiResults = rsiDivergences
      .map((sig) => {
        const price = findPrice(sig.t, sig.type);
        if (price === undefined) return null;
        return {
          t: Number(sig.t),
          type: `rsi_${sig.type}`,
          price,
        };
      })
      .filter((s): s is Signal => s !== null);

    // 2. Detect MACD Divergences
    const macdDivergences = detectMacdDivergence(
      chartData.map((d) => ({
        t: d.t || 0,
        h: d.h || 0,
        l: d.l || 0,
        osc: d.osc,
      })),
    );

    const macdResults = macdDivergences
      .map((sig) => {
        const price = findPrice(sig.t, sig.type);
        if (price === undefined) return null;
        return {
          t: Number(sig.t),
          type: `macd_${sig.type}`,
          price,
        };
      })
      .filter((s): s is Signal => s !== null);

    // Merge results
    const result: Signal[] = [...rsiResults, ...macdResults];

    // 3. Weekly Oversold Signal (RSI < 25)
    for (let i = 1; i < chartData.length; i++) {
      const curr = chartData[i];
      const prev = chartData[i - 1];

      if (
        perd === UrlTaPerdOptions.Week &&
        curr.t !== undefined &&
        (curr.rsi || 100) < 25 &&
        (prev.rsi || 0) >= 25
      ) {
        result.push({ 
          t: Number(curr.t), 
          type: "oversold", 
          price: curr.l ?? 0 
        });
      }
    }
    return result.sort((a, b) => a.t - b.t);
  }, [chartData, perd]);

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
        <Typography variant="h6" component="div" color="white" sx={{ mr: 2 }}>
          MR
        </Typography>
      </Stack>

      <Box
        ref={chartContainerRef}
        sx={{ flexGrow: 1, minHeight: 0, width: "100%" }}
      >
        {/* Main Price Chart (65%) */}
        <ResponsiveContainer width="100%" height="65%">
          <ComposedChart
            data={chartData}
            syncId="mrSync"
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="t" hide />
            <YAxis domain={["auto", "auto"]} />
            <YAxis
              yAxisId="right_dummy"
              orientation="right"
              tick={false}
              axisLine={false}
              width={0}
            />
            <YAxis
              yAxisId="volAxis"
              orientation="right"
              domain={[0, (dataMax: number) => dataMax * 4]}
              tick={false}
              axisLine={false}
              width={0}
            />
            <Tooltip
              content={
                <ChartTooltip hideKeys={["overboughtZone", "oversoldZone"]} />
              }
              offset={50}
            />
            <Line
              dataKey="h"
              stroke="#fff"
              opacity={0}
              dot={false}
              activeDot={false}
              legendType="none"
              name="高"
            />
            <Line
              dataKey="c"
              stroke="#fff"
              opacity={0}
              dot={false}
              activeDot={false}
              legendType="none"
              name="收"
            />
            <Line
              dataKey="l"
              stroke="#fff"
              opacity={0}
              dot={false}
              activeDot={false}
              legendType="none"
              name="低"
            />
            <Line
              dataKey="o"
              stroke="#fff"
              opacity={0}
              dot={false}
              activeDot={false}
              legendType="none"
              name="開"
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
              stroke="rgba(33, 150, 243, 0.5)"
              strokeWidth={1.2}
              dot={false}
              activeDot={false}
              name={`${settings.boll} MA (Mid)`}
            />
            <Line
              dataKey="bollUb"
              stroke="rgba(140, 140, 140, 0.45)"
              strokeWidth={1.2}
              dot={false}
              activeDot={false}
              name="Upper Band"
            />
            <Line
              dataKey="bollLb"
              stroke="rgba(140, 140, 140, 0.45)"
              strokeWidth={1.2}
              dot={false}
              activeDot={false}
              name="Lower Band"
            />

            {/* Entry Signal Markers */}
            {(() => {
              // Group signals by timestamp to handle overlaps
              const groupedSignals: Record<string, any[]> = {};
              signals.forEach((s) => {
                const key = String(s.t);
                if (!groupedSignals[key]) groupedSignals[key] = [];
                groupedSignals[key].push(s);
              });

              return Object.entries(groupedSignals).map(([t, sigs]) => {
                const isRsiBullish = sigs.some(
                  (s) =>
                    s.type === `rsi_${DivergenceSignalType.BULLISH_DIVERGENCE}`,
                );
                const isRsiBearish = sigs.some(
                  (s) =>
                    s.type === `rsi_${DivergenceSignalType.BEARISH_DIVERGENCE}`,
                );
                const isMacdBullish = sigs.some(
                  (s) =>
                    s.type ===
                    `macd_${DivergenceSignalType.BULLISH_DIVERGENCE}`,
                );
                const isMacdBearish = sigs.some(
                  (s) =>
                    s.type ===
                    `macd_${DivergenceSignalType.BEARISH_DIVERGENCE}`,
                );
                const isOversold = sigs.some((s) => s.type === "oversold");

                const hasBullish = isRsiBullish || isMacdBullish || isOversold;

                // Resonance detection
                const isBullResonance = isRsiBullish && isMacdBullish;
                const isBearResonance = isRsiBearish && isMacdBearish;

                const firstSignal = sigs[0];
                const color = hasBullish ? "#f44336" : "#4caf50";

                return (
                  <ReferenceDot
                    key={t}
                    x={firstSignal.t}
                    y={
                      hasBullish
                        ? firstSignal.price! * 0.99
                        : firstSignal.price! * 1.01
                    }
                    r={6}
                    stroke="none"
                    shape={(props: any) => {
                      const { cx, cy } = props;
                      if (!cx || !cy) return <g />;

                      return (
                        <g>
                          {/* 1. Main Icon Shape */}
                          {isBullResonance || isBearResonance ? (
                            // Resonance: Star
                            <path
                              d={`M${cx},${cy - 8} L${cx + 2},${cy - 2} L${cx + 8},${cy - 2} L${cx + 3},${cy + 2} L${cx + 5},${cy + 8} L${cx},${cy + 4} L${cx - 5},${cy + 8} L${cx - 3},${cy + 2} L${cx - 8},${cy - 2} L${cx - 2},${cy - 2} Z`}
                              fill={color}
                              filter="drop-shadow(0 0 3px rgba(255,255,255,0.8))"
                            />
                          ) : isMacdBullish || isMacdBearish ? (
                            // MACD: Diamond
                            <path
                              d={`M${cx},${cy - 7} L${cx + 7},${cy} L${cx},${cy + 7} L${cx - 7},${cy} Z`}
                              fill={color}
                            />
                          ) : (
                            // RSI or Oversold: Triangle
                            <path
                              d={
                                hasBullish
                                  ? `M${cx - 6},${cy + 8} L${cx + 6},${cy + 8} L${cx},${cy - 2} Z`
                                  : `M${cx - 6},${cy - 8} L${cx + 6},${cy - 8} L${cx},${cy + 2} Z`
                              }
                              fill={color}
                            />
                          )}

                          {/* 2. Layered Labels */}
                          <g
                            transform={`translate(${cx}, ${hasBullish ? cy + 18 : cy - 15})`}
                          >
                            {sigs.map((s, idx) => {
                              let label = "";
                              if (s.type.startsWith("rsi_"))
                                label = s.type.includes("BULL") ? "R底" : "R頂";
                              else if (s.type.startsWith("macd_"))
                                label = s.type.includes("BULL") ? "M底" : "M頂";
                              else if (s.type === "oversold") label = "超賣";

                              if (isBullResonance && s.type.includes("BULL")) {
                                if (idx > 0) return null; // Only show one label for resonance
                                label = "強共振";
                              }
                              if (isBearResonance && s.type.includes("BEAR")) {
                                if (idx > 0) return null;
                                label = "弱共振";
                              }

                              return (
                                <text
                                  key={idx}
                                  x={0}
                                  y={hasBullish ? idx * 12 : -idx * 12}
                                  textAnchor="middle"
                                  fill={color}
                                  fontSize={10}
                                  fontWeight="bold"
                                  style={{ pointerEvents: "none" }}
                                >
                                  {label}
                                </text>
                              );
                            })}
                          </g>
                        </g>
                      );
                    }}
                  />
                );
              });
            })()}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Combined RSI & MACD Chart (35%) */}
        <ResponsiveContainer width="100%" height="35%">
          <ComposedChart
            data={chartData}
            syncId="mrSync"
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="t" hide />

            {/* Left Axis for RSI (0-100) */}
            <YAxis
              yAxisId="left"
              orientation="left"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              stroke="#888"
              fontSize={10}
            />

            {/* Right Axis for MACD Osc */}
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={([dataMin, dataMax]) => {
                const absMax = Math.max(Math.abs(dataMin), Math.abs(dataMax));
                return [-absMax, absMax];
              }}
              stroke="#888"
              fontSize={10}
              width={0}
            />

            <Tooltip
              content={
                <ChartTooltip hideKeys={["overboughtZone", "oversoldZone"]} />
              }
              offset={50}
            />

            <ReferenceLine y={0} yAxisId="right" stroke="#666" opacity={0.5} />
            <ReferenceLine
              y={50}
              yAxisId="left"
              stroke="#666"
              strokeDasharray="3 3"
              opacity={0.5}
            />
            <ReferenceLine
              y={75}
              yAxisId="left"
              stroke="#f44336"
              strokeDasharray="3 3"
              label={{ value: "Overbought", fill: "#f44336", fontSize: 10 }}
            />
            <ReferenceLine
              y={25}
              yAxisId="left"
              stroke="#4caf50"
              strokeDasharray="3 3"
              label={{ value: "Oversold", fill: "#4caf50", fontSize: 10 }}
            />

            {/* MACD Bars (Right Axis) */}
            <Bar
              yAxisId="right"
              dataKey="positiveOsc"
              fill="#f44336"
              barSize={3}
              name="Osc +"
            />
            <Bar
              yAxisId="right"
              dataKey="negativeOsc"
              fill="#4caf50"
              barSize={3}
              name="Osc -"
            />

            {/* RSI Overbought/Oversold Zones (Left Axis) */}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="overboughtZone"
              fill="#f44336"
              stroke="none"
              baseValue={70}
              opacity={0.2}
              name="Overbought Zone"
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="oversoldZone"
              fill="#4caf50"
              stroke="none"
              baseValue={30}
              opacity={0.2}
              name="Oversold Zone"
            />
            <Line
              yAxisId="left"
              dataKey="rsi"
              stroke="#2196f3"
              dot={false}
              strokeWidth={2}
              name={`RSI (${settings.rsi})`}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Container>
  );
}
