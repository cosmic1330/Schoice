import { Box } from "@mui/material";
import { forwardRef, useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Customized,
  Label,
  Line,
  Tooltip as RechartsTooltip,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import BaseCandlestickRectangle from "../../../../components/RechartCustoms/BaseCandlestickRectangle";
import ChartTooltip from "../../Tooltip/ChartTooltip";
import { IchimokuCombinedData, SignalResult } from "../ichimokuStrategy";

interface IchimokuChartProps {
  data: IchimokuCombinedData[];
  signals: SignalResult[];
  cmfEmaPeriod?: number;
  timeframeLabel: string;
  onHoverChange?: (index: number | null) => void;
}

const IchimokuChart = forwardRef<HTMLDivElement, IchimokuChartProps>(
  ({ data, signals, cmfEmaPeriod = 5, timeframeLabel, onHoverChange }, ref) => {
    // Map signals for easy lookup
    const signalMap = useMemo(
      () => new Map(signals.map((s) => [String(s.t), s])),
      [signals],
    );

    // Calculate baseline avgPrice once for thickness comparison
    const avgPrice = useMemo(() => {
      let sum = 0;
      let count = 0;
      data.forEach((d) => {
        if (d.c) {
          sum += d.c;
          count++;
        }
      });
      return sum / (count || 1);
    }, [data]);

    // Merge signals and calculate per-bar future analysis
    const mergedData = useMemo(() => {
      return data.map((d) => {
        const sig = signalMap.get(String(d.t));
        const isBull =
          d.senkouA !== null && d.senkouB !== null && d.senkouA > d.senkouB;
        const isBear =
          d.senkouA !== null && d.senkouB !== null && d.senkouB > d.senkouA;

        // Future Analysis & Current Status
        const isFuture = d.c === null;
        let futureTrend = "";
        let futureReason = "";
        let currentStatus = "";
        let thicknessStatus = "";

        if (d.senkouA !== null && d.senkouB !== null) {
          const thickness = Math.abs(d.senkouA - d.senkouB);
          const ratio = thickness / (avgPrice || 1);
          const cloudTop = Math.max(d.senkouA, d.senkouB);
          const cloudBottom = Math.min(d.senkouA, d.senkouB);

          thicknessStatus =
            ratio > 0.03 ? "厚雲位 (強支撐/阻力)" : "薄雲位 (易突破)";

          if (isFuture) {
            futureTrend = isBull
              ? "未來趨勢：多頭趨勢 (陽雲)"
              : "未來趨勢：空頭趨勢 (陰雲)";
            if (ratio > 0.03) {
              futureReason = isBull
                ? "先行雲厚實：未來強大支撐"
                : "先行雲厚實：未來強大阻力";
            } else if (ratio > 0.01) {
              futureReason = "預計未來波動性增加";
            } else {
              const isTwistNext = ratio < 0.002;
              futureReason = isTwistNext
                ? "預計未來發生 Kumo Twist 趨勢轉向"
                : "先行雲薄弱：預計未來支撐下降";
            }
          } else if (d.c !== null) {
            // Historical Logic
            if (d.c > cloudTop) {
              currentStatus = isBear
                ? "突破陰雲：看多 (空轉多訊號)"
                : "位於陽雲上方：偏多強勢";
            } else if (d.c < cloudBottom) {
              currentStatus = isBull
                ? "跌破陽雲：看空 (多轉空訊號)"
                : "位於陰雲下方：偏空弱勢";
            } else {
              currentStatus = "位於雲層內：行情整理中";
            }
          }
        }

        const cmfBull =
          d.cmf !== null && d.cmf !== undefined
            ? d.cmf >= 0
              ? d.cmf
              : 0
            : null;
        const cmfBear =
          d.cmf !== null && d.cmf !== undefined
            ? d.cmf < 0
              ? d.cmf
              : 0
            : null;

        return {
          ...d,
          signalReason: sig ? sig.reason : undefined,
          signalType: sig ? sig.type : undefined,
          bullCloud:
            isBull || d.senkouA === d.senkouB ? [d.senkouB, d.senkouA] : null,
          bearCloud:
            isBear || d.senkouA === d.senkouB ? [d.senkouA, d.senkouB] : null,
          cmfBull,
          cmfBear,
          isFuture,
          futureTrend,
          futureReason,
          currentStatus,
          thicknessStatus,
        };
      });
    }, [data, signalMap, avgPrice]);

    // Find the transition point to future cloud
    const todayBarT = useMemo(() => {
      for (let i = mergedData.length - 1; i >= 0; i--) {
        if (mergedData[i].c !== null) return mergedData[i].t;
      }
      return null;
    }, [mergedData]);

    const futureAnalysis = useMemo(() => {
      if (!todayBarT) return null;
      const todayIdx = mergedData.findIndex((d) => d.t === todayBarT);
      if (todayIdx === -1) return null;

      const futureData = mergedData.slice(todayIdx + 1);
      if (futureData.length === 0) return null;

      let hasTwist = false;
      let twistIdx = -1;
      let maxThickness = 0;
      let firstThickness = 0;
      let lastThickness = 0;

      for (let i = 0; i < futureData.length; i++) {
        const d = futureData[i];
        if (d.senkouA === null || d.senkouB === null) continue;

        const currentBull = d.senkouA > d.senkouB;
        const thickness = Math.abs(d.senkouA - d.senkouB);

        if (i === 0) firstThickness = thickness;
        if (i === futureData.length - 1) lastThickness = thickness;
        if (thickness > maxThickness) maxThickness = thickness;

        // 檢查翻轉 (Kumo Twist)
        if (i > 0) {
          const prev = futureData[i - 1];
          if (prev.senkouA !== null && prev.senkouB !== null) {
            const prevBull = prev.senkouA > prev.senkouB;
            if (currentBull !== prevBull) {
              hasTwist = true;
              twistIdx = i;
            }
          }
        }
      }

      const lastBar = futureData[futureData.length - 1];
      if (!lastBar || lastBar.senkouA === null || lastBar.senkouB === null)
        return null;

      const isLastBull = lastBar.senkouA > lastBar.senkouB;
      const isExpanding = lastThickness > firstThickness * 1.1;

      // 計算預期壓力/支撐點位 (取最後一期的邊界)
      const cloudTop = Math.max(lastBar.senkouA, lastBar.senkouB);
      const cloudBottom = Math.min(lastBar.senkouA, lastBar.senkouB);
      const targetPrice = isLastBull ? cloudBottom : cloudTop;
      const priceLabel = isLastBull ? "支撐位" : "壓力位";

      // 專業術語判定 (精簡版)
      let trendStatus = isLastBull ? "多方主導 (支撐)" : "空方主導 (壓力)";
      let structureStr = `${priceLabel}: ${targetPrice.toFixed(2)}`;

      if (isExpanding) structureStr += " | 力道強化";
      else if (lastThickness < firstThickness * 0.9)
        structureStr += " | 趨勢轉弱";
      else structureStr += " | 走勢穩";

      if (hasTwist && twistIdx !== -1) {
        structureStr = `★ 第 ${twistIdx} 期預期轉向 | ${structureStr}`;
      } else if (hasTwist) {
        structureStr = `★ 預期轉向 | ${structureStr}`;
      }

      return {
        isBull: isLastBull,
        trendSymbol: trendStatus,
        structureSymbol: structureStr,
        targetPrice,
        lastBarT: lastBar.t,
        midBarT: futureData[Math.floor(futureData.length / 2)]?.t || lastBar.t,
        midBarY:
          ((futureData[Math.floor(futureData.length / 2)]?.senkouA || 0) +
            (futureData[Math.floor(futureData.length / 2)]?.senkouB || 0)) /
          2,
        futureStart: futureData[0].t,
        futureEnd: lastBar.t,
      };
    }, [mergedData, todayBarT, avgPrice, timeframeLabel]);

    // Calculate max absolute value for CMF y-axis to center 0
    const cmfDomain = useMemo(() => {
      let maxAbs = 0.3; // Default minimum range
      mergedData.forEach((d) => {
        if (d.cmf !== null && d.cmf !== undefined) {
          const val = Math.abs(d.cmf);
          if (val > maxAbs) maxAbs = val;
        }
        if (d.cmfEma5 !== null && d.cmfEma5 !== undefined) {
          const val = Math.abs(d.cmfEma5);
          if (val > maxAbs) maxAbs = val;
        }
      });
      // Add a little padding
      maxAbs = maxAbs * 1.1;
      return [-maxAbs, maxAbs];
    }, [mergedData]);

    return (
      <Box
        ref={ref}
        sx={{
          flexGrow: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          width: "100%",
        }}
      >
        {/* 1. Main Chart: Price + Ichimoku (75%) */}
        <ResponsiveContainer width="100%" height="75%">
          <ComposedChart
            data={mergedData}
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
            syncId="ichiSync"
            onMouseMove={(e) => {
              if (e.activeTooltipIndex !== undefined && onHoverChange) {
                onHoverChange(e.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => {
              if (onHoverChange) onHoverChange(null);
            }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="#fff" />
            <XAxis dataKey="t" hide />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "rgba(255,255,255,0.7)" }}
              stroke="rgba(255,255,255,0.3)"
            />

            <RechartsTooltip
              content={<ChartTooltip showSignals={true} />}
              isAnimationActive={false}
            />

            {/* Invisible Lines for Tooltip Value Access & Candlestick Order */}
            {/* Order MUST be: High, Close, Low, Open for BaseCandlestickRectangle */}
            <Line
              dataKey="h"
              stroke="#fff"
              opacity={0}
              dot={false}
              legendType="none"
              name="高"
            />
            <Line
              dataKey="c"
              stroke="#fff"
              opacity={0}
              dot={false}
              legendType="none"
              name="收"
            />
            <Line
              dataKey="l"
              stroke="#fff"
              opacity={0}
              dot={false}
              legendType="none"
              name="低"
            />
            <Line
              dataKey="o"
              stroke="#fff"
              opacity={0}
              dot={false}
              legendType="none"
              name="開"
            />
            {/* Ichimoku Lines */}
            <Line
              dataKey="tenkan"
              stroke="#0496ff"
              strokeWidth={1}
              dot={false}
              name="轉換線"
            />
            <Line
              dataKey="kijun"
              stroke="#991515"
              strokeWidth={1}
              dot={false}
              name="基準線"
            />
            <Line
              dataKey="chikou"
              stroke="#f0942cff"
              strokeWidth={2}
              dot={false}
              name="遲行線"
              strokeDasharray="3 3"
              opacity={0.6}
              connectNulls={false}
            />

            {/* Cloud (Senkou A/B) - Using standard Area with fills */}
            <Area
              dataKey="bullCloud"
              fill="#ff4d4f"
              fillOpacity={0.2}
              stroke="#ff4d4f"
              strokeWidth={0.5}
              strokeDasharray="2 2"
              dot={false}
              activeDot={false}
              connectNulls={false}
              name="先行雲(陽)"
            />
            <Area
              dataKey="bearCloud"
              fill="#52c41a"
              fillOpacity={0.2}
              stroke="#52c41a"
              strokeWidth={0.5}
              strokeDasharray="2 2"
              dot={false}
              activeDot={false}
              connectNulls={false}
              name="先行雲(陰)"
            />

            {/* 1. Future Projection Area Highlight */}
            {futureAnalysis && (
              <ReferenceArea
                x1={futureAnalysis.futureStart}
                x2={futureAnalysis.futureEnd}
                fill="rgba(255,255,255,0.03)"
                stroke="none"
              />
            )}

            {/* 2. Today Marker with Label */}
            {todayBarT && (
              <ReferenceLine
                x={todayBarT}
                stroke="#fff"
                strokeOpacity={0.8}
                strokeWidth={1.5}
                strokeDasharray="3 3"
              >
                <Label
                  value={`歷史 | ${timeframeLabel}預測`}
                  position="top"
                  fill="#90caf9"
                  fontSize={10}
                  offset={10}
                />
              </ReferenceLine>
            )}

            {/* 2.5 Support/Resistance Target Line */}
            {futureAnalysis && (
              <ReferenceLine
                y={futureAnalysis.targetPrice}
                stroke={futureAnalysis.isBull ? "#4caf50" : "#f44336"}
                strokeDasharray="3 3"
                strokeOpacity={0.6}
                strokeWidth={1}
              />
            )}

            {/* 3. Future Trend Analysis Labels */}
            {futureAnalysis && (
              <>
                <ReferenceLine
                  x={futureAnalysis.lastBarT}
                  stroke="rgba(255,255,255,0.2)"
                  strokeDasharray="2 2"
                />
                <ReferenceDot
                  x={futureAnalysis.midBarT}
                  y={futureAnalysis.midBarY}
                  r={0}
                  shape={(props: any) => {
                    const { cx, cy } = props;
                    const structureParts =
                      futureAnalysis.structureSymbol.split(" | ");

                    return (
                      <g>
                        {/* 1. 時間區間 */}
                        <text
                          x={cx}
                          y={cy}
                          dy={-45}
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.7)"
                          fontSize={11}
                          fontWeight="bold"
                        >
                          {`[ ${timeframeLabel}展望 ]`}
                        </text>

                        {/* 2. 趨勢狀態 */}
                        <text
                          x={cx}
                          y={cy}
                          dy={-25}
                          textAnchor="middle"
                          fill="#fff"
                          fontSize={13}
                          fontWeight="bold"
                        >
                          {futureAnalysis.trendSymbol}
                        </text>

                        {/* 3. 結構與力道 (行1) */}
                        {structureParts.length > 1 && (
                          <text
                            x={cx}
                            y={cy}
                            dy={-5}
                            textAnchor="middle"
                            fill="#ffeb3b"
                            fontSize={11}
                          >
                            {structureParts[0]}
                          </text>
                        )}

                        {/* 4. 結構與力道 (行2) */}
                        <text
                          x={cx}
                          y={cy}
                          dy={structureParts.length > 1 ? 12 : -5}
                          textAnchor="middle"
                          fill="#ffeb3b"
                          fontSize={11}
                        >
                          {structureParts[structureParts.length - 1]}
                        </text>

                        {/* 4. 底部標註小字 */}
                        <text
                          x={cx}
                          y={cy}
                          dy={25}
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.4)"
                          fontSize={10}
                        >
                          {`- ${timeframeLabel}格局預估 -`}
                        </text>
                      </g>
                    );
                  }}
                />
              </>
            )}

            {/* Candlesticks */}
            <Customized
              component={BaseCandlestickRectangle}
              upColor="#ff4d4f"
              downColor="#52c41a"
            />

            {/* Signal Markers */}
            {data.map((d) => {
              const sig = signalMap.get(String(d.t));
              if (!sig) return null;

              let color = "#FFD700";
              let icon = "▲";
              let label = "Sig";

              switch (sig.type) {
                case "ACCUMULATION":
                  color = "#2196f3";
                  icon = "●";
                  label = "Accum";
                  break;
                case "DIVERGENCE_BULL":
                  color = "#ff5252"; // Taiwan Red for Buy
                  icon = "▲";
                  label = "底背離";
                  break;
                case "DIVERGENCE_BEAR":
                  color = "#00e676"; // Taiwan Green for Sell
                  icon = "▼";
                  label = "頂背離";
                  break;
                case "EXIT":
                  color = "#4caf50";
                  icon = "X";
                  label = "Exit";
                  break;
              }

              return (
                <ReferenceDot
                  key={`sig-${d.t}`}
                  x={d.t}
                  y={sig.price}
                  r={5}
                  stroke="none"
                  shape={(props: any) => {
                    const { cx, cy } = props;
                    return (
                      <g>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={10}
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
                          dy={22}
                          textAnchor="middle"
                          fill={color}
                          fontSize={8}
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

        {/* 2. CMF Chart (25%) */}
        <ResponsiveContainer width="100%" height="25%">
          <ComposedChart
            data={mergedData}
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
            syncId="ichiSync"
          >
            <defs>
              {/* Bullish CMF Area Gradient (Taiwan Red) */}
              <linearGradient id="colorCmfBull" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff4d4f" stopOpacity={0.24} />
                <stop offset="100%" stopColor="#ff4d4f" stopOpacity={0.0} />
              </linearGradient>
              {/* Bearish CMF Area Gradient (Taiwan Green) - Fades from bottom up to 0 */}
              <linearGradient id="colorCmfBear" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#52c41a" stopOpacity={0.24} />
                <stop offset="100%" stopColor="#52c41a" stopOpacity={0.0} />
              </linearGradient>
              {/* Premium Glow Filter for CMF Line */}
              <filter id="cmfGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.06} stroke="#fff" />
            <XAxis dataKey="t" hide />
            <YAxis
              domain={cmfDomain as any}
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }}
              tickFormatter={(value) => value.toFixed(2)}
              stroke="rgba(255,255,255,0.3)"
              label={{
                value: "CMF",
                angle: -90,
                position: "insideLeft",
                fill: "rgba(255, 255, 255, 0.7)",
                style: { fontSize: 10, fontWeight: "bold" },
              }}
            />
            <RechartsTooltip
              content={<ChartTooltip showSignals={true} showIchimoku={false} />}
              isAnimationActive={false}
            />

            {/* Base Reference Lines */}
            <ReferenceLine
              y={0}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth={1}
            />
            <ReferenceLine
              y={0.1}
              stroke="rgba(255, 77, 79, 0.45)"
              strokeDasharray="3 3"
              label={{
                value: "+0.10 強勢吸籌",
                position: "insideBottomLeft",
                fill: "rgba(255, 77, 79, 0.75)",
                fontSize: 10,
                fontWeight: "bold",
              }}
            />
            <ReferenceLine
              y={-0.1}
              stroke="rgba(82, 196, 26, 0.45)"
              strokeDasharray="3 3"
              label={{
                value: "-0.10 資金流出",
                position: "insideTopLeft",
                fill: "rgba(82, 196, 26, 0.75)",
                fontSize: 10,
                fontWeight: "bold",
              }}
            />

            {/* Bullish Positive Flow Area */}
            <Area
              type="monotone"
              dataKey="cmfBull"
              stroke="none"
              fill="url(#colorCmfBull)"
              baseValue={0}
              connectNulls={false}
              isAnimationActive={false}
              legendType="none"
            />

            {/* Bearish Negative Flow Area */}
            <Area
              type="monotone"
              dataKey="cmfBear"
              stroke="none"
              fill="url(#colorCmfBear)"
              baseValue={0}
              connectNulls={false}
              isAnimationActive={false}
              legendType="none"
            />

            {/* Premium Silver-White CMF Line */}
            <Line
              type="monotone"
              dataKey="cmf"
              stroke="rgba(255, 255, 255, 0.85)"
              strokeWidth={1.8}
              dot={false}
              activeDot={{
                r: 4,
                stroke: "rgba(255, 255, 255, 0.95)",
                strokeWidth: 1,
                fill: "#fff",
              }}
              name="CMF"
            />

            {/* Muted and Subdued CMF EMA Line */}
            <Line
              type="monotone"
              dataKey="cmfEma5"
              stroke="rgba(255, 183, 77, 0.45)"
              strokeWidth={1.2}
              strokeDasharray="4 3"
              dot={false}
              activeDot={false}
              name={`EMA${cmfEmaPeriod}`}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    );
  },
);

export default IchimokuChart;
