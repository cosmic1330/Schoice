import { ComposedChart, Customized, Line, XAxis, YAxis } from "recharts";
import BaseCandlestickRectangle from "../../RechartCustoms/BaseCandlestickRectangle";
import { UltraTinyIndicatorColor } from "./config";

interface DataPoint {
  o: number;
  h: number;
  l: number;
  c: number;
  [key: string]: any;
}

export default function UltraTinyCandlestickChart({
  data,
}: {
  data: DataPoint[];
}) {
  if (!data || data.length === 0) return null;

  return (
    <ComposedChart
      data={data}
      width={80}
      height={60}
      margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
    >
      <XAxis hide />
      <YAxis domain={["dataMin", "dataMax"]} hide />

      {/* Providing data to BaseCandlestickRectangle via invisible Lines (Matching MaKbar.tsx pattern) */}
      {/* Order matters: h, c, l, o mapped to index 0, 1, 2, 3 in BaseCandlestickRectangle */}
      <Line
        dataKey="h"
        stroke="#fff"
        opacity={0}
        dot={false}
        activeDot={false}
        isAnimationActive={false}
      />
      <Line
        dataKey="c"
        stroke="#fff"
        opacity={0}
        dot={false}
        activeDot={false}
        isAnimationActive={false}
      />
      <Line
        dataKey="l"
        stroke="#fff"
        opacity={0}
        dot={false}
        activeDot={false}
        isAnimationActive={false}
      />
      <Line
        dataKey="o"
        stroke="#fff"
        opacity={0}
        dot={false}
        activeDot={false}
        isAnimationActive={false}
      />

      <Customized
        component={BaseCandlestickRectangle}
        upColor="#f44336"
        downColor="#4caf50"
        candleWidth={3}
      />

      {/* MA Lines */}
      {UltraTinyIndicatorColor.map((item, index) => (
        <Line
          key={index}
          type="monotone"
          dataKey={item.key}
          stroke={item.color}
          strokeWidth={1}
          dot={false}
          isAnimationActive={false}
        />
      ))}
    </ComposedChart>
  );
}
