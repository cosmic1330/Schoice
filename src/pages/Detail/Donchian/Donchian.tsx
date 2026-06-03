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
  FormControlLabel,
  IconButton,
  Menu,
  Tooltip as MuiTooltip,
  Slider,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import {
  Area,
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
import { calculateChannel } from "../../../utils/channelUtils";
import {
  calculateIndicators,
  EnhancedDealData,
} from "../../../utils/indicatorUtils";
import Fundamental from "../Tooltip/Fundamental";

interface DonchianChartData extends EnhancedDealData {
  buySignal: number | null;
  exitSignal: number | null;
  buyReason?: string;
  exitReason?: string;
  channelUb?: number | null;
  channelLb?: number | null;
  donchianRange?: [number, number] | null;
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
          fontWeight="bold"
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
          fontWeight="bold"
        >
          {payload.exitReason}
        </text>
      )}
    </g>
  );
};

export default function Donchian({
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
  const [isLocked, setIsLocked] = useState(false);
  const [showGaps, setShowGaps] = useState(true);
  const [showOnlyUnfilled, setShowOnlyUnfilled] = useState(true);
  const [hoveredGapDate, setHoveredGapDate] = useState<
    number | string | undefined
  >(undefined);
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

  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(
    null,
  );

  const handleOpenChannelSettings = (event: React.MouseEvent<HTMLElement>) => {
    setChannelAnchorEl(event.currentTarget);
  };
  const handleCloseChannelSettings = () => {
    setChannelAnchorEl(null);
  };

  const handleOpenSettings = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };
  const handleCloseSettings = () => {
    setSettingsAnchorEl(null);
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

  const allPointsWithIndicators = useMemo((): DonchianChartData[] => {
    if (!deals || deals.length === 0) return [];
    const baseData = calculateIndicators(deals, settings);
    let lastSignalState: "buy" | "neutral" = "neutral";

    return baseData.map((d, i) => {
      if (i === 0)
        return { ...d, buySignal: null, exitSignal: null } as DonchianChartData;
      const prev = baseData[i - 1];
      const price = d.c;

      let buySignal: number | null = null;
      let exitSignal: number | null = null;
      let buyReason: string | undefined;
      let exitReason: string | undefined;

      // Donchian Breakout Logic
      if (lastSignalState === "buy") {
        // Exit if price breaks below lower band of PREVIOUS bar
        if (prev.donchianLb !== null && price > 0 && price < prev.donchianLb) {
          exitSignal = (d.h || price || 0) * 1.02;
          exitReason = "跌破下軌";
          lastSignalState = "neutral";
        }
      } else {
        // Entry if price breaks above upper band of PREVIOUS bar AND volume > vma20
        if (
          prev.donchianUb !== null &&
          price > 0 &&
          price > prev.donchianUb &&
          d.v > (d.vma20 || 0)
        ) {
          buySignal = (d.l || price || 0) * 0.98;
          buyReason = "突破上軌+放量";
          lastSignalState = "buy";
        }
      }

      const sanitized = {
        ...d,
        h: d.h > 0 ? d.h : d.c,
        l: d.l > 0 ? d.l : d.c,
        o: d.o > 0 ? d.o : d.c,
      };

      const donchianRange: [number, number] | null =
        d.donchianLb !== null && d.donchianUb !== null
          ? [d.donchianLb, d.donchianUb]
          : null;

      return {
        ...sanitized,
        buySignal,
        exitSignal,
        buyReason,
        exitReason,
        donchianRange,
      } as DonchianChartData;
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

    chartData.forEach((d) => {
      if (d.h != null && d.h > 0 && d.h > max) max = d.h;
      if (d.l != null && d.l > 0 && d.l < min) min = d.l;

      if (d.donchianUb != null && d.donchianUb > 0 && d.donchianUb > max)
        max = d.donchianUb;
      if (d.donchianLb != null && d.donchianLb > 0 && d.donchianLb < min)
        min = d.donchianLb;
    });

    if (min === Infinity || max === -Infinity) return ["auto", "auto"];

    const range = max - min;
    const padding = range * 0.1;
    return [min - padding, max + padding];
  }, [chartData]);

  const channelInfo = useMemo(() => {
    if (isLocked && lockedInfo) return lockedInfo;
    if (chartData.length === 0) return null;

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

  // Gap Detection
  const { gapsWithFillStatus, unfilledGaps } = useGapDetection(
    finalChartData,
    0.7,
  );

  // Helper to format YYYYMMDD number to Date string
  const formatDateTick = (tick: number | string) => {
    const str = tick.toString();
    if (str.length === 8) {
      return `${str.slice(0, 4)}/${str.slice(4, 6)}/${str.slice(6)}`;
    }
    return str;
  };

  // Custom Tooltip with Gap analysis info
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && label !== undefined) {
      const currentGaps = (
        showOnlyUnfilled ? unfilledGaps : gapsWithFillStatus
      ).filter((gap) => gap.date === label);

      if (currentGaps.length > 0) {
        if (hoveredGapDate !== label) {
          setHoveredGapDate(label);
        }
      } else {
        if (hoveredGapDate !== undefined) {
          setHoveredGapDate(undefined);
        }
      }

      const dateStr = formatDateTick(label);

      // Hide keys that we don't want to show
      const hideKeys = [
        "buySignal",
        "exitSignal",
        "supertrend",
        "trailStop",
        "direction",
      ];

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
            color: "#fff",
            fontSize: "12px",
          }}
        >
          <p
            style={{
              color: "#eee",
              margin: "0 0 8px 0",
              fontWeight: "bold",
              fontSize: "0.85rem",
            }}
          >
            {dateStr}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "4px 12px",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              paddingTop: "6px",
            }}
          >
            {payload.map((entry: any, index: number) => {
              if (hideKeys.includes(entry.dataKey)) return null;
              if (entry.name && entry.name.toLowerCase().includes("gap"))
                return null;
              if (entry.value === null || entry.value === undefined)
                return null;

              const itemColor =
                entry.color &&
                entry.color !== "#000" &&
                entry.color !== "#000000" &&
                entry.color !== "none"
                  ? entry.color
                  : "#fff";

              const isFullWidth =
                Array.isArray(entry.value) || entry.name.length > 10;

              return (
                <div
                  key={index}
                  style={{
                    gridColumn: isFullWidth ? "span 2" : "auto",
                    color: itemColor,
                    fontSize: "0.75rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    paddingBottom: "1px",
                  }}
                >
                  <span
                    style={{
                      opacity: 0.7,
                      marginRight: "8px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {entry.name}:
                  </span>
                  <span style={{ fontWeight: 700, fontFamily: "monospace" }}>
                    {typeof entry.value === "number"
                      ? entry.value.toFixed(2)
                      : entry.value}
                  </span>
                </div>
              );
            })}
          </div>

          {currentGaps.length > 0 && (
            <div
              style={{
                marginTop: 8,
                borderTop: "1px solid rgba(255,255,255,0.15)",
                paddingTop: 6,
              }}
            >
              {currentGaps.map((g) => (
                <div key={g.date} style={{ marginTop: 4 }}>
                  <p
                    style={{
                      color: g.type === "up" ? "#ff4d4f" : "#52c41a",
                      margin: 0,
                      fontWeight: "bold",
                    }}
                  >
                    {g.type === "up" ? "支撐缺口" : "壓力缺口"} (
                    {g.size.toFixed(2)}, {g.sizePercent.toFixed(1)}%)
                  </p>
                  <p
                    style={{
                      color: "#ccc",
                      margin: "2px 0 0 0",
                      fontSize: "0.7rem",
                    }}
                  >
                    缺口上緣: {g.high.toFixed(2)} | 下緣: {g.low.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
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
            Donchian ({settings.donchian})
          </Typography>
        </MuiTooltip>

        <IconButton
          size="small"
          onClick={handleOpenSettings}
          color="primary"
          sx={{ mr: 1 }}
        >
          <SettingsIcon fontSize="small" />
        </IconButton>

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

            <Divider
              orientation="vertical"
              flexItem
              sx={{
                mx: 0.5,
                height: 20,
                alignSelf: "center",
                borderColor: "rgba(255,255,255,0.1)",
              }}
            />

            {/* Unified Glassmorphism Control Panel */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                px: 2,
                py: 0.5,
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.03)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                boxShadow: "inset 0 0 20px rgba(0,0,0,0.2)",
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showGaps}
                    onChange={(e) => setShowGaps(e.target.checked)}
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": {
                        color: "#2196f3",
                      },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                        { backgroundColor: "#2196f3" },
                    }}
                  />
                }
                label={
                  <Typography
                    variant="caption"
                    sx={{
                      color: showGaps ? "#fff" : "#888",
                      fontWeight: showGaps ? 600 : 400,
                    }}
                  >
                    缺口
                  </Typography>
                }
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
                      "& .MuiSwitch-switchBase.Mui-checked": {
                        color: "#ff9800",
                      },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                        { backgroundColor: "#ff9800" },
                    }}
                  />
                }
                label={
                  <Typography
                    variant="caption"
                    sx={{
                      color: showOnlyUnfilled ? "#fff" : "#888",
                      fontWeight: showOnlyUnfilled ? 600 : 400,
                    }}
                  >
                    僅未補
                  </Typography>
                }
                sx={{ m: 0 }}
              />
            </Box>
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
          anchorEl={settingsAnchorEl}
          open={Boolean(settingsAnchorEl)}
          onClose={handleCloseSettings}
          PaperProps={{ sx: { p: 2, width: 250, bgcolor: "background.paper" } }}
        >
          <Typography variant="subtitle2" gutterBottom>
            唐奇安通道參數
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              長度: {settings.donchian} 根
            </Typography>
            <Slider
              value={settings.donchian}
              min={5}
              max={100}
              step={1}
              onChange={(_, v) => updateSetting("donchian", v as number)}
              size="small"
            />
          </Box>
          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button size="small" onClick={resetSettings}>
              回復預設
            </Button>
          </Box>
        </Menu>
      </Stack>

      <Box
        ref={chartContainerRef}
        sx={{ flexGrow: 1, minHeight: 0, height: "100%", width: "100%" }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={finalChartData}
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="t" hide />
            <YAxis domain={yDomain} orientation="left" />

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

            {/* Donchian Channel lines */}
            <Area
              dataKey="donchianRange"
              stroke="none"
              fill="#9c27b0"
              fillOpacity={0.05}
              activeDot={false}
              tooltipType="none"
              name="通道填充"
            />
            <Line
              dataKey="donchianMa"
              stroke="#1976d2"
              strokeWidth={1.5}
              dot={false}
              activeDot={false}
              name={`DC 中軌 (${settings.donchian})`}
            />
            <Line
              dataKey="donchianUb"
              stroke="#808080"
              strokeWidth={1.7}
              dot={false}
              activeDot={false}
              name={`DC 上軌 (${settings.donchian})`}
            />
            <Line
              dataKey="donchianLb"
              stroke="#808080"
              strokeWidth={1.7}
              dot={false}
              activeDot={false}
              name={`DC 下軌 (${settings.donchian})`}
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

            {/* Gap Visualization (Premium Support/Resistance Area Zones) */}
            {showGaps &&
              (showOnlyUnfilled ? unfilledGaps : gapsWithFillStatus).map(
                (gap) => {
                  const latestDate =
                    finalChartData[finalChartData.length - 1]?.t;
                  const endDate =
                    gap.filled && gap.fillDate ? gap.fillDate : latestDate;

                  // Traditional Taiwan stock market: Red is support (up gap), Green is resistance (down gap)
                  // Use extremely elegant semi-transparent filled bands that do not block candles (isFront={false})
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
