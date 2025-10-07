interface GapLinesProps {
  chartData: any[];
  gaps: any[];
  isVisible: boolean;
  payload?: any;
  xAxisMap?: any;
  yAxisMap?: any;
  offset?: any;
}

/**
 * 在圖表上繪製缺口線條的組件 - Recharts Customized 組件
 */
export default function GapLines({
  chartData,
  gaps,
  isVisible,
  xAxisMap,
  yAxisMap,
  offset,
}: GapLinesProps) {
  if (!isVisible || !chartData || !gaps || gaps.length === 0) {
    return null;
  }

  // 獲取座標系統
  const xAxis = xAxisMap && (Object.values(xAxisMap)[0] as any);
  const yAxis = yAxisMap && (Object.values(yAxisMap)[0] as any);

  if (!xAxis || !yAxis) {
    return null;
  }

  // 找到圖表顯示範圍內的缺口
  const visibleGaps = gaps.filter((gap) =>
    chartData.some((data) => data.t === gap.date)
  );

  if (visibleGaps.length === 0) {
    return null;
  }

  const { x: offsetX = 0, y: offsetY = 0 } = offset || {};

  return (
    <g className="gap-lines" transform={`translate(${offsetX}, ${offsetY})`}>
      {visibleGaps.map((gap, index) => {
        // 找到缺口在圖表數據中的位置
        const dataIndex = chartData.findIndex((data) => data.t === gap.date);
        if (dataIndex === -1) return null;

        const gapColor = gap.type === "up" ? "#4CAF50" : "#F44336";
        const strokeWidth = gap.filled ? 1 : 2;
        const strokeDasharray = gap.filled ? "5,5" : "none";
        const opacity = gap.filled ? 0.5 : 0.8;

        // 計算Y座標
        const yHigh = yAxis.scale(gap.high);
        const yLow = yAxis.scale(gap.low);

        // X座標範圍
        const xStart = offsetX;
        const xEnd = offsetX + (xAxis.width || 0);

        return (
          <g key={`gap-${gap.date}-${index}`}>
            {/* 缺口上邊界線 */}
            <line
              x1={xStart}
              y1={yHigh}
              x2={xEnd}
              y2={yHigh}
              stroke={gapColor}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              opacity={opacity}
            />
            {/* 缺口下邊界線 */}
            <line
              x1={xStart}
              y1={yLow}
              x2={xEnd}
              y2={yLow}
              stroke={gapColor}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              opacity={opacity}
            />
            {/* 缺口填充區域 */}
            <rect
              x={xStart}
              y={Math.min(yHigh, yLow)}
              width={xEnd - xStart}
              height={Math.abs(yHigh - yLow)}
              fill={gapColor}
              opacity={gap.filled ? 0.05 : 0.1}
            />
            {/* 缺口標籤 */}
            <text
              x={xStart + 10}
              y={yLow + (yHigh - yLow) / 2}
              fontSize="10"
              fill={gapColor}
              opacity={opacity}
              dominantBaseline="middle"
            >
              {gap.type === "up" ? "↑" : "↓"} {gap.size.toFixed(1)}
              {gap.filled ? " (已補)" : ""}
            </text>
          </g>
        );
      })}
    </g>
  );
}
