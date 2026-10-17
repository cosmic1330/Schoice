import { Box, CircularProgress, Container } from "@mui/material";
import { useContext, useEffect, useMemo, useRef } from "react";
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
  // Accumulation
  accumulationSignal?: number | null;
  accumulationReason?: string;
  // MACD
  macdOsc?: number | null;
  macdDif?: number | null;
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

    const enhancedData = calculateIndicators(deals, settings);

    // Map MACD fields for compatibility
    const dataWithMacd = enhancedData.map((d) => ({
      ...d,
      macdOsc: d.osc,
      macdDif: d.dif,
    }));

    const fullDataWithSignals = dataWithMacd.map((d, i, arr) => {
      let buySignal: number | null = null;
      let exitSignal: number | null = null;
      let accumulationSignal: number | null = null;
      let buyReason: string | undefined;
      let exitReason: string | undefined;
      let accumulationReason: string | undefined;

      if (i > 0) {
        const prev = arr[i - 1];
        const currMfi = d.mfi || 50;
        const prevMfi = prev.mfi || 50;

        // Buy: Oversold (<20) and Turning Up
        if (prevMfi < 20 && currMfi > prevMfi) {
          buySignal = d.l ? d.l * 0.98 : null;
          buyReason = "超賣反轉";
        }
      }

      return {
        ...d,
        buySignal,
        exitSignal,
        accumulationSignal,
        buyReason,
        exitReason,
        accumulationReason,
      };
    });

    return fullDataWithSignals.slice(
      -(visibleCount + rightOffset),
      rightOffset === 0 ? undefined : -rightOffset,
    );
  }, [deals, settings, visibleCount, rightOffset]);

  if (chartData.length === 0) {
    return (
      <Box
        height="100%"
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
        height: "100%",
        display: "flex",
        flexDirection: "column",
        pt: 1,
        px: 2,
        pb: 1,
      }}
    >
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


            {chartData.map((d) => {
              const isBuy = typeof d.buySignal === "number";
              const isExit = typeof d.exitSignal === "number";
              const isAccum = typeof d.accumulationSignal === "number";
              if (!isBuy && !isExit && !isAccum) return null;

              let yPos = 0;
              let color = "";
              let label = ""; // Optional visualization

              if (isBuy) {
                yPos = d.buySignal!;
                color = "#f44336";
                label = "Buy";
              } else if (isExit) {
                yPos = d.exitSignal!;
                color = "#4caf50";
                label = "Sell";
              } else if (isAccum) {
                yPos = d.accumulationSignal!;
                color = "#2196f3"; // Blue
                label = "Accum";
              }

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

                    let icon = "";
                    if (isBuy) icon = "▲";
                    else if (isExit) icon = "▼";
                    else if (isAccum) icon = "●";

                    return (
                      <g>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={12} // Slightly larger for visibility
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
                          dy={20}
                          textAnchor="middle"
                          fill={color}
                          fontSize={9}
                          fontWeight="bold"
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
