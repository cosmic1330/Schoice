import { dateFormat } from "@ch20026103/anysis";
import { Mode } from "@ch20026103/anysis/dist/esm/stockSkills/utils/dateFormat";

/**
 * 將缺口資料轉換為圖表標記資料
 * @param gaps 缺口陣列
 * @param chartData 圖表資料
 * @returns 圖表標記資料
 */
export function convertGapsToChartMarkers(gaps: any[], chartData: any[]) {
  return gaps
    .map((gap) => {
      const dataIndex = chartData.findIndex((data) => data.t === gap.date);

      return {
        ...gap,
        index: dataIndex,
        formattedDate: dateFormat(gap.date, Mode.NumberToString),
        label: `${gap.type === "up" ? "↑" : "↓"} ${gap.size.toFixed(2)}元`,
        color: gap.type === "up" ? "#4CAF50" : "#F44336",
        backgroundColor:
          gap.type === "up"
            ? "rgba(76, 175, 80, 0.1)"
            : "rgba(244, 67, 54, 0.1)",
      };
    })
    .filter((marker) => marker.index !== -1);
}

/**
 * 格式化缺口資訊用於顯示
 * @param gap 缺口資料
 * @returns 格式化的字串
 */
export function formatGapInfo(gap: any): string {
  const typeText = gap.type === "up" ? "向上跳空" : "向下跳空";
  const dateText = dateFormat(gap.date, Mode.NumberToString);

  return `${dateText} ${typeText} ${gap.size.toFixed(
    2
  )}元 (${gap.sizePercent.toFixed(1)}%)`;
}

/**
 * 取得缺口統計資訊
 * @param gaps 缺口陣列
 * @returns 統計資訊
 */
export function getGapStatistics(gaps: any[]) {
  const upGaps = gaps.filter((gap) => gap.type === "up");
  const downGaps = gaps.filter((gap) => gap.type === "down");

  const avgUpGapSize =
    upGaps.length > 0
      ? upGaps.reduce((sum, gap) => sum + gap.sizePercent, 0) / upGaps.length
      : 0;

  const avgDownGapSize =
    downGaps.length > 0
      ? downGaps.reduce((sum, gap) => sum + gap.sizePercent, 0) /
        downGaps.length
      : 0;

  const largestGap = gaps.reduce(
    (largest, gap) => (gap.sizePercent > largest.sizePercent ? gap : largest),
    { sizePercent: 0 }
  );

  return {
    total: gaps.length,
    upCount: upGaps.length,
    downCount: downGaps.length,
    avgUpGapSize: avgUpGapSize.toFixed(2),
    avgDownGapSize: avgDownGapSize.toFixed(2),
    largestGap: largestGap.sizePercent > 0 ? largestGap : null,
  };
}
