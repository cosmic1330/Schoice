import { AlignHorizontalLeft, AlignHorizontalRight } from "@mui/icons-material";
import {
  Box,
  CircularProgress,
  Container,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Popover,
  Select,
  Slider,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from "@mui/material";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Customized,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import BaseCandlestickRectangle from "../../../components/RechartCustoms/BaseCandlestickRectangle";
import { DealsContext } from "../../../context/DealsContext";
import ChartTooltip from "../Tooltip/ChartTooltip";
import useToolbarSettings from "../GlassBar/useToolbarSettings";

// Interface for Volume Profile Bin
interface VolumeBin {
  priceMin: number;
  priceMax: number;
  buyVolume: number;
  sellVolume: number;
  totalVolume: number;
  priceCenter: number;
}

// Customized Volume Profile Component
const CustomVolumeProfile = (props: any) => {
  const { formattedGraphicalItems, width, margin, yAxisMap, bins, align } = props;

  if (!formattedGraphicalItems || formattedGraphicalItems.length === 0 || !bins || bins.length === 0) {
    return null;
  }

  const yAxisKey = Object.keys(yAxisMap || {})[0];
  const yAxis = yAxisMap?.[yAxisKey];
  const yScale = yAxis?.scale;
  if (typeof yScale !== "function") return null;

  const leftX = margin?.left || 65;
  const chartWidth = width - (margin?.left || 65) - (margin?.right || 0);
  const maxProfileWidth = chartWidth * 0.35;

  let maxTotalVolume = 0;
  for (const bin of bins) {
    if (bin.totalVolume > maxTotalVolume) maxTotalVolume = bin.totalVolume;
  }
  if (maxTotalVolume === 0) return null;

  return (
    <g key="volume-profile-overlay" className="volume-profile-overlay">

      {/* 買賣量長條 */}
      {bins.map((bin: VolumeBin, i: number) => {
        if (bin.totalVolume === 0) return null;

        const yMin = yScale(bin.priceMin);
        const yMax = yScale(bin.priceMax);
        if (isNaN(yMin) || isNaN(yMax)) return null;

        const y = Math.min(yMin, yMax);
        const height = Math.max(Math.abs(yMin - yMax) - 0.8, 1.2);

        const barWidth = (bin.totalVolume / maxTotalVolume) * maxProfileWidth;
        const sellWidth = (bin.sellVolume / bin.totalVolume) * barWidth;
        const buyWidth = (bin.buyVolume / bin.totalVolume) * barWidth;

        let startX = leftX;
        if (align === "right") {
          startX = width - (margin?.right || 0) - barWidth;
        }

        return (
          <g key={`volume-bar-${i}`}>
            {align === "left" ? (
              <>
                {sellWidth > 0 && (
                  <rect
                    x={startX}
                    y={y}
                    width={sellWidth}
                    height={height}
                    fill="#52c41a"
                    fillOpacity={0.25}
                  />
                )}
                {buyWidth > 0 && (
                  <rect
                    x={startX + sellWidth}
                    y={y}
                    width={buyWidth}
                    height={height}
                    fill="#ff4d4f"
                    fillOpacity={0.25}
                  />
                )}
              </>
            ) : (
              <>
                {buyWidth > 0 && (
                  <rect
                    x={startX + sellWidth}
                    y={y}
                    width={buyWidth}
                    height={height}
                    fill="#ff4d4f"
                    fillOpacity={0.25}
                  />
                )}
                {sellWidth > 0 && (
                  <rect
                    x={startX}
                    y={y}
                    width={sellWidth}
                    height={height}
                    fill="#52c41a"
                    fillOpacity={0.25}
                  />
                )}
              </>
            )}
          </g>
        );
      })}
    </g>
  );
};

const binsOptions: (number | "Auto")[] = ["Auto", 60, 80, 100, 120, 150, 180, 200];
const synchronizedChartMargin = { top: 5, right: 34, left: 0, bottom: 5 };

export default function VolumeProfileChart({
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

  const [binsCount, setBinsCount] = useState<number | "Auto">("Auto");
  const [vaRatio, setVaRatio] = useState<number>(70);
  const [align, setAlign] = useState<"left" | "right">("left");

  const [showPoc, setShowPoc] = useState<boolean>(true);
  const [showVa, setShowVa] = useState<boolean>(true);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<HTMLElement | null>(
    null,
  );
  useToolbarSettings(setSettingsAnchorEl);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastX = useRef(0);

  // Zoom & Pan Effect
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

    const handleMouseDown = (e: MouseEvent) => { isDragging.current = true; lastX.current = e.clientX; e.preventDefault(); };
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
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
    const handleMouseUp = () => { isDragging.current = false; };

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

  const chartData = useMemo(() => {
    if (!deals || deals.length === 0) return [];
    return deals.slice(-(visibleCount + rightOffset), rightOffset === 0 ? undefined : -rightOffset);
  }, [deals, visibleCount, rightOffset]);

  // Compute Volume Profile + HVN
const profileMetrics = useMemo(() => {
  if (chartData.length === 0) {
    return { bins: [], minPrice: 0, maxPrice: 0, pocPrice: 0, vahPrice: 0, valPrice: 0 };
  }

  const actualBinsCount = binsCount === "Auto"
    ? Math.min(Math.max(Math.round(visibleCount * 1.2), 80), 180)
    : binsCount;

  let maxPrice = -Infinity;
  let minPrice = Infinity;
  for (const deal of chartData) {
    if (deal.h > maxPrice) maxPrice = deal.h;
    if (deal.l < minPrice) minPrice = deal.l;
  }

  if (maxPrice <= minPrice) {
    return { bins: [], minPrice, maxPrice, pocPrice: minPrice, vahPrice: minPrice, valPrice: minPrice };
  }

  const binSize = (maxPrice - minPrice) / actualBinsCount;
  const bins: VolumeBin[] = Array.from({ length: actualBinsCount }, (_, idx) => ({
    priceMin: minPrice + idx * binSize,
    priceMax: minPrice + (idx + 1) * binSize,
    buyVolume: 0,
    sellVolume: 0,
    totalVolume: 0,
    priceCenter: minPrice + (idx + 0.5) * binSize,
  }));

  let totalVolume = 0;

  chartData.forEach((deal, index) => {
    const { o, h, l, c, v } = deal;
    const isUp = c > o;
    const isLastBar = index === chartData.length - 1;   // ← 關鍵：判斷是否為最新一筆
    totalVolume += v;

    if (h === l || binSize === 0) {
      const idx = Math.min(actualBinsCount - 1, Math.max(0, Math.floor((c - minPrice) / binSize)));
      if (isUp) bins[idx].buyVolume += v;
      else bins[idx].sellVolume += v;
      bins[idx].totalVolume += v;
    } else {
      const candleRange = h - l;

      for (let i = 0; i < actualBinsCount; i++) {
        const bin = bins[i];

        let overlap = 0;

        if (isLastBar) {
          // 對最新一筆使用更保守的分配方式
          const realizedLow = Math.min(l, c);
          const realizedHigh = Math.max(h, c); // 至少包含已實現範圍
          overlap = Math.max(0, Math.min(realizedHigh, bin.priceMax) - Math.max(realizedLow, bin.priceMin));
        } else {
          // 歷史 K 線使用完整範圍
          overlap = Math.max(0, Math.min(h, bin.priceMax) - Math.max(l, bin.priceMin));
        }

        if (overlap > 0) {
          const fraction = overlap / candleRange;
          const distributedVol = v * fraction;

          if (isUp) bin.buyVolume += distributedVol;
          else bin.sellVolume += distributedVol;
          bin.totalVolume += distributedVol;
        }
      }
    }
  });

  // POC & Value Area
  let pocIdx = 0;
  let maxBinVol = 0;
  for (let i = 0; i < actualBinsCount; i++) {
    if (bins[i].totalVolume > maxBinVol) {
      maxBinVol = bins[i].totalVolume;
      pocIdx = i;
    }
  }
  const pocPrice = minPrice + (pocIdx + 0.5) * binSize;

  // Value Area（不變）
  const targetVolume = totalVolume * (vaRatio / 100);
  let currentVolume = bins[pocIdx].totalVolume;
  let upIdx = pocIdx, downIdx = pocIdx;

  while (currentVolume < targetVolume) {
    const volUp = upIdx + 1 < actualBinsCount ? bins[upIdx + 1].totalVolume : 0;
    const volDown = downIdx - 1 >= 0 ? bins[downIdx - 1].totalVolume : 0;
    if (volUp === 0 && volDown === 0) break;
    if (volUp >= volDown) { currentVolume += volUp; upIdx++; }
    else { currentVolume += volDown; downIdx--; }
  }

  const valPrice = minPrice + downIdx * binSize;
  const vahPrice = minPrice + (upIdx + 1) * binSize;

  return { bins, minPrice, maxPrice, pocPrice, vahPrice, valPrice };
}, [chartData, binsCount, vaRatio, visibleCount]);

  const { bins, pocPrice, vahPrice, valPrice } = profileMetrics;
  const priceDomain = useMemo<[number | "auto", number | "auto"]>(() => {
    if (chartData.length === 0) return ["auto", "auto"];

    let minimum = Math.min(...chartData.map((item) => item.l));
    let maximum = Math.max(...chartData.map((item) => item.h));

    if (showPoc && Number.isFinite(pocPrice)) {
      minimum = Math.min(minimum, pocPrice);
      maximum = Math.max(maximum, pocPrice);
    }
    if (showVa && Number.isFinite(vahPrice) && Number.isFinite(valPrice)) {
      minimum = Math.min(minimum, valPrice);
      maximum = Math.max(maximum, vahPrice);
    }

    const padding = Math.max(
      (maximum - minimum) * 0.05,
      Math.abs(maximum) * 0.005,
    );
    return [minimum - padding, maximum + padding];
  }, [chartData, pocPrice, showPoc, showVa, vahPrice, valPrice]);

  if (chartData.length === 0) {
    return (
      <Box height="100%" display="flex" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container component="main" maxWidth={false} sx={{ height: "100%", display: "flex", flexDirection: "column", pt: 1, px: 2, pb: 1 }}>
      <Popover
        anchorEl={settingsAnchorEl}
        open={Boolean(settingsAnchorEl)}
        onClose={() => setSettingsAnchorEl(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mb: 1,
              width: 280,
              p: 2,
              bgcolor: "rgba(24,28,35,0.98)",
              border: "1px solid rgba(255,255,255,0.12)",
            },
          },
        }}
      >
        <Stack spacing={2}>
          <Typography variant="subtitle2" fontWeight={750}>
            成交量輪廓參數
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 120 }}>
            <Typography variant="caption" color="rgba(255,255,255,0.6)">分桶數:</Typography>
            <Select
              value={binsCount}
              onChange={(e) => setBinsCount(e.target.value as number | "Auto")}
              size="small"
              sx={{
                color: "white",
                fontSize: 12,
                height: 28,
                minWidth: 70,
                bgcolor: "rgba(255, 255, 255, 0.05)",
                borderRadius: "6px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.12)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.25)",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "primary.main",
                },
                "& .MuiSelect-select": {
                  py: 0.5,
                  px: 1,
                },
              }}
              MenuProps={{
                disableScrollLock: true,
                PaperProps: {
                  sx: {
                    bgcolor: "rgba(30, 30, 40, 0.95)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    "& .MuiMenuItem-root": {
                      fontSize: 12,
                      color: "white",
                      "&.Mui-selected": {
                        bgcolor: "rgba(144, 202, 249, 0.15)",
                      },
                      "&.Mui-selected:hover": {
                        bgcolor: "rgba(144, 202, 249, 0.25)",
                      },
                      "&:hover": {
                        bgcolor: "rgba(255, 255, 255, 0.08)",
                      },
                    },
                  },
                },
              }}
            >
              {binsOptions.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </Stack>
          <Box>
            <Typography variant="caption" color="rgba(255,255,255,0.6)">價值區: {vaRatio}%</Typography>
            <Slider value={vaRatio} onChange={(_, val) => setVaRatio(val as number)} min={50} max={95} step={5} size="small" />
          </Box>

          <FormGroup row sx={{ gap: 1 }}>
            <FormControlLabel control={<Switch checked={showPoc} onChange={e => setShowPoc(e.target.checked)} color="warning" size="small" />} label="POC" />
            <FormControlLabel control={<Switch checked={showVa} onChange={e => setShowVa(e.target.checked)} size="small" />} label="價值區" />
          </FormGroup>

          <ToggleButtonGroup value={align} exclusive onChange={(_, val) => val && setAlign(val)} size="small">
            <ToggleButton value="left"><AlignHorizontalLeft fontSize="small" /></ToggleButton>
            <ToggleButton value="right"><AlignHorizontalRight fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Popover>

      {/* Charts */}
      <Box ref={chartContainerRef} sx={{ flexGrow: 1, minHeight: 0, width: "100%", display: "flex", flexDirection: "column" }}>
        <ResponsiveContainer width="100%" height="70%">
          <ComposedChart data={chartData} syncId="volumeProfileSync" margin={synchronizedChartMargin}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="t" hide />
            <YAxis
              width={48}
              domain={priceDomain}
              allowDataOverflow={false}
              orientation="left"
              stroke="#888"
              fontSize={10}
              tickFormatter={(value: number) =>
                value.toLocaleString("zh-TW", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits:
                    Math.abs(value) >= 100 ? 1 : Math.abs(value) >= 10 ? 2 : 3,
                })
              }
            />
            <YAxis yAxisId="volAxis" orientation="right" width={0} hide />

            <Tooltip content={<ChartTooltip />} />

            <Line dataKey="h" stroke="#fff" opacity={0} dot={false} />
            <Line dataKey="c" stroke="#fff" opacity={0} dot={false} />
            <Line dataKey="l" stroke="#fff" opacity={0} dot={false} />
            <Line dataKey="o" stroke="#fff" opacity={0} dot={false} />

            {showVa && vahPrice > valPrice && <ReferenceArea y1={valPrice} y2={vahPrice} fill="rgba(144, 202, 249, 0.04)" />}

            <Customized component={BaseCandlestickRectangle} />
            <Customized component={(props: any) => <CustomVolumeProfile {...props} bins={bins} align={align} />} />

            {/* POC / VA Lines */}
            {showPoc && pocPrice > 0 && (
              <ReferenceLine y={pocPrice} stroke="#ffeb3b" strokeWidth={1.5} strokeDasharray="3 3" label={{ value: `POC: ${pocPrice.toFixed(2)}`, fill: "#ffeb3b", fontSize: 10, fontWeight: "bold" }} />
            )}
            {showVa && vahPrice > valPrice && (
              <>
                <ReferenceLine y={vahPrice} stroke="rgba(255,255,255,0.35)" strokeDasharray="4 3" label={{ value: `VAH: ${vahPrice.toFixed(2)}`, fill: "rgba(255,255,255,0.5)", fontSize: 9 }} />
                <ReferenceLine y={valPrice} stroke="rgba(255,255,255,0.35)" strokeDasharray="4 3" label={{ value: `VAL: ${valPrice.toFixed(2)}`, fill: "rgba(255,255,255,0.5)", fontSize: 9 }} />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Volume Bar Chart */}
        <ResponsiveContainer width="100%" height="30%">
          <ComposedChart data={chartData} syncId="volumeProfileSync" margin={synchronizedChartMargin}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="t" stroke="#888" fontSize={9} />
            <YAxis
              width={48}
              stroke="#888"
              fontSize={9}
              tickFormatter={(value: number) => {
                if (Math.abs(value) >= 1_000_000) {
                  return `${(value / 1_000_000).toFixed(1)}M`;
                }
                if (Math.abs(value) >= 1_000) {
                  return `${(value / 1_000).toFixed(1)}K`;
                }
                return `${Math.round(value)}`;
              }}
            />
            <Tooltip content={<ChartTooltip />} />

            <Bar dataKey="v" shape={(props: any) => {
              const { x, y, width, height, payload } = props;
              const isUp = payload.c > payload.o;
              return <rect x={x} y={y} width={width} height={height} fill={isUp ? "#ff4d4f" : "#52c41a"} fillOpacity={0.45} />;
            }} />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Container>
  );
}
