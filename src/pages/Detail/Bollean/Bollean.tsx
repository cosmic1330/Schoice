import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import SettingsIcon from "@mui/icons-material/Settings";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
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
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import BaseCandlestickRectangle from "../../../components/RechartCustoms/BaseCandlestickRectangle";
import { DealsContext } from "../../../context/DealsContext";
import useIndicatorSettings from "../../../hooks/useIndicatorSettings";
import { calculateChannel } from "../../../utils/channelUtils";
import { calculateIndicators } from "../../../utils/indicatorUtils";
import ChartTooltip from "../Tooltip/ChartTooltip";
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
  exitReason?: string;
  channelUb?: number | null;
  channelLb?: number | null;
  kcDynamicStop?: number | null;
  kcExitSignal?: number | null;
  kcMiddle?: number | null;
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

const KcXMarker = (props: any) => {
  const { cx, cy } = props;
  if (!cx || !cy) return null;
  return (
    <g>
      <line
        x1={cx - 5}
        y1={cy - 5}
        x2={cx + 5}
        y2={cy + 5}
        stroke="#ff1744"
        strokeWidth={3}
      />
      <line
        x1={cx + 5}
        y1={cy - 5}
        x2={cx - 5}
        y2={cy + 5}
        stroke="#ff1744"
        strokeWidth={3}
      />
      <text
        x={cx}
        y={cy - 12}
        textAnchor="middle"
        fill="#ff1744"
        fontSize="10px"
        fontWeight="bold"
      >
        跌破
      </text>
    </g>
  );
};

export default function Bollean({
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
  const { settings, updateSetting, resetSettings } = useIndicatorSettings();
  const deals = useContext(DealsContext);
  const [showChannel, setShowChannel] = useState(false);
  const [showKc, setShowKc] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedInfo, setLockedInfo] = useState<{
    slope: number;
    upperIntercept: number;
    lowerIntercept: number;
    anchorTime: number | string;
    type: string;
  } | null>(null);

  // LRC Dynamic Parameters
  const [channelPeriod, setChannelPeriod] = useState(60);
  const [channelMultiplier, setChannelMultiplier] = useState(2.0);
  const [channelAnchorEl, setChannelAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const [kcAnchorEl, setKcAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenChannelSettings = (event: React.MouseEvent<HTMLElement>) => {
    setChannelAnchorEl(event.currentTarget);
  };
  const handleCloseChannelSettings = () => {
    setChannelAnchorEl(null);
  };

  const handleOpenKcSettings = (event: React.MouseEvent<HTMLElement>) => {
    setKcAnchorEl(event.currentTarget);
  };
  const handleCloseKcSettings = () => {
    setKcAnchorEl(null);
  };

  const handleResetChannel = () => {
    setChannelPeriod(60);
    setChannelMultiplier(2.0);
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
    let lastSignalState: "buy" | "neutral" = "neutral";
    const isNum = (n: any): n is number => typeof n === "number";

    return baseData.map((d, i) => {
      if (i < settings.boll) return d as BolleanChartData;
      const prev = baseData[i - 1];
      const price = d.c;
      const ub = d.bollUb;
      const lb = d.bollLb;
      const ma = d.bollMa;
      const width = d.bandWidth;

      if (
        !isNum(price) ||
        ub === null ||
        lb === null ||
        ma === null ||
        width === null
      )
        return d as BolleanChartData;

      const maRising = ma > (prev.bollMa || 0);
      const priceAboveMa = price > ma;
      const isSqueeze = width < 0.15;
      const breakoutUp =
        isSqueeze && price > ub && (d.v || 0) > (prev.v || 0) * 1.3;
      const touchedLb = (d.l || 0) <= lb;
      const closeHigh = price > (d.o || 0);
      const reversalLong = touchedLb && closeHigh && maRising;

      let score = 0;
      if (maRising) score += 20;
      if (priceAboveMa) score += 20;
      if (breakoutUp) score += 40;
      if (reversalLong) score += 30;

      let buySignal: number | null = null;
      let exitSignal: number | null = null;
      let buyReason: string | undefined;
      let exitReason: string | undefined;

      if (lastSignalState === "buy") {
        if (price < ma) {
          exitSignal = (d.h || 0) * 1.02;
          exitReason = "跌破中軌";
          lastSignalState = "neutral";
        }
      } else {
        if ((breakoutUp || reversalLong) && score >= 50) {
          buySignal = (d.l || 0) * 0.98;
          buyReason = "突破/反轉";
          lastSignalState = "buy";
        }
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
      if (d.kcDynamicStop != null && d.kcDynamicStop < min)
        min = d.kcDynamicStop;
      if (d.kcDynamicStop != null && d.kcDynamicStop > max)
        max = d.kcDynamicStop;
    });

    if (min === Infinity || max === -Infinity) return ["auto", "auto"];

    const range = max - min;
    const padding = range * 0.05; // 5% padding
    return [min - padding, max + padding];
  }, [chartData]);

  const channelInfo = useMemo(() => {
    if (isLocked && lockedInfo) return lockedInfo;
    if (chartData.length === 0) return null;

    // Requirements: dynamic points based on channelPeriod
    const n = Math.min(channelPeriod, chartData.length);
    const calculationSlice = chartData.slice(-n);

    const highs = calculationSlice.map((d) => d.h as number | null);
    const lows = calculationSlice.map((d) => d.l as number | null);

    return calculateChannel(highs, lows, channelMultiplier);
  }, [chartData, isLocked, lockedInfo, channelPeriod, channelMultiplier]);

  const handleToggleLock = (checked: boolean) => {
    if (checked) {
      if (!channelInfo || chartData.length === 0) return;
      const n = Math.min(channelPeriod, chartData.length);
      const anchorPoint = chartData[chartData.length - n];
      if (!anchorPoint || anchorPoint.t === undefined) return;
      setLockedInfo({
        ...channelInfo,
        anchorTime: anchorPoint.t,
      });
      setIsLocked(true);
    } else {
      setIsLocked(false);
      setLockedInfo(null);
    }
  };

  const finalChartData = useMemo(() => {
    if (!channelInfo) return chartData;

    let anchorIdx = -1;
    if (isLocked && lockedInfo) {
      anchorIdx = allPointsWithIndicators.findIndex(
        (p) => p.t === lockedInfo.anchorTime,
      );
    } else {
      const n = Math.min(channelPeriod, chartData.length);
      const startIndex = chartData.length - n;
      return chartData.map((d, i) => {
        const relativeIndex = i - startIndex;
        const channelUb =
          channelInfo.slope * relativeIndex + channelInfo.upperIntercept;
        const channelLb =
          channelInfo.slope * relativeIndex + channelInfo.lowerIntercept;
        return { ...d, channelUb, channelLb };
      });
    }

    if (anchorIdx === -1) return chartData;

    return chartData.map((d) => {
      const currentFullIdx = allPointsWithIndicators.findIndex(
        (p) => p.t === d.t,
      );
      if (currentFullIdx === -1) return d;

      const relativeIndex = currentFullIdx - anchorIdx;
      const channelUb =
        channelInfo.slope * relativeIndex + channelInfo.upperIntercept;
      const channelLb =
        channelInfo.slope * relativeIndex + channelInfo.lowerIntercept;

      return { ...d, channelUb, channelLb };
    });
  }, [chartData, channelInfo, isLocked, lockedInfo, allPointsWithIndicators]);

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
            Bolling
          </Typography>
        </MuiTooltip>

        <Box
          sx={{ flexGrow: 1, display: "flex", gap: 2, alignItems: "center" }}
        >
          {channelInfo && (
            <Chip
              label={
                channelInfo.type === "ascending"
                  ? "上升通道"
                  : channelInfo.type === "descending"
                    ? "下降通道"
                    : "橫盤通道"
              }
              color="secondary"
              variant="filled"
              size="small"
              sx={{ height: 24, fontSize: "0.75rem" }}
            />
          )}

          <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24 }} />

          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Chip
                icon={
                  showChannel ? (
                    <VisibilityIcon fontSize="small" />
                  ) : (
                    <VisibilityOffIcon fontSize="small" />
                  )
                }
                label="通道"
                size="small"
                onClick={() => setShowChannel(!showChannel)}
                variant={showChannel ? "filled" : "outlined"}
                color={showChannel ? "secondary" : "default"}
                sx={{
                  height: 24,
                  fontSize: "0.75rem",
                  fontWeight: showChannel ? "bold" : "normal",
                  transition: "all 0.2s",
                  borderColor: showChannel ? "secondary.main" : "#444",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: showChannel
                      ? "0 2px 8px rgba(156, 39, 176, 0.3)"
                      : "none",
                  },
                }}
              />
              <IconButton
                size="small"
                onClick={handleOpenChannelSettings}
                color="secondary"
                sx={{
                  p: 0.4,
                  transition: "transform 0.2s",
                  "&:hover": { transform: "rotate(45deg)" },
                }}
              >
                <SettingsIcon sx={{ fontSize: "1rem" }} />
              </IconButton>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Chip
                icon={
                  showKc ? (
                    <VisibilityIcon fontSize="small" />
                  ) : (
                    <VisibilityOffIcon fontSize="small" />
                  )
                }
                label="動態防線"
                size="small"
                onClick={() => setShowKc(!showKc)}
                variant={showKc ? "filled" : "outlined"}
                color={showKc ? "warning" : "default"}
                sx={{
                  height: 24,
                  fontSize: "0.75rem",
                  fontWeight: showKc ? "bold" : "normal",
                  transition: "all 0.2s",
                  borderColor: showKc ? "warning.main" : "#444",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: showKc
                      ? "0 2px 8px rgba(255, 152, 0, 0.3)"
                      : "none",
                  },
                }}
              />
              <IconButton
                size="small"
                onClick={handleOpenKcSettings}
                color="warning"
                sx={{
                  p: 0.4,
                  transition: "transform 0.2s",
                  "&:hover": { transform: "rotate(45deg)" },
                }}
              >
                <SettingsIcon sx={{ fontSize: "1rem" }} />
              </IconButton>
            </Box>

            {showChannel && (
              <Chip
                icon={
                  isLocked ? (
                    <LockIcon fontSize="small" />
                  ) : (
                    <LockOpenIcon fontSize="small" />
                  )
                }
                label="固定"
                size="small"
                onClick={() => handleToggleLock(!isLocked)}
                variant={isLocked ? "filled" : "outlined"}
                color={isLocked ? "warning" : "default"}
                sx={{
                  height: 24,
                  fontSize: "0.75rem",
                  fontWeight: isLocked ? "bold" : "normal",
                  transition: "all 0.2s",
                  borderColor: isLocked ? "warning.main" : "#444",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: isLocked
                      ? "0 2px 8px rgba(237, 108, 2, 0.3)"
                      : "none",
                  },
                }}
              />
            )}
          </Stack>
        </Box>
        <Menu
          anchorEl={channelAnchorEl}
          open={Boolean(channelAnchorEl)}
          onClose={handleCloseChannelSettings}
          PaperProps={{
            sx: { p: 2, width: 250, bgcolor: "background.paper" },
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            通道參數調校
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              計算長度: {channelPeriod} 根
            </Typography>
            <Slider
              value={channelPeriod}
              min={10}
              max={200}
              step={1}
              onChange={(_, v) => setChannelPeriod(v as number)}
              size="small"
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              標準差倍數: {channelMultiplier.toFixed(1)}
            </Typography>
            <Slider
              value={channelMultiplier}
              min={0.5}
              max={5.0}
              step={0.1}
              onChange={(_, v) => setChannelMultiplier(v as number)}
              size="small"
              color="secondary"
            />
          </Box>
          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button
              size="small"
              onClick={handleResetChannel}
              sx={{ color: "secondary.main", fontWeight: "bold" }}
            >
              回復預設
            </Button>
          </Box>
        </Menu>

        <Menu
          anchorEl={kcAnchorEl}
          open={Boolean(kcAnchorEl)}
          onClose={handleCloseKcSettings}
          PaperProps={{
            sx: { p: 2, width: 250, bgcolor: "background.paper" },
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            動態防線 (KC)
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              計算長度: {settings.kcLength} 根
            </Typography>
            <Slider
              value={settings.kcLength}
              min={5}
              max={100}
              step={1}
              onChange={(_, v) => updateSetting("kcLength", v as number)}
              size="small"
              color="warning"
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              標準差倍數: {settings.kcMult.toFixed(1)}
            </Typography>
            <Slider
              value={settings.kcMult}
              min={0.5}
              max={5.0}
              step={0.1}
              onChange={(_, v) => updateSetting("kcMult", v as number)}
              size="small"
              color="warning"
            />
          </Box>
          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button
              size="small"
              onClick={resetSettings}
              sx={{ color: "warning.main", fontWeight: "bold" }}
            >
              全部回復預設
            </Button>
          </Box>
        </Menu>
      </Stack>

      <Box
        ref={chartContainerRef}
        sx={{ flexGrow: 1, minHeight: 0, width: "100%" }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={finalChartData}
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

            <Tooltip
              content={
                <ChartTooltip
                  hideKeys={["buySignal", "exitSignal", "kcExitSignal"]}
                />
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
              yAxisId="right"
              fill="#90caf9"
              opacity={0.3}
              name="Volume"
              barSize={10}
            />

            <Line
              dataKey="bollMa"
              stroke="#2196f3"
              strokeWidth={1}
              dot={false}
              activeDot={false}
              name={`${settings.boll} MA (Mid)`}
            />
            <Line
              dataKey="bollUb"
              stroke="#00bcd4"
              strokeWidth={1.7}
              dot={false}
              activeDot={false}
              name="Upper Band"
            />
            <Line
              dataKey="bollLb"
              stroke="#00bcd4"
              strokeWidth={1.7}
              dot={false}
              activeDot={false}
              name="Lower Band"
            />

            {/* Price Channel lines */}
            {showChannel && (
              <>
                <Line
                  dataKey="channelUb"
                  stroke="#d286ee"
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                  name="Channel Upper"
                />
                <Line
                  dataKey="channelLb"
                  stroke="#d286ee"
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                  name="Channel Lower"
                />
              </>
            )}

            {/* KC Dynamic Defense Line */}
            {showKc && (
              <>
                <Line
                  dataKey="kcDynamicStop"
                  stroke="#ff9800"
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                  name="動態防線"
                />
                <Scatter
                  dataKey="kcExitSignal"
                  shape={<KcXMarker />}
                  legendType="none"
                />
              </>
            )}

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
