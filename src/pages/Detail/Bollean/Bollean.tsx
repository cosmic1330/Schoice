import { dateFormat } from "@ch20026103/anysis";
import { Mode } from "@ch20026103/anysis/dist/esm/stockSkills/utils/dateFormat";
import SettingsIcon from "@mui/icons-material/Settings";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Menu,
  Tooltip as MuiTooltip,
  Slider,
  Stack,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Customized,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import BaseCandlestickRectangle from "../../../components/RechartCustoms/BaseCandlestickRectangle";
import { DealsContext } from "../../../context/DealsContext";
import { useGapDetection } from "../../../hooks/useGapDetection";
import useIndicatorSettings from "../../../hooks/useIndicatorSettings";
import { UrlTaPerdOptions } from "../../../types";
import { calculateIndicators } from "../../../utils/indicatorUtils";
import Fundamental from "../Tooltip/Fundamental";

interface BolleanChartData extends Partial<{
  t: number | string;
  o: number | null;
  h: number | null;
  l: number | null;
  c: number | null;
  v: number | null;
}> {
  bollUb: number | null;
  bollMa: number | null;
  bollLb: number | null;
  bandWidth?: number | null;
  buySignal?: number | null;
  exitSignal?: number | null;
  buyReason?: string;
  ema200?: number | null;
  rsi?: number | null;
}

const BuyArrow = (props: any) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  return (
    <g>
      <path
        d={`M${cx},${cy + 10} L${cx - 6},${cy + 20} L${cx + 6},${cy + 20} Z`}
        fill="#f44336"
        stroke="#c62828"
      />
      {payload.buyReason && (
        <text
          x={cx}
          y={cy + 35}
          textAnchor="middle"
          fill="#f44336"
          fontSize="10px"
        >
          {payload.buyReason}
        </text>
      )}
    </g>
  );
};

const ExitArrow = (props: any) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  return (
    <g>
      <path
        d={`M${cx},${cy - 10} L${cx - 6},${cy - 20} L${cx + 6},${cy - 20} Z`}
        fill="#4caf50"
        stroke="#2e7d32"
      />
      {payload.exitReason && (
        <text
          x={cx}
          y={cy - 30}
          textAnchor="middle"
          fill="#4caf50"
          fontSize="10px"
        >
          {payload.exitReason}
        </text>
      )}
    </g>
  );
};

export default function Bollean({
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
  const { settings, updateSetting, resetSettings } = useIndicatorSettings();
  const deals = useContext(DealsContext);
  const [showGaps, setShowGaps] = useState(true);
  const [showOnlyUnfilled, setShowOnlyUnfilled] = useState(true);
  const [hoveredGapDate, setHoveredGapDate] = useState<
    number | string | undefined
  >(undefined);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenSettings = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };
  const handleCloseSettings = () => {
    setSettingsAnchorEl(null);
  };

  const { id } = useParams();

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

  const allPointsWithIndicators = useMemo((): BolleanChartData[] => {
    if (!deals || deals.length === 0) return [];
    const baseData = calculateIndicators(deals, settings);
    const isNum = (n: any): n is number => typeof n === "number";

    return baseData.map((d, i) => {
      if (i < settings.boll) return d as BolleanChartData;
      const prev = baseData[i - 1];
      const price = d.c;
      const ub = d.bollUb;
      const lb = d.bollLb;
      const ma = d.bollMa;

      if (!isNum(price) || ub === null || lb === null || ma === null) {
        return d as BolleanChartData;
      }

      const rsi = d.rsi || 0;
      const ema200 = d.ema200 || 0;
      const prevClose = prev.c || 0;
      const prevLb = prev.bollLb || 0;
      const prevUb = prev.bollUb || 0;

      const crossoverLower = prevClose <= prevLb && price > lb;
      const buySignalTrigger = crossoverLower && rsi > 35 && price > ema200;

      const crossunderUpper = prevClose >= prevUb && price < ub;
      const sellSignalTrigger = crossunderUpper && rsi < 65;

      let buySignal: number | null = null;
      let exitSignal: number | null = null;
      let buyReason: string | undefined;
      let exitReason: string | undefined;

      if (buySignalTrigger) {
        buySignal = (d.l || 0) * 0.98;
        buyReason = "買";
      }

      if (sellSignalTrigger) {
        exitSignal = (d.h || 0) * 1.02;
        exitReason = "賣";
      }

      return {
        ...d,
        buySignal,
        exitSignal,
        buyReason,
        exitReason,
      } as BolleanChartData;
    });
  }, [deals, settings]);

  const chartData = useMemo(() => {
    return allPointsWithIndicators.slice(
      -(visibleCount + rightOffset),
      rightOffset === 0 ? undefined : -rightOffset,
    );
  }, [allPointsWithIndicators, visibleCount, rightOffset]);

  // Gap Detection
  const { gapsWithFillStatus, unfilledGaps } = useGapDetection(
    chartData as any,
    0.7,
  );

  const yDomain = useMemo(() => {
    if (chartData.length === 0) return ["auto", "auto"];

    let min = Infinity;
    let max = -Infinity;

    chartData.forEach((d: any) => {
      // Include Price
      if (d.h != null && d.h > max) max = d.h;
      if (d.l != null && d.l < min) min = d.l;

      // Include Bollinger Bands
      if (d.bollUb != null && d.bollUb > max) max = d.bollUb;
      if (d.bollLb != null && d.bollLb < min) min = d.bollLb;
    });

    if (min === Infinity || max === -Infinity) return ["auto", "auto"];

    const range = max - min;
    const padding = range * 0.05; // 5% padding
    return [min - padding, max + padding];
  }, [chartData]);



  // 自定義 Tooltip 組件來處理 hover 事件與缺口顯示
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
            lineHeight: 1.4,
          }}
        >
          <p style={{ color: "#eee", margin: "0 0 5px 0" }}>
            {perd === UrlTaPerdOptions.Hour
              ? label
              : dateFormat(label, Mode.NumberToString)}
          </p>
          {payload.map((entry: any, index: number) => {
            if (entry.name && entry.name.includes("gap")) return null;
            // Filter out internal hidden keys
            const hideKeys = ["buySignal", "exitSignal", "supertrend", "trailStop", "direction"];
            if (hideKeys.includes(entry.dataKey)) return null;
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



  const maDeductionPoints = useMemo(() => {
    if (chartData.length === 0) return [];
    const latest = chartData[chartData.length - 1];
    const points: {
      t: number | string;
      price: number;
      label: string;
      color: string;
      period: number;
    }[] = [];

    const maConfigs = [
      { key: "deduction5", color: "#2196f3", period: settings.ma5 },
      { key: "deduction10", color: "#ffeb3b", period: settings.ma10 },
      { key: "deduction20", color: "#ff9800", period: settings.ma20 },
      { key: "deduction60", color: "#f44336", period: settings.ma60 },
      { key: "deduction120", color: "#4caf50", period: settings.ma120 },
      { key: "deduction240", color: "#cc00ff", period: settings.ma240 },
    ];

    maConfigs.forEach((config) => {
      const t = (latest as any)[config.key];
      if (t) {
        const fullData = calculateIndicators(deals, settings);
        const target = fullData.find((d) => d.t === t);
        if (target) {
          points.push({
            t,
            price: target.c,
            label: `MA${config.period}扣抵`,
            color: config.color,
            period: config.period,
          });
        }
      }
    });

    return points;
  }, [chartData, deals, settings]);

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
        <MuiTooltip title={<Fundamental id={id} />} arrow>
          <Typography variant="h6" component="div" color="white" sx={{ mr: 2 }}>
            Bolling ({settings.boll})
          </Typography>
        </MuiTooltip>

        <IconButton size="small" onClick={handleOpenSettings} color="primary" sx={{ mr: 1 }}>
          <SettingsIcon fontSize="small" />
        </IconButton>

        <Box
          sx={{ flexGrow: 1, display: "flex", gap: 2, alignItems: "center" }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              icon={
                showGaps ? (
                  <VisibilityIcon fontSize="small" />
                ) : (
                  <VisibilityOffIcon fontSize="small" />
                )
              }
              label="顯示缺口"
              size="small"
              onClick={() => setShowGaps(!showGaps)}
              variant={showGaps ? "filled" : "outlined"}
              color={showGaps ? "primary" : "default"}
              sx={{
                height: 24,
                fontSize: "0.75rem",
                fontWeight: showGaps ? "bold" : "normal",
                transition: "all 0.2s",
                borderColor: showGaps ? "primary.main" : "#444",
                "&:hover": {
                  transform: "translateY(-1px)",
                  boxShadow: showGaps
                    ? "0 2px 8px rgba(33, 150, 243, 0.3)"
                    : "none",
                },
              }}
            />
            {showGaps && (
              <Chip
                label={showOnlyUnfilled ? "僅未補缺口" : "顯示所有缺口"}
                size="small"
                onClick={() => setShowOnlyUnfilled(!showOnlyUnfilled)}
                variant={showOnlyUnfilled ? "filled" : "outlined"}
                color={showOnlyUnfilled ? "info" : "default"}
                sx={{
                  height: 24,
                  fontSize: "0.75rem",
                  fontWeight: showOnlyUnfilled ? "bold" : "normal",
                  transition: "all 0.2s",
                  borderColor: showOnlyUnfilled ? "info.main" : "#444",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: showOnlyUnfilled
                      ? "0 2px 8px rgba(2, 136, 209, 0.3)"
                      : "none",
                  },
                }}
              />
            )}
          </Stack>
        </Box>

        <Menu
          anchorEl={settingsAnchorEl}
          open={Boolean(settingsAnchorEl)}
          onClose={handleCloseSettings}
          PaperProps={{ sx: { p: 2, width: 250, bgcolor: "background.paper" } }}
        >
          <Typography variant="subtitle2" gutterBottom>布林通道參數</Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">長度: {settings.boll} 根</Typography>
            <Slider
              value={settings.boll}
              min={10}
              max={100}
              step={1}
              onChange={(_, v) => updateSetting("boll", v as number)}
              size="small"
            />
          </Box>
          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button size="small" onClick={resetSettings}>回復預設</Button>
          </Box>
        </Menu>
      </Stack>

      <Box
        ref={chartContainerRef}
        sx={{ flexGrow: 1, minHeight: 0, width: "100%" }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="t" hide />
            <YAxis domain={yDomain} allowDataOverflow={true} />
            <YAxis
              yAxisId="right"
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

            {/* Gap Visualization (Premium Support/Resistance Area Zones) */}
            {showGaps &&
              (showOnlyUnfilled ? unfilledGaps : gapsWithFillStatus).map(
                (gap) => {
                  const latestDate =
                    chartData[chartData.length - 1]?.t;
                  const endDate =
                    gap.filled && gap.fillDate ? gap.fillDate : latestDate;

                  // Traditional Taiwan stock market: Red is support (up gap), Green is resistance (down gap)
                  const strokeColor =
                    gap.type === "up"
                      ? "rgba(255, 77, 79, 0.6)"
                      : "rgba(82, 196, 26, 0.6)";
                  const fillColor =
                    gap.type === "up"
                      ? "rgba(255, 77, 79, 0.2)"
                      : "rgba(82, 196, 26, 0.2)";

                  return (
                    <ReferenceArea
                      key={`gap-area-${gap.date}`}
                      x1={gap.date}
                      x2={endDate}
                      y1={gap.low}
                      y2={gap.high}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeDasharray="4 3"
                      strokeWidth={1.2}
                      isFront={false}
                    />
                  );
                },
              )}

            <Bar
              dataKey="v"
              yAxisId="right"
              fill="#90caf9"
              opacity={0.3}
              name="Volume"
              barSize={10}
            />

            <Line
              dataKey="bollMa"
              stroke="#1976d2"
              strokeWidth={1.5}
              dot={false}
              activeDot={false}
              name="中線 (Basis)"
            />
            <Line
              dataKey="bollUb"
              stroke="#808080"
              strokeWidth={1.7}
              dot={false}
              activeDot={false}
              name="上軌"
            />
            <Line
              dataKey="bollLb"
              stroke="#808080"
              strokeWidth={1.7}
              dot={false}
              activeDot={false}
              name="下軌"
            />
            <Line
              dataKey="ema200"
              stroke="#ffeb3b"
              strokeWidth={1}
              dot={false}
              activeDot={false}
              name="EMA 200"
            />



            {/* Signals */}
            <Scatter
              dataKey="buySignal"
              shape={<BuyArrow />}
              legendType="none"
            />
            <Scatter
              dataKey="exitSignal"
              shape={<ExitArrow />}
              legendType="none"
            />

            {/* Deduction Markers */}
            {maDeductionPoints.map((p) => (
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
                        x={x - 15}
                        y={5}
                        width={30}
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
                        {p.period}
                      </text>
                    </g>
                  );
                }}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Container>
  );
}
