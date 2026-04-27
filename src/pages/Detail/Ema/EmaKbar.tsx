
import { Box, Chip, Typography, CircularProgress, Container, Stack } from '@mui/material';
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
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
  ZAxis,
} from "recharts";
import boll from "../../../cls_tools/boll";
import dmi from "../../../cls_tools/dmi";
import ema from "../../../cls_tools/ema";
import ma from "../../../cls_tools/ma";
import AvgCandlestickRectangle from "../../../components/RechartCustoms/AvgCandlestickRectangle";
import BaseCandlestickRectangle from "../../../components/RechartCustoms/BaseCandlestickRectangle";
import { DealsContext } from "../../../context/DealsContext";
import useIndicatorSettings from "../../../hooks/useIndicatorSettings";
import ChartTooltip from "../Tooltip/ChartTooltip";
import { calculateMarketRegime, calculateGoldenDeathSignals } from "./signalLogic";

interface AvgMaChartData extends Partial<{
  t: number | string;
  o: number | null;
  h: number | null;
  l: number | null;
  c: number | null;
  v: number | null;
}> {
  ema5: number | null;
  ema10: number | null;
  ema60: number | null;
  sma200: number | null;
  volMa20?: number | null;
  diPlus: number | null;
  diMinus: number | null;
  adx: number | null;
  mss: number;
  marketType: string;
  diagnostic: string;
  bw: number;
}

interface SignalPoint extends AvgMaChartData {
  type: "golden" | "death";
  subType: "trend" | "rebound"; // trend = with EMA60/SMA200, rebound = against them
}

export default function AvgMaKbar({
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
  const deals = useContext(DealsContext);

  // Zoom & Pan Control
  // const [visibleCount, setVisibleCount] = useState(160);
  // const [rightOffset, setRightOffset] = useState(0);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const startOffset = useRef(0);

  const [visibleMAs, setVisibleMAs] = useState({
    emaShort: true,
    emaLong: true,
    ema60: true,
    sma200: true,
  });

  const [isAvgCandle, setIsAvgCandle] = useState(true);

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

  const chartData = useMemo((): AvgMaChartData[] => {
    if (!deals || deals.length === 0) return [];

    let ema5_data = ema.init(deals[0], settings.emaShort);
    let ema10_data = ema.init(deals[0], settings.emaLong);
    let ema60_data = ema.init(deals[0], 60);
    let sma200_data = ma.init(deals[0], 200);
    let dmi_data = dmi.init(deals[0], 14);
    let boll_data = boll.init(deals[0]);

    const response: AvgMaChartData[] = [];
    const ema60Series: number[] = [];

    // Keltner Channel state for Squeeze Pro
    let prevAtr = 0;

    for (let i = 0; i < deals.length; i++) {
      const deal = deals[i];

      // EMA calc
      if (i > 0) {
        ema5_data = ema.next(deal, ema5_data, settings.emaShort);
        ema10_data = ema.next(deal, ema10_data, settings.emaLong);
        ema60_data = ema.next(deal, ema60_data, 60);
        sma200_data = ma.next(deal, sma200_data, 200);
        dmi_data = dmi.next(deal, dmi_data, 14);
        boll_data = boll.next(deal, boll_data, 20);
      }

      // Vol MA20
      let volMa20: number | null = null;
      if (i >= 19) {
        let sumV = 0;
        for (let j = 0; j < 20; j++) {
          sumV += deals[i - j].v || 0;
        }
        volMa20 = sumV / 20;
      }

      ema60Series.push(ema60_data.ema || 0);
      const regime = calculateMarketRegime(
        deal,
        i > 0 ? deals[i - 1] : null,
        i,
        prevAtr,
        boll_data,
        ema5_data.ema || 0,
        ema10_data.ema || 0,
        ema60_data.ema || 0,
        ema60Series,
        dmi_data.adx || 0,
        response[i - 1]?.adx || 0
      );
      prevAtr = regime.prevAtr;

      response.push({
        ...deal,
        ema5: ema5_data.ema || null,
        ema10: ema10_data.ema || null,
        ema60: ema60_data.ema || null,
        sma200: sma200_data.ma || null,
        volMa20,
        diPlus: dmi_data.pDi ?? null,
        diMinus: dmi_data.mDi ?? null,
        adx: dmi_data.adx ?? null,
        bw: regime.bw,
        mss: regime.mss,
        marketType: regime.marketType,
        diagnostic: regime.diagnostics.join("|")
      });
    }

    const finalData = response;

    return finalData.slice(
      -(visibleCount + rightOffset),
      rightOffset === 0 ? undefined : -rightOffset,
    );
  }, [deals, visibleCount, rightOffset]);

  const hMax = useMemo(() => {
    return chartData.length === 0
      ? 0
      : Math.max(...chartData.map((d) => d.h ?? -Infinity));
  }, [chartData]);

  const signals = useMemo((): SignalPoint[] => {
    return calculateGoldenDeathSignals(chartData) as SignalPoint[];
  }, [chartData]);


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
          EMA
        </Typography>
        <Box sx={{ flexGrow: 1, display: "flex", gap: 1.5, alignItems: "center" }}>
          {/* Market Status Badge */}
          {chartData.length > 0 && (
            <Chip
              label={`${chartData[chartData.length - 1].marketType}市 (${chartData[chartData.length - 1].mss.toFixed(1)})`}
              size="small"
              sx={{
                height: 28,
                bgcolor: chartData[chartData.length - 1].marketType === "趨勢" 
                  ? "rgba(33, 150, 243, 0.2)" 
                  : chartData[chartData.length - 1].marketType === "寬震"
                    ? "rgba(156, 39, 176, 0.2)"
                    : "rgba(255, 255, 255, 0.05)",
                color: chartData[chartData.length - 1].marketType === "趨勢" 
                  ? "#2196f3" 
                  : chartData[chartData.length - 1].marketType === "寬震"
                    ? "#ce93d8"
                    : "#aaa",
                border: `1px solid ${
                  chartData[chartData.length - 1].marketType === "趨勢" 
                    ? "#2196f3" 
                    : chartData[chartData.length - 1].marketType === "寬震"
                      ? "#9c27b0"
                      : "rgba(255, 255, 255, 0.1)"
                }`,
                fontWeight: "bold",
                borderRadius: "4px",
                mr: 2,
                "& .MuiChip-label": { px: 1 },
              }}
            />
          )}

          {/* Candlestick Type Toggle */}
          <Chip
            label={isAvgCandle ? "平均 K 線" : "標準 K 線"}
            size="small"
            onClick={() => setIsAvgCandle(!isAvgCandle)}
            variant="outlined"
            sx={{
              height: 28,
              bgcolor: isAvgCandle ? "rgba(76, 175, 80, 0.1)" : "rgba(33, 150, 243, 0.1)",
              color: isAvgCandle ? "#4caf50" : "#2196f3",
              borderColor: isAvgCandle ? "rgba(76, 175, 80, 0.4)" : "rgba(33, 150, 243, 0.4)",
              fontWeight: "bold",
              borderRadius: "4px",
              mr: 2,
              transition: "all 0.2s",
              "&:hover": {
                bgcolor: isAvgCandle ? "rgba(76, 175, 80, 0.2)" : "rgba(33, 150, 243, 0.2)",
                transform: "translateY(-1px)",
              },
              "& .MuiChip-label": { px: 1.5 },
            }}
          />

          {/* Glowing HUD EMA Toggles */}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {[
              { key: "emaShort" as const, label: `EMA${settings.emaShort}`, color: "#589bf3" },
              { key: "emaLong" as const, label: `EMA${settings.emaLong}`, color: "#ff7300" },
              { key: "ema60" as const, label: `EMA60`, color: "#9c27b0" },
              { key: "sma200" as const, label: `SMA200`, color: "#607d8b" },
            ].map((m) => {
              const isActive = visibleMAs[m.key];
              return (
                <Chip
                  key={m.key}
                  label={m.label}
                  size="small"
                  onClick={() => setVisibleMAs(prev => ({ ...prev, [m.key]: !prev[m.key] }))}
                  sx={{
                    height: 26,
                    fontSize: "0.7rem",
                    fontWeight: "700",
                    letterSpacing: "0.02em",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    border: `1px solid ${isActive ? m.color : "rgba(255,255,255,0.1)"}`,
                    bgcolor: isActive ? m.color : "rgba(0,0,0,0.2)",
                    color: isActive ? "#000" : "rgba(255,255,255,0.5)",
                    boxShadow: isActive 
                      ? `0 0 12px ${m.color}88, inset 0 0 4px rgba(255,255,255,0.5)` 
                      : "none",
                    "& .MuiChip-label": { px: 1.5 },
                    "&:hover": {
                      bgcolor: isActive ? m.color : "rgba(255,255,255,0.1)",
                      transform: "translateY(-1px)",
                      boxShadow: isActive 
                        ? `0 0 18px ${m.color}, inset 0 0 4px rgba(255,255,255,0.5)` 
                        : `0 0 8px rgba(255,255,255,0.2)`,
                      color: isActive ? "#000" : "#fff",
                    },
                    "&:active": {
                      transform: "translateY(0px) scale(0.96)",
                    }
                  }}
                />
              );
            })}
          </Stack>
        </Box>
      </Stack>


      <Box
        ref={chartContainerRef}
        sx={{ flexGrow: 1, minHeight: 0, height: "100%" }}
      >
        <ResponsiveContainer width="100%" height="75%">
          <ComposedChart
            data={chartData}
            syncId="avgSync"
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="t" hide />
            <YAxis domain={["dataMin", hMax]} dataKey="l" />
            <YAxis
              yAxisId="volAxis"
              orientation="right"
              domain={[0, (dataMax: number) => dataMax * 4]}
              tick={false}
              axisLine={false}
              width={0}
            />
            <ZAxis type="number" range={[10]} />
            <Tooltip 
              content={<ChartTooltip hideKeys={["mss", "marketType", "diagnostic", "bw"]} />} 
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

            <Customized component={isAvgCandle ? AvgCandlestickRectangle : BaseCandlestickRectangle} />

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

             {visibleMAs.emaShort && (
              <Line
                dataKey="ema5"
                stroke="#589bf3"
                dot={false}
                activeDot={false}
                strokeWidth={2}
                name={`EMA ${settings.emaShort}`}
              />
            )}
            {visibleMAs.emaLong && (
              <Line
                dataKey="ema10"
                stroke="#ff7300"
                dot={false}
                activeDot={false}
                strokeWidth={2}
                name={`EMA ${settings.emaLong}`}
              />
            )}
            {visibleMAs.ema60 && (
              <Line
                dataKey="ema60"
                stroke="#9c27b0"
                dot={false}
                activeDot={false}
                strokeWidth={1}
                strokeDasharray="5 5"
                name={`EMA 60`}
                opacity={0.8}
              />
            )}
            {visibleMAs.sma200 && (
              <Line
                dataKey="sma200"
                stroke="#607d8b"
                dot={false}
                activeDot={false}
                strokeWidth={1}
                strokeDasharray="3 3"
                name={`SMA 200`}
                opacity={0.8}
              />
            )}

            {signals.map((signal) => {
              const isGolden = signal.type === "golden";
              const isTrend = signal.subType === "trend";

              // Calculate y position
              const yPos = isGolden
                ? signal.ema5! - signal.ema5! * 0.01
                : signal.ema5! + signal.ema5! * 0.01;

              // Colors
              const color = isGolden ? "#f44336" : "#4caf50"; // Red (Up), Green (Down)

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
                        {isGolden ? (
                          // Golden Cross (Up - Red)
                          <>
                            <path
                              d={`M${cx - 6},${cy + 10} L${cx + 6},${
                                cy + 10
                              } L${cx},${cy} Z`}
                              fill={isTrend ? color : "none"}
                              stroke={color}
                              strokeWidth={2}
                            />
                            <text
                              x={cx}
                              y={cy + 22}
                              textAnchor="middle"
                              fill={color}
                              fontSize={11}
                              fontWeight="bold"
                            >
                              {isTrend ? "順勢買進" : "反彈試單"}
                            </text>
                          </>
                        ) : (
                          // Death Cross (Down - Green)
                          <>
                            <path
                              d={`M${cx - 6},${cy - 10} L${cx + 6},${
                                cy - 10
                              } L${cx},${cy} Z`}
                              fill={isTrend ? color : "none"}
                              stroke={color}
                              strokeWidth={2}
                            />
                            <text
                              x={cx}
                              y={cy - 15}
                              textAnchor="middle"
                              fill={color}
                              fontSize={11}
                              fontWeight="bold"
                            >
                              {isTrend ? "順勢放空" : "回檔調節"}
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
        <ResponsiveContainer width="100%" height="25%">
          <ComposedChart data={chartData} syncId="avgSync">
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="#fff" />
            <XAxis dataKey="t" hide />
            <YAxis
              yAxisId="dmiAxis"
              domain={[0, 60]}
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }}
              stroke="rgba(255,255,255,0.3)"
              label={{
                value: "DMI",
                angle: -90,
                position: "insideLeft",
                fill: "#999",
                fontSize: 10,
              }}
            />
            <YAxis yAxisId="statusAxis" domain={[0, 1]} hide />
            <Tooltip content={<ChartTooltip hideKeys={["mss", "marketType", "diagnostic", "bw"]} showMESS={false} showIchimoku={false} showSignals={false} />} />
            
            {/* Market Status Ribbon (Background) */}
            <Bar
              dataKey="mss"
              yAxisId="statusAxis"
              isAnimationActive={false}
              shape={(props: any) => {
                const { x, y, width, height, payload } = props;
                const { marketType, mss } = payload;
                let fill = "rgba(255,255,255,0.02)"; // Ranging (Grey)
                if (marketType === "趨勢") {
                  fill = payload.diPlus > payload.diMinus ? "rgba(33, 150, 243, 0.2)" : "rgba(244, 67, 54, 0.2)";
                } else if (marketType === "寬震") {
                  fill = "rgba(156, 39, 176, 0.12)";
                } else if (marketType === "擠壓") {
                  fill = "rgba(0, 0, 0, 0.35)"; // Deep grey for squeeze
                }
                return (
                  <rect
                    x={x}
                    y={0} // Fill from top of the DMI area
                    width={width}
                    height={300} // Sufficient height to cover area
                    fill={fill}
                  />
                );
              }}
            />

            <ReferenceLine yAxisId="dmiAxis" y={20} stroke="#666" strokeDasharray="3 3" />
            <Line
              yAxisId="dmiAxis"
              dataKey="adx"
              stroke="#ffeb3b"
              strokeWidth={2}
              dot={false}
              name="ADX"
            />
            <Line
              yAxisId="dmiAxis"
              dataKey="diPlus"
              stroke="#ff4d4f"
              strokeWidth={1}
              dot={false}
              name="DI+"
            />
            <Line
              yAxisId="dmiAxis"
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
