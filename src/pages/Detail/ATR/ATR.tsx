import SettingsIcon from "@mui/icons-material/Settings";
import {
  Box,
  Button,
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
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import BaseCandlestickRectangle from "../../../components/RechartCustoms/BaseCandlestickRectangle";
import { DealsContext } from "../../../context/DealsContext";
import useIndicatorSettings from "../../../hooks/useIndicatorSettings";
import { calculateIndicators } from "../../../utils/indicatorUtils";
import ChartTooltip from "../Tooltip/ChartTooltip";
import Fundamental from "../Tooltip/Fundamental";

const BuyArrow = (props: any) => {
  const { cx, cy } = props;
  if (!cx || !cy) return null;
  return (
    <g>
      <path
        d={`M${cx},${cy + 10} L${cx - 6},${cy + 20} L${cx + 6},${cy + 20} Z`}
        fill="#f44336"
        stroke="#c62828"
      />
      <text
        x={cx}
        y={cy + 35}
        textAnchor="middle"
        fill="#f44336"
        fontSize="10px"
      >
        進場
      </text>
    </g>
  );
};

const ExitArrow = (props: any) => {
  const { cx, cy } = props;
  if (!cx || !cy) return null;
  return (
    <g>
      <path
        d={`M${cx},${cy - 10} L${cx - 6},${cy - 20} L${cx + 6},${cy - 20} Z`}
        fill="#4caf50"
        stroke="#2e7d32"
      />
      <text
        x={cx}
        y={cy - 30}
        textAnchor="middle"
        fill="#4caf50"
        fontSize="10px"
      >
        出場
      </text>
    </g>
  );
};

export default function ATR({
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenSettings = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseSettings = () => {
    setAnchorEl(null);
  };

  const { id } = useParams();

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
  }, [deals.length, visibleCount]);

  const allPoints = useMemo(() => {
    if (!deals || deals.length === 0) return [];
    return calculateIndicators(deals, settings);
  }, [deals, settings]);

  const chartData = useMemo(() => {
    return allPoints.slice(
      -(visibleCount + rightOffset),
      rightOffset === 0 ? undefined : -rightOffset,
    );
  }, [allPoints, visibleCount, rightOffset]);

  const yDomain = useMemo(() => {
    if (chartData.length === 0) return ["auto", "auto"];
    let min = Infinity;
    let max = -Infinity;
    chartData.forEach((d) => {
      if (d.h != null && d.h > max) max = d.h;
      if (d.l != null && d.l < min) min = d.l;
      if (d.supertrend != null && d.supertrend > max) max = d.supertrend;
      if (d.supertrend != null && d.supertrend < min) min = d.supertrend;
      if (d.ema50 != null && d.ema50 > max) max = d.ema50;
      if (d.ema50 != null && d.ema50 < min) min = d.ema50;
      if (d.trailStop != null && d.trailStop > max) max = d.trailStop;
      if (d.trailStop != null && d.trailStop < min) min = d.trailStop;
    });
    if (min === Infinity || max === -Infinity) return ["auto", "auto"];
    const padding = (max - min) * 0.05;
    return [min - padding, max + padding];
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
        <MuiTooltip title={<Fundamental id={id} />} arrow>
          <Typography variant="h6" component="div" color="white" sx={{ mr: 2 }}>
            ATR
          </Typography>
        </MuiTooltip>
        <IconButton
          size="small"
          onClick={handleOpenSettings}
          color="primary"
          sx={{
            p: 0.5,
            transition: "transform 0.2s",
            "&:hover": { transform: "rotate(45deg)" },
          }}
        >
          <SettingsIcon fontSize="small" />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseSettings}
          PaperProps={{
            sx: { p: 2, width: 250, bgcolor: "background.paper" },
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Supertrend 參數
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              ATR 長度: {settings.atrLen} 根
            </Typography>
            <Slider
              value={settings.atrLen}
              min={5}
              max={100}
              step={1}
              onChange={(_, v) => updateSetting("atrLen", v as number)}
              size="small"
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              ATR 倍數: {settings.atrMult.toFixed(1)}
            </Typography>
            <Slider
              value={settings.atrMult}
              min={0.5}
              max={10.0}
              step={0.1}
              onChange={(_, v) => updateSetting("atrMult", v as number)}
              size="small"
              color="primary"
            />
          </Box>
          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button
              size="small"
              onClick={resetSettings}
              sx={{ color: "primary.main", fontWeight: "bold" }}
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
            data={chartData}
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="t" hide />
            <YAxis domain={yDomain} allowDataOverflow={true} />
            <YAxis
              yAxisId="volume"
              orientation="right"
              domain={[0, (dataMax: number) => dataMax * 5]}
              width={0}
              tick={false}
              axisLine={false}
            />

            <Tooltip
              content={
                <ChartTooltip
                  hideKeys={["buySignal", "exitSignal", "direction"]}
                />
              }
              offset={50}
            />

            {/* Ghost lines for Tooltip */}
            <Line
              dataKey="h"
              stroke="none"
              dot={false}
              activeDot={false}
              name="高"
            />
            <Line
              dataKey="c"
              stroke="none"
              dot={false}
              activeDot={false}
              name="收"
            />
            <Line
              dataKey="l"
              stroke="none"
              dot={false}
              activeDot={false}
              name="低"
            />
            <Line
              dataKey="o"
              stroke="none"
              dot={false}
              activeDot={false}
              name="開"
            />

            <Customized component={BaseCandlestickRectangle} />

            <Bar
              dataKey="v"
              yAxisId="volume"
              fill="rgba(144, 202, 249, 0.2)"
              name="成交量"
              barSize={8}
            />

            <Line
              dataKey="supertrend"
              stroke="rgba(33, 150, 243, 0.8)"
              strokeWidth={2}
              dot={false}
              activeDot={false}
              name="SuperTrend"
            />

            <Line
              dataKey="trailStop"
              stroke="#eda049"
              strokeWidth={1}
              dot={false}
              activeDot={false}
              name="EMA 30"
              opacity={0.3}
            />

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
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Container>
  );
}
