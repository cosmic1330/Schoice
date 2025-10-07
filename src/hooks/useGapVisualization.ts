import { useMemo } from "react";

interface UseGapVisualizationProps {
  gaps: any[];
  chartData: any[];
  isVisible: boolean;
}

/**
 * 準備缺口視覺化數據的 Hook
 */
export function useGapVisualization({
  gaps,
  chartData,
  isVisible,
}: UseGapVisualizationProps) {
  const gapLines = useMemo(() => {
    if (!isVisible || !gaps || gaps.length === 0) {
      return [];
    }

    return gaps.map((gap) => ({
      ...gap,
      // 為每個缺口創建兩條線：上邊界和下邊界
      upperLine: {
        name: `gap-upper-${gap.date}`,
        stroke: gap.type === "up" ? "#F44336" : "#4CAF50", // 向上跳空用紅色，向下跳空用綠色
        strokeWidth: gap.filled ? 1 : 2,
        strokeDasharray: gap.filled ? "5,5" : "none",
        opacity: gap.filled ? 0.5 : 0.8,
        value: gap.high,
      },
      lowerLine: {
        name: `gap-lower-${gap.date}`,
        stroke: gap.type === "up" ? "#F44336" : "#4CAF50", // 向上跳空用紅色，向下跳空用綠色
        strokeWidth: gap.filled ? 1 : 2,
        strokeDasharray: gap.filled ? "5,5" : "none",
        opacity: gap.filled ? 0.5 : 0.8,
        value: gap.low,
      },
    }));
  }, [gaps, isVisible]);

  // 將缺口數據合併到圖表數據中
  const enhancedChartData = useMemo(() => {
    if (!isVisible || gapLines.length === 0) {
      return chartData;
    }

    return chartData.map((dataPoint) => {
      const newDataPoint = { ...dataPoint };

      // 為每個缺口添加對應的線條數據
      gapLines.forEach((gap) => {
        // 只有在缺口發生之後的數據點才顯示缺口線條
        // 但要檢查缺口是否已被回補
        if (dataPoint.t >= gap.date) {
          // 檢查是否已被回補：價格是否觸及缺口區間
          let isFilledAtThisPoint = false;

          if (gap.type === "up") {
            // 向上跳空：如果當天最低價觸及缺口下邊界，則已回補
            isFilledAtThisPoint = dataPoint.l <= gap.low;
          } else {
            // 向下跳空：如果當天最高價觸及缺口上邊界，則已回補
            isFilledAtThisPoint = dataPoint.h >= gap.high;
          }

          // 如果缺口尚未回補，繼續顯示線條
          if (!gap.filled || dataPoint.t === gap.date || !isFilledAtThisPoint) {
            newDataPoint[`gap_upper_${gap.date}`] = gap.upperLine.value;
            newDataPoint[`gap_lower_${gap.date}`] = gap.lowerLine.value;
          }
        }
      });

      return newDataPoint;
    });
  }, [chartData, gapLines, isVisible]);

  return {
    gapLines,
    enhancedChartData,
  };
}
