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
import { calculateIndicators } from "../../../utils/indicatorUtils";
import ChartTooltip from "../Tooltip/ChartTooltip";

interface CciChartData extends Partial<{
  t: number | string;
  o: number | null;
  h: number | null;
  l: number | null;
  c: number | null;
  v: number | null;
}> {
  cci: number | null;
  bollMa: number | null;
  bollUb: number | null;
  bollLb: number | null;
  cciOverbought: number | null;
  cciOversold: number | null;
}

export default function CCI({
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

  const allData = useMemo(() => {
    return calculateIndicators(deals, settings);
  }, [deals, settings]);

  const chartData = useMemo((): CciChartData[] => {
    return allData
      .map((item) => ({
        ...item,
        cciOverbought: (item.cci || 0) > 100 ? item.cci : null,
        cciOversold: (item.cci || 0) < -100 ? item.cci : null,
      }))
      .slice(
        -(visibleCount + rightOffset),
        rightOffset === 0 ? undefined : -rightOffset,
      );
  }, [allData, visibleCount, rightOffset]);

  // Calculate Signals based on CCI crossings (+100, -100)
  const signals = useMemo(() => {
    const result = [];
    const startIndex = Math.max(1, deals.length - (visibleCount + rightOffset));
    const endIndex = deals.length - rightOffset;

    for (let i = startIndex; i < endIndex; i++) {
      const curr = allData[i];
      const prev = allData[i - 1];

      if (!curr || !prev) continue;

      const cciVal = curr.cci || 0;
      const prevCciVal = prev.cci || 0;

      // 1. CCI 向上突破 +100
      if (prevCciVal < 100 && cciVal >= 100) {
        result.push({
          t: curr.t,
          type: "cci_buy",
          price: curr.l,
          text: "CCI 突破",
        });
      }
      // 2. CCI 向下跌破 -100
      else if (prevCciVal > -100 && cciVal <= -100) {
        result.push({
          t: curr.t,
          type: "cci_sell",
          price: curr.h,
          text: "CCI 跌破",
        });
      }
      // 3. CCI 從超賣區拉回 (-100 以下勾頭向上)
      else if (prevCciVal < -100 && cciVal > prevCciVal && cciVal < -80) {
        const prevPrev = i > 1 ? allData[i - 2] : null;
        const prevPrevCciVal = prevPrev ? prevPrev.cci || 0 : -100;
        if (prevCciVal < prevPrevCciVal) {
          result.push({
            t: curr.t,
            type: "cci_rebound",
            price: curr.l,
            text: "CCI 勾頭",
          });
        }
      }
    }
    return result;
  }, [allData, deals.length, visibleCount, rightOffset]);

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
          CCI
        </Typography>
      </Stack>

      <Box
        ref={chartContainerRef}
        sx={{ flexGrow: 1, minHeight: 0, width: "100%" }}
      >
        {/* Main Price Chart (60%) */}
        <ResponsiveContainer width="100%" height="60%">
          <ComposedChart
            data={chartData}
            syncId="cciSync"
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="t" hide />
            <YAxis
              domain={[
                (dataMin: number) => dataMin * 0.98,
                (dataMax: number) => dataMax * 1.02,
              ]}
              orientation="left"
              stroke="#888"
              fontSize={10}
            />
            <YAxis
              yAxisId="vol"
              orientation="right"
              domain={[0, (max: number) => max * 5]}
              hide
            />

            <Tooltip content={<ChartTooltip />} />

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

            {/* Volume */}
            <Bar
              dataKey="v"
              yAxisId="vol"
              opacity={0.1}
              shape={(props: any) => {
                const { x, y, width, height, payload } = props;
                const isUp = payload.c > payload.o;
                return (
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={isUp ? "#ff4d4f" : "#52c41a"}
                  />
                );
              }}
            />

            {/* Bollinger Bands */}
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

            {/* Signal Markers */}
            {signals.map((signal) => {
              const isBuy = signal.type.includes("buy") || signal.type.includes("rebound");
              const color = isBuy ? "#ff4d4f" : "#52c41a";
              const yPos = isBuy ? signal.price * 0.99 : signal.price * 1.01;

              return (
                <ReferenceDot
                  key={`${signal.t}-${signal.type}`}
                  x={signal.t}
                  y={yPos}
                  shape={(props: any) => {
                    const { cx, cy } = props;
                    if (!cx || !cy) return <g />;
                    return (
                      <g>
                        {isBuy ? (
                          <path
                            d={`M${cx - 6},${cy + 12} L${cx + 6},${cy + 12} L${cx},${cy} Z`}
                            fill={color}
                          />
                        ) : (
                          <path
                            d={`M${cx - 6},${cy - 12} L${cx + 6},${cy - 12} L${cx},${cy} Z`}
                            fill={color}
                          />
                        )}
                        <text
                          x={cx}
                          y={isBuy ? cy + 20 : cy - 15}
                          textAnchor="middle"
                          fill={color}
                          fontSize={11}
                          fontWeight="bold"
                        >
                          {signal.text}
                        </text>
                      </g>
                    );
                  }}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>

        {/* CCI Chart (40%) */}
        <ResponsiveContainer width="100%" height="40%">
          <ComposedChart
            data={chartData}
            syncId="cciSync"
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="t" hide />
            <YAxis domain={[-250, 250]} stroke="#888" fontSize={10} />

            <Tooltip content={<ChartTooltip />} />

            {/* Threshold Lines */}
            <ReferenceLine
              y={100}
              stroke="#ff4d4f"
              strokeDasharray="3 3"
              opacity={0.5}
              label={{
                value: "100",
                position: "right",
                fill: "#ff4d4f",
                fontSize: 10,
              }}
            />
            <ReferenceLine
              y={-100}
              stroke="#52c41a"
              strokeDasharray="3 3"
              opacity={0.5}
              label={{
                value: "-100",
                position: "right",
                fill: "#52c41a",
                fontSize: 10,
              }}
            />
            <ReferenceLine y={0} stroke="#666" opacity={0.3} />

            {/* CCI Areas */}
            <Area
              dataKey="cciOverbought"
              fill="#ff4d4f"
              stroke="none"
              opacity={0.2}
              baseValue={100}
            />
            <Area
              dataKey="cciOversold"
              fill="#52c41a"
              stroke="none"
              opacity={0.2}
              baseValue={-100}
            />

            {/* Indicators */}
            <Line
              type="monotone"
              dataKey="cci"
              stroke="#fff"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              name="CCI"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Container>
  );
}
