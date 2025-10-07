import { Rectangle } from "recharts";

interface GapMarkerProps {
  chartData: any[];
  gaps: any[];
  payload?: any;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

/**
 * 在圖表上標記跳空缺口的組件
 */
export default function GapMarker({
  chartData,
  gaps,
  ...props
}: GapMarkerProps) {
  if (!chartData || !gaps || gaps.length === 0) {
    return null;
  }

  // 取得圖表顯示範圍內的缺口
  const visibleGaps = gaps.filter((gap) =>
    chartData.some((data) => data.t === gap.date)
  );

  return (
    <g>
      {visibleGaps.map((gap, index) => {
        // 找到缺口在圖表數據中的位置
        const dataIndex = chartData.findIndex((data) => data.t === gap.date);
        if (dataIndex === -1) return null;

        // 計算缺口在圖表中的位置和大小
        const xPosition = (dataIndex * (props.width || 0)) / chartData.length;
        const gapHeight = Math.abs(gap.high - gap.low);
        const yPosition = gap.type === "up" ? gap.low : gap.high;

        return (
          <Rectangle
            key={`gap-${gap.date}-${index}`}
            x={xPosition}
            y={yPosition}
            width={10} // 固定寬度
            height={gapHeight}
            fill={
              gap.type === "up"
                ? "rgba(76, 175, 80, 0.3)"
                : "rgba(244, 67, 54, 0.3)"
            }
            stroke={gap.type === "up" ? "#4CAF50" : "#F44336"}
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        );
      })}
    </g>
  );
}
