import { Box } from "@mui/material";
import { forwardRef, useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Customized,
  Line,
  Tooltip as RechartsTooltip,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import BaseCandlestickRectangle from "../../../../components/RechartCustoms/BaseCandlestickRectangle";
import ChartTooltip from "../../Tooltip/ChartTooltip";
import { IchimokuCombinedData, SignalResult } from "../ichimokuStrategy";
import IchimokuCloudArea from "./IchimokuCloudArea";

interface IchimokuChartProps {
  data: IchimokuCombinedData[];
  signals: SignalResult[];
}

const IchimokuChart = forwardRef<HTMLDivElement, IchimokuChartProps>(
  ({ data, signals }, ref) => {
    // Map signals for easy lookup
    const signalMap = useMemo(
      () => new Map(signals.map((s) => [s.t, s])),
      [signals]
    );

    // Merge signals into data for Tooltip to pick up "signalReason" or similar
    const mergedData = useMemo(() => {
      return data.map((d) => {
        const sig = signalMap.get(d.t);
        return {
          ...d,
          signalReason: sig ? sig.reason : undefined,
          signalType: sig ? sig.type : undefined,
        };
      });
    }, [data, signalMap]);

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
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="#fff" />
            <XAxis dataKey="t" hide />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "rgba(255,255,255,0.7)" }}
              stroke="rgba(255,255,255,0.3)"
            />

            <RechartsTooltip content={<ChartTooltip showSignals={true} />} />

            {/* Invisible Lines for Tooltip Value Access & Candlestick Order */}
            {/* Order MUST be: High, Close, Low, Open for BaseCandlestickRectangle */}
            <Line
              dataKey="h"
              stroke="#fff"
              opacity={0}
              dot={false}
              legendType="none"
            />
            <Line
              dataKey="c"
              stroke="#fff"
              opacity={0}
              dot={false}
              legendType="none"
            />
            <Line
              dataKey="l"
              stroke="#fff"
              opacity={0}
              dot={false}
              legendType="none"
            />
            <Line
              dataKey="o"
              stroke="#fff"
              opacity={0}
              dot={false}
              legendType="none"
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
              stroke="#43aa8b"
              strokeWidth={1}
              dot={false}
              name="遲行線"
              strokeDasharray="3 3"
              opacity={0.6}
              connectNulls={false}
            />

            {/* Cloud (Senkou A/B) - Using Area with fills */}
            <Line
              dataKey="senkouA"
              stroke="#2196f3"
              strokeWidth={0.5}
              dot={false}
              name="雲帶A"
              strokeDasharray="2 2"
            />
            <Line
              dataKey="senkouB"
              stroke="#f44336"
              strokeWidth={1}
              dot={false}
              name="雲帶B"
              strokeDasharray="2 2"
            />

            {/* Custom Cloud Area Fill */}
            <Customized component={IchimokuCloudArea} data={data} />

            {/* Candlesticks */}
            <Customized
              component={BaseCandlestickRectangle}
              upColor="#ff4d4f"
              downColor="#52c41a"
            />

            {/* Signal Markers */}
            {data.map((d) => {
              const sig = signalMap.get(d.t);
              if (!sig) return null;

              let color = "#FFD700";
              let icon = "▲";
              let label = "Sig";

              switch (sig.type) {
                case "BUY":
                  color = "#FFD700";
                  icon = "▲";
                  label = "Buy";
                  break;
                case "FAKE":
                  color = "#f44336";
                  icon = "▼";
                  label = "Fake";
                  break;
                case "ACCUMULATION":
                  color = "#2196f3";
                  icon = "●";
                  label = "Accum";
                  break;
                case "WEAKNESS":
                  color = "#ff9800";
                  icon = "X";
                  label = "Weak";
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
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="#fff" />
            <XAxis dataKey="t" hide />
            <YAxis
              domain={[-0.3, 0.3]}
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }}
              stroke="rgba(255,255,255,0.3)"
              label={{
                value: "CMF",
                angle: -90,
                position: "insideLeft",
                fill: "#9c27b0",
              }}
            />
            <RechartsTooltip content={<ChartTooltip showSignals={false} />} />

            <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
            <ReferenceLine
              y={0.1}
              stroke="#4caf50"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />
            <ReferenceLine
              y={-0.1}
              stroke="#f44336"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />

            <Area
              type="monotone"
              dataKey="cmf"
              stroke="#9c27b0"
              fill="url(#colorCmf)"
              strokeWidth={1.5}
              name="CMF"
            />
            <Line
              type="monotone"
              dataKey="cmfEma5"
              stroke="#ff9800"
              strokeWidth={1}
              dot={false}
              name="EMA5"
            />
            <defs>
              <linearGradient id="colorCmf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9c27b0" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#9c27b0" stopOpacity={0} />
              </linearGradient>
            </defs>
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    );
  }
);

export default IchimokuChart;
