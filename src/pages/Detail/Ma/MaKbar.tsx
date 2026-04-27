import { dateFormat } from "@ch20026103/anysis";
import { Mode } from "@ch20026103/anysis/dist/esm/stockSkills/utils/dateFormat";
import {
  Box,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
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
} from "recharts";
import BaseCandlestickRectangle from "../../../components/RechartCustoms/BaseCandlestickRectangle";
import { DealsContext } from "../../../context/DealsContext";
import { useGapDetection } from "../../../hooks/useGapDetection";
import { useGapVisualization } from "../../../hooks/useGapVisualization";
import useIndicatorSettings from "../../../hooks/useIndicatorSettings";
import { UrlTaPerdOptions } from "../../../types";
import { calculateIndicators } from "../../../utils/indicatorUtils";


export default function MaKbar({
  perd,
  visibleCount,
  setVisibleCount,
  rightOffset,
  setRightOffset,
}: {
  perd: UrlTaPerdOptions;
  visibleCount: number;
  setVisibleCount: React.Dispatch<React.SetStateAction<number>>;
  rightOffset: number;
  setRightOffset: React.Dispatch<React.SetStateAction<number>>;
}) {
  const { settings } = useIndicatorSettings();
  const deals = useContext(DealsContext);

  // Zoom & Pan Control
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const startOffset = useRef(0);

  // --- States ---
  const [showGaps, setShowGaps] = useState(true);
  const [showOnlyUnfilled, setShowOnlyUnfilled] = useState(false);
  const [hoveredGapDate, setHoveredGapDate] = useState<
    number | string | undefined
  >(undefined);
  const [showDeductions, setShowDeductions] = useState(false);
  const [visibleMAs, setVisibleMAs] = useState({
    ma5: true,
    ma10: true,
    ma20: true,
    ma60: true,
    ma120: true,
    ma240: true,
  });

  // Re-calculate indicators based on custom settings
  const chartData = useMemo(() => {
    return calculateIndicators(deals, settings);
  }, [deals, settings]);


  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const delta = Math.sign(e.deltaY);
      const step = 4; // Sensitivity

      setVisibleCount((prev) => {
        const next = prev + delta * step;
        const minBars = 30;
        const maxBars = chartData.length > 0 ? chartData.length : 1000;

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
        const maxOffset = Math.max(0, chartData.length - visibleCount);
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
  }, [chartData.length, visibleCount, rightOffset]);

  // Apply slice to chartData for rendering
  const slicedChartData = useMemo(() => {
    const end = rightOffset === 0 ? undefined : -rightOffset;
    const start = -(visibleCount + rightOffset);
    return chartData.slice(start, end);
  }, [chartData, visibleCount, rightOffset]);

  // Gap Detection
  const { gapsWithFillStatus, unfilledGaps } = useGapDetection(
    slicedChartData,
    0.7,
  );

  // Gap Visualization Data
  const { gapLines, enhancedChartData } = useGapVisualization({
    gaps: showOnlyUnfilled ? unfilledGaps : gapsWithFillStatus,
    chartData: slicedChartData,
    isVisible: showGaps,
    highlightedGapDate: hoveredGapDate,
  });

  // Signal Calculation (Historical)
  const signals = useMemo(() => {
    const result: {
      t: number | string;
      type: "buy" | "sell";
      price: number;
      reason: string;
    }[] = [];
    if (enhancedChartData.length < 2) return result;

    for (let i = 1; i < enhancedChartData.length; i++) {
      const current = enhancedChartData[i];
      const prev = enhancedChartData[i - 1];

      // Ensure we have values
      if (
        typeof current.ma5 !== "number" ||
        typeof current.ma20 !== "number" ||
        typeof prev.ma5 !== "number" ||
        typeof prev.ma20 !== "number"
      ) {
        continue;
      }

      // Golden Cross (Buy)
      if (prev.ma5 <= prev.ma20 && current.ma5 > current.ma20) {
        result.push({
          t: current.t!,
          type: "buy",
          price: current.l!,
          reason: "均線金叉",
        });
      }
      // Death Cross (Sell)
      else if (prev.ma5 >= prev.ma20 && current.ma5 < current.ma20) {
        result.push({
          t: current.t!,
          type: "sell",
          price: current.h!,
          reason: "均線死叉",
        });
      }
    }
    return result;
  }, [enhancedChartData]);

  // Current Deduction Points (based on latest bar)
  const deductionPoints = useMemo(() => {
    if (enhancedChartData.length === 0 || !showDeductions) return [];
    const latest = enhancedChartData[enhancedChartData.length - 1];
    const points: {
      t: number | string;
      price: number;
      label: string;
      color: string;
    }[] = [];

    const maConfigs = [
      {
        key: "ma5",
        deductionKey: "deduction5",
        color: "#2196f3",
        label: `MA${settings.ma5}扣抵`,
      },
      {
        key: "ma10",
        deductionKey: "deduction10",
        color: "#ffeb3b",
        label: `MA${settings.ma10}扣抵`,
      },
      {
        key: "ma20",
        deductionKey: "deduction20",
        color: "#ff9800",
        label: `MA${settings.ma20}扣抵`,
      },
      {
        key: "ma60",
        deductionKey: "deduction60",
        color: "#f44336",
        label: `MA${settings.ma60}扣抵`,
      },
      {
        key: "ma120",
        deductionKey: "deduction120",
        color: "#4caf50",
        label: `MA${settings.ma120}扣抵`,
      },
      {
        key: "ma240",
        deductionKey: "deduction240",
        color: "#cc00ff",
        label: `MA${settings.ma240}扣抵`,
      },
    ];

    maConfigs.forEach((config) => {
      if (
        visibleMAs[config.key as keyof typeof visibleMAs] &&
        (latest as any)[config.deductionKey]
      ) {
        const t = (latest as any)[config.deductionKey];
        // Find price in full chartData
        const target = chartData.find((d) => d.t === t);
        if (target) {
          points.push({
            t,
            price: target.c,
            label: config.label,
            color: config.color,
          });
        }
      }
    });

    return points;
  }, [enhancedChartData, visibleMAs, showDeductions, chartData, settings]);


  // 自定義 Tooltip 組件來處理 hover 事件
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // 檢查當前 hover 的位置是否有缺口
      const currentGaps = (
        showOnlyUnfilled ? unfilledGaps : gapsWithFillStatus
      ).filter((gap) => gap.date === label);

      if (currentGaps.length > 0) {
        // 如果有缺口，設置高亮
        if (hoveredGapDate !== label) {
          setHoveredGapDate(label);
        }
      } else {
        // 如果沒有缺口，清除高亮
        if (hoveredGapDate !== undefined) {
          setHoveredGapDate(undefined);
        }
      }

      return (
        <div
          style={{
            backgroundColor: "#222",
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #444",
            fontSize: "12px",
            lineHeight: 1,
          }}
        >
          <p style={{ color: "#eee", margin: "0 0 5px 0" }}>
            {perd === UrlTaPerdOptions.Hour
              ? label
              : dateFormat(label, Mode.NumberToString)}
          </p>
          {payload.map((entry: any, index: number) => {
            if (entry.name && entry.name.includes("gap")) return null;
            return (
              <p key={index} style={{ color: entry.color, margin: 0 }}>
                {entry.name}:{" "}
                {typeof entry.value === "number"
                  ? entry.value.toFixed(2)
                  : entry.value}
              </p>
            );
          })}
          {currentGaps.length > 0 && (
            <div
              style={{
                marginTop: 8,
                borderTop: "1px solid #555",
                paddingTop: 4,
              }}
            >
              {currentGaps.map((g) => (
                <div key={g.date} style={{ marginTop: 4 }}>
                  <p
                    style={{
                      color: g.type === "up" ? "#ff5252" : "#69f0ae",
                      margin: 0,
                      fontWeight: "bold",
                    }}
                  >
                    {g.type === "up" ? "支撐缺口" : "壓力缺口"} (
                    {g.size.toFixed(2)}, {g.sizePercent.toFixed(1)}%)
                  </p>
                  <p style={{ color: "#eee", margin: 0 }}>
                    缺口上緣: {g.high.toFixed(2)}
                  </p>
                  <p style={{ color: "#eee", margin: 0 }}>
                    缺口下緣: {g.low.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    // 當沒有 hover 時清除高亮
    if (hoveredGapDate !== undefined) {
      setHoveredGapDate(undefined);
    }
    return null;
  };

  if (enhancedChartData.length === 0) {
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
          MA
        </Typography>

        <Box sx={{ flexGrow: 1, display: "flex", gap: 1.5, alignItems: "center" }}>
          {/* Glowing HUD MA Toggles */}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {[
              { key: "ma5" as const, label: `${settings.ma5}`, color: "#2196f3" },
              { key: "ma10" as const, label: `${settings.ma10}`, color: "#ffeb3b" },
              { key: "ma20" as const, label: `${settings.ma20}`, color: "#ff9800" },
              { key: "ma60" as const, label: `${settings.ma60}`, color: "#f44336" },
              { key: "ma120" as const, label: `${settings.ma120}`, color: "#4caf50" },
              { key: "ma240" as const, label: `${settings.ma240}`, color: "#9c27b0" },
            ].map((m) => {
              const isActive = visibleMAs[m.key];
              return (
                <Chip
                  key={m.key}
                  label={`MA${m.label}`}
                  size="small"
                  onClick={() => setVisibleMAs(prev => ({ ...prev, [m.key]: !prev[m.key] }))}
                  sx={{
                    height: 26,
                    fontSize: "0.7rem",
                    fontWeight: "700",
                    letterSpacing: "0.02em",
                    borderRadius: "6px",
                    cursor: "pointer",
                    position: "relative",
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

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, alignSelf: "center", borderColor: "rgba(255,255,255,0.1)" }} />

          {/* Unified Glassmorphism Control Panel */}
          <Box sx={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 2, 
            px: 2, 
            py: 0.5,
            borderRadius: "10px",
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            boxShadow: "inset 0 0 20px rgba(0,0,0,0.2)"
          }}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={showGaps}
                  onChange={(e) => setShowGaps(e.target.checked)}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": { color: "#2196f3" },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#2196f3" }
                  }}
                />
              }
              label={<Typography variant="caption" sx={{ color: showGaps ? "#fff" : "#888", fontWeight: showGaps ? 600 : 400 }}>缺口</Typography>}
              sx={{ m: 0 }}
            />
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={showOnlyUnfilled}
                  onChange={(e) => setShowOnlyUnfilled(e.target.checked)}
                  disabled={!showGaps}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": { color: "#ff9800" },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#ff9800" }
                  }}
                />
              }
              label={<Typography variant="caption" sx={{ color: showOnlyUnfilled ? "#fff" : "#888", fontWeight: showOnlyUnfilled ? 600 : 400 }}>僅未補</Typography>}
              sx={{ m: 0 }}
            />
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={showDeductions}
                  onChange={(e) => setShowDeductions(e.target.checked)}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": { color: "#4caf50" },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#4caf50" }
                  }}
                />
              }
              label={<Typography variant="caption" sx={{ color: showDeductions ? "#fff" : "#888", fontWeight: showDeductions ? 600 : 400 }}>扣抵</Typography>}
              sx={{ m: 0 }}
            />
          </Box>
        </Box>
      </Stack>

      {/* Combined Chart: Price (Main) + Volume (Overlay at bottom) */}
      <Box
        ref={chartContainerRef}
        sx={{ flexGrow: 1, minHeight: 0, width: "100%" }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={enhancedChartData}
            syncId="maSync"
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="t" hide />

            {/* Main Price Axis (Left) */}
            <YAxis domain={["auto", "auto"]} />

            {/* Volume Axis (Right, Hidden or Low-profile, Scaled to push bars down) */}
            <YAxis
              yAxisId="volAxis"
              orientation="right"
              domain={[0, (dataMax: number) => dataMax * 4]}
              width={0}
              tick={false}
              axisLine={false}
            />

            <Tooltip content={<CustomTooltip />} offset={50} />

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

            {visibleMAs.ma5 && (
              <Line
                dataKey="ma5"
                stroke="#2196f3"
                dot={false}
                activeDot={false}
                name={`MA${settings.ma5}`}
                strokeWidth={1.5}
              />
            )}
            {visibleMAs.ma10 && (
              <Line
                dataKey="ma10"
                stroke="#ffeb3b"
                dot={false}
                activeDot={false}
                name={`MA${settings.ma10}`}
                strokeWidth={1.5}
              />
            )}
            {visibleMAs.ma20 && (
              <Line
                dataKey="ma20"
                stroke="#ff9800"
                dot={false}
                activeDot={false}
                name={`MA${settings.ma20}`}
                strokeWidth={2}
              />
            )}
            {visibleMAs.ma60 && (
              <Line
                dataKey="ma60"
                stroke="#f44336"
                dot={false}
                activeDot={false}
                name={`MA${settings.ma60}`}
                strokeWidth={1.5}
              />
            )}
            {visibleMAs.ma120 && (
              <Line
                dataKey="ma120"
                stroke="#4caf50"
                dot={false}
                activeDot={false}
                name={`MA${settings.ma120}`}
                strokeWidth={1.5}
              />
            )}
            {visibleMAs.ma240 && (
              <Line
                dataKey="ma240"
                stroke="#9c27b0"
                dot={false}
                activeDot={false}
                name={`MA${settings.ma240}`}
                strokeWidth={1.5}
              />
            )}

            {/* Signal Markers */}
            {signals.map((signal) => {
              const isLong = signal.type === "buy";
              const yPos = isLong ? signal.price! * 0.99 : signal.price! * 1.01;
              const color = isLong ? "#f44336" : "#4caf50";

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
                        {isLong ? (
                          // Long Entry
                          <>
                            <path
                              d={`M${cx - 5},${cy + 10} L${cx + 5},${
                                cy + 10
                              } L${cx},${cy} Z`}
                              fill={color}
                            />
                            <text
                              x={cx}
                              y={cy + 25}
                              textAnchor="middle"
                              fill={color}
                              fontSize={10}
                            >
                              {signal.reason}
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
                              fontSize={10}
                            >
                              {signal.reason}
                            </text>
                          </>
                        )}
                      </g>
                    );
                  }}
                />
              );
            })}

            {/* Gap Visualization */}
            {showGaps &&
              gapLines
                .map((gap) => [
                  <Line
                    key={`gap-upper-${gap.date}`}
                    dataKey={`gap_upper_${gap.date}`}
                    stroke={gap.upperLine.stroke}
                    strokeWidth={gap.upperLine.strokeWidth}
                    strokeDasharray={gap.upperLine.strokeDasharray}
                    opacity={gap.upperLine.opacity}
                    dot={false}
                    activeDot={false}
                    legendType="none"
                  />,
                  <Line
                    key={`gap-lower-${gap.date}`}
                    dataKey={`gap_lower_${gap.date}`}
                    stroke={gap.lowerLine.stroke}
                    strokeWidth={gap.lowerLine.strokeWidth}
                    strokeDasharray={gap.lowerLine.strokeDasharray}
                    opacity={gap.lowerLine.opacity}
                    dot={false}
                    activeDot={false}
                    legendType="none"
                  />,
                ])
                .flat()}

            {/* Deduction Markers */}
            {showDeductions &&
              deductionPoints.map((p) => {
                const maPeriod = p.label.match(/\d+/)?.[0] || "";
                return (
                  <ReferenceLine
                    key={`${p.label}-${p.t}`}
                    x={p.t}
                    stroke={p.color}
                    strokeDasharray="3 3"
                    opacity={0.4}
                    isFront={false}
                    label={(props: any) => {
                      const { viewBox } = props;
                      if (!viewBox) return <g />;
                      const { x } = viewBox;
                      return (
                        <g>
                          <rect
                            x={x - 12}
                            y={5}
                            width={24}
                            height={18}
                            fill="#1a1a1a"
                            rx={4}
                            stroke={p.color}
                            strokeWidth={1}
                            opacity={0.8}
                          />
                          <text
                            x={x}
                            y={18}
                            textAnchor="middle"
                            fill={p.color}
                            fontSize={10}
                            fontWeight="bold"
                          >
                            {maPeriod}
                          </text>
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
