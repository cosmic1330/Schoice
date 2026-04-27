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
import { UrlTaPerdOptions } from "../../../types";
import { calculateIndicators } from "../../../utils/indicatorUtils";
import ChartTooltip from "../Tooltip/ChartTooltip";

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
  longZone: number | null; // For Area chart
  shortZone: number | null; // For Area chart
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
        rightOffset === 0 ? undefined : -rightOffset,
      );
  }, [deals, visibleCount, rightOffset, settings]);

  // Calculate Entry Signals (State Transition)
  const signals = useMemo(() => {
    const result = [];
    for (let i = 1; i < chartData.length; i++) {
      const curr = chartData[i];
      const prev = chartData[i - 1];

      const currLong =
        (curr.rsi || 0) > 50 && (curr.rsi || 0) < 75 && (curr.osc || 0) > 0;
      const prevLong =
        (prev.rsi || 0) > 50 && (prev.rsi || 0) < 75 && (prev.osc || 0) > 0;

      const currShort = (curr.rsi || 0) < 50 && (curr.osc || 0) < 0;
      const prevShort = (prev.rsi || 0) < 50 && (prev.osc || 0) < 0;

      if (currLong && !prevLong) {
        result.push({ t: curr.t, type: "entry_long", price: curr.c });
      } else if (currShort && !prevShort) {
        result.push({ t: curr.t, type: "entry_short", price: curr.c });
      }

      // Weekly Oversold Signal (RSI < 25)
      if (
        perd === UrlTaPerdOptions.Week &&
        (curr.rsi || 100) < 25 &&
        (prev.rsi || 0) >= 25
      ) {
        result.push({ t: curr.t, type: "oversold", price: curr.l });
      }
    }
    return result;
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
              content={<ChartTooltip hideKeys={["longZone", "shortZone"]} />}
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
              const isOversold = signal.type === "oversold";

              let color = isLong ? "#f44336" : "#4caf50";
              let label = isLong ? "買進" : "賣出";
              let yPos = isLong ? signal.price! * 0.99 : signal.price! * 1.01;

              if (isOversold) {
                color = "#2196f3";
                label = "超賣";
                yPos = signal.price! * 0.97;
              }

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
                        {isLong || isOversold ? (
                          // Long Entry or Oversold
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
                              {label}
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
                              {label}
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
              content={<ChartTooltip hideKeys={["longZone", "shortZone"]} />}
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

            {/* RSI Zones (Left Axis) */}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="longZone"
              fill="#ffcdd2"
              stroke="none"
              baseValue={50}
              opacity={0.3}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="shortZone"
              fill="#c8e6c9"
              stroke="none"
              baseValue={50}
              opacity={0.3}
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
