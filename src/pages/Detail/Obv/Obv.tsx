import {
  Box,
  CircularProgress,
  Container,
  Stack,
  Tooltip as MuiTooltip,
  Typography,
  Chip,
} from "@mui/material";
import { useContext, useMemo, useState, useRef, useEffect } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Customized,
  Line,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  ReferenceDot,
} from "recharts";
import obv from "../../../cls_tools/obv";
import BaseCandlestickRectangle from "../../../components/RechartCustoms/BaseCandlestickRectangle";
import { DealsContext } from "../../../context/DealsContext";
import { calculateObvSignals } from "../../../utils/obvStrategy";
import {
  calculateBollingerBands,
  calculateSMA,
} from "../../../utils/technicalIndicators";

// Helper to format YYYYMMDD number to Date string
const formatDateTick = (tick: number | string) => {
  const str = tick.toString();
  if (str.length === 8) {
    return `${str.slice(0, 4)}/${str.slice(4, 6)}/${str.slice(6)}`;
  }
  return str;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const dateStr = formatDateTick(label);

    // Sort payload: Signal entries first, then main data
    const sortedPayload = [...payload].sort((a, b) => {
      // Prioritize Scatter (Signal) entries
      if (
        a.dataKey === "longEntry" ||
        a.dataKey === "shortEntry" ||
        a.dataKey === "longExit" ||
        a.dataKey === "shortExit"
      )
        return -1;
      if (
        b.dataKey === "longEntry" ||
        b.dataKey === "shortEntry" ||
        b.dataKey === "longExit" ||
        b.dataKey === "shortExit"
      )
        return 1;
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
          }}
        >
          {dateStr}
        </p>

        {data.signalReason && (
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
          // Filter out internal/invisible items
          if (["h", "c", "l", "o"].includes(entry.dataKey)) return null;
          if (entry.value === null || entry.value === undefined) return null; // Skip null signals

          return (
            <p
              key={index}
              style={{
                color: entry.color,
                margin: "2px 0",
                fontSize: "0.875rem",
              }}
            >
              {entry.name}:{" "}
              {typeof entry.value === "number"
                ? entry.value.toFixed(2)
                : entry.value}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

export default function Obv() {
  const fullDeals = useContext(DealsContext);
  // Zoom & Pan Control
  const [visibleCount, setVisibleCount] = useState(150);
  const [rightOffset, setRightOffset] = useState(0);
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
        const minBars = 30; // Minimum bars to show
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

  // Safety Clamp: Ensure rightOffset stays valid if deals/visibleCount change
  useEffect(() => {
    const maxOffset = Math.max(0, fullDeals.length - visibleCount);
    if (rightOffset > maxOffset) {
      setRightOffset(maxOffset);
    }
  }, [fullDeals.length, visibleCount, rightOffset]);

  // Use slice instead of splice to avoid mutating the context array
  const deals = fullDeals.slice(
    -(visibleCount + rightOffset), 
    rightOffset === 0 ? undefined : -rightOffset
  );

  const signals = useMemo(() => {
    if (!deals || deals.length === 0) return [];
    return calculateObvSignals(deals);
  }, [deals]);

  const chartData = useMemo(() => {
    if (!deals || deals.length === 0) return [];
    let baseData = [];
    let obvData = obv.init(deals[0]);
    baseData.push({ ...deals[0], obv: obvData.obv });
    for (let i = 1; i < deals.length; i++) {
      obvData = obv.next(deals[i], obvData);
      baseData.push({ ...deals[i], obv: obvData.obv });
    }

    const closes = deals.map((d) => d.c);
    const ma20 = calculateSMA(closes, 20);
    const ma50 = calculateSMA(closes, 50);
    const bb20 = calculateBollingerBands(closes, 20, 2);

    const signalMap = new Map(signals.map((s) => [s.t, s]));

    return baseData.map((d, i) => {
      const signal = signalMap.get(d.t);
      return {
        ...d,
        ma20: ma20[i],
        ma50: ma50[i],
        bbUpper: bb20.upper[i],
        bbLower: bb20.lower[i],
        // Signals (kept for Tooltip but hidden from chart view via removed Scatters)
        longEntry: signal?.type === "LONG_ENTRY" ? d.l * 0.98 : null,
        shortEntry: signal?.type === "SHORT_ENTRY" ? d.h * 1.02 : null,
        longExit: signal?.type === "LONG_EXIT" ? d.h * 1.02 : null,
        shortExit: signal?.type === "SHORT_EXIT" ? d.l * 0.98 : null,
        signalReason: signal?.reason || null,
      };
    });
  }, [deals, signals]);

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
        pb: 1
        // Removed bgcolor="#f5f5f5" to allow global dark theme to show through
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
          title="On-Balance Volume (OBV) Professional Dashboard"
          arrow
        >
          <Typography variant="h6" component="h1" fontWeight="bold" color="text.primary">
            OBV 智能分析儀表板
          </Typography>
        </MuiTooltip>
        
        {/* Added Chip for consistency with MaKbar layout feeling */}
        <Chip 
            label="Volume Analysis" 
            size="small" 
            variant="outlined" 
            color="primary"
            sx={{ borderColor: 'rgba(255,255,255,0.2)' }}
        />

        <Box sx={{ flexGrow: 1 }} />
      </Stack>

      {/* Content Area */}
      <Box 
        ref={chartContainerRef}
        sx={{ flexGrow: 1, minHeight: 0, overflow: "hidden" }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="#fff" />
            <XAxis 
                dataKey="t" 
                tickFormatter={formatDateTick} 
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
                stroke="rgba(255,255,255,0.3)"
            />
            <YAxis
              orientation="left"
              domain={["auto", "auto"]}
              tickFormatter={(val) => val.toFixed(2)}
              tick={{ fill: 'rgba(255,255,255,0.7)' }}
              stroke="rgba(255,255,255,0.3)"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={["auto", "auto"]}
              tick={{ fill: 'rgba(255,255,255,0.7)' }}
              stroke="rgba(255,255,255,0.3)"
            />
            <RechartsTooltip content={<CustomTooltip />} />

            {/* Invisible lines for Tooltip payload and BaseCandlestickRectangle */}
            {/* ORDER IS CRITICAL: High, Close, Low, Open */}
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

            {/* Indicators */}
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
              strokeWidth={1}
              dot={false}
              name="BB Upper"
              opacity={0.5}
            />
            <Line
              dataKey="bbLower"
              stroke="#9e9e9e"
              strokeDasharray="3 3"
              strokeWidth={1}
              dot={false}
              name="BB Lower"
              opacity={0.5}
            />

            {/* 
                Taiwan Standard Colors:
                Up (Rising): Red (#ff4d4f)
                Down (Falling): Green (#52c41a)
            */}
            <Customized
              component={BaseCandlestickRectangle}
              upColor="#ff4d4f"
              downColor="#52c41a"
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="obv"
              stroke="#2196f3"
              strokeWidth={2}
              dot={false}
              name="OBV"
            />

            {/* Signal Markers */}
            {chartData.map((d) => {
              const isLong = d.longEntry !== null;
              const isShort = d.shortEntry !== null;
              if (!isLong && !isShort) return null;

              const signalPrice = isLong ? d.l : d.h;
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
                          // Long Entry (Red)
                          <>
                            <path
                              d={`M${cx - 5},${cy + 10} L${cx + 5},${
                                cy + 10
                              } L${cx},${cy} Z`}
                              fill={color}
                            />
                          </>
                        ) : (
                          // Short Entry (Green)
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
      </Box>
    </Container>
  );
}
