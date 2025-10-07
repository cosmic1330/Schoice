import { dateFormat } from "@ch20026103/anysis";
import { Mode } from "@ch20026103/anysis/dist/esm/stockSkills/utils/dateFormat";
import InfoIcon from "@mui/icons-material/Info";
import {
  Box,
  Container,
  Divider,
  IconButton,
  Tooltip as MuiTooltip,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useContext, useState } from "react";
import {
  Brush,
  ComposedChart,
  Customized,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import BaseCandlestickRectangle from "../../components/RechartCustoms/BaseCandlestickRectangle";
import { DealsContext } from "../../context/DealsContext";
import { useGapDetection } from "../../hooks/useGapDetection";
import { useGapVisualization } from "../../hooks/useGapVisualization";
import useMarketAnalysis from "../../hooks/useMarketAnalysis";
import { UrlTaPerdOptions } from "../../types";

export default function MaKbar({ perd }: { perd: UrlTaPerdOptions }) {
  const deals = useContext(DealsContext);
  const [showGaps, setShowGaps] = useState(true); // 控制缺口顯示的狀態

  const {
    trends: chartData,
    trendChangePoints,
    power,
  } = useMarketAnalysis({
    ta: deals,
    perd,
  });

  // 檢測跳空缺口
  const {
    gaps,
    recentGaps,
    totalGaps,
    upGapsCount,
    downGapsCount,
    unfilledGapsCount,
  } = useGapDetection(deals.slice(-160), 1.0); // 設定最小缺口為 1%

  // 準備缺口視覺化數據
  const { gapLines, enhancedChartData } = useGapVisualization({
    gaps,
    chartData,
    isVisible: showGaps,
  });

  // 計算 h 的最大值和 l 的最小值
  const hMax = Math.max(...enhancedChartData.map((d) => d.h ?? -Infinity));

  return (
    <Container component="main">
      <Stack spacing={1}>
        {/* 第一行：標題和趨勢資訊 */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h5">K線</Typography>
          <MuiTooltip
            title={trendChangePoints?.splice(-5)?.map((point) => (
              <Typography variant="body2" key={point.t}>
                {dateFormat(point.t, Mode.NumberToString)} {point.trend}
              </Typography>
            ))}
            arrow
          >
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </MuiTooltip>
          <Typography variant="body2" color="textSecondary">
            {chartData.length > 0 && chartData[chartData.length - 1]?.trend}
          </Typography>
          <Divider orientation="vertical" flexItem />
          <Typography variant="body2" color="textSecondary">
            {power}
          </Typography>
        </Stack>

        {/* 第二行：缺口資訊和控制項 */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" color="textSecondary">
              缺口: {totalGaps} (↑{upGapsCount} ↓{downGapsCount} 未補
              {unfilledGapsCount})
            </Typography>
            <MuiTooltip
              title={
                <div>
                  <Typography variant="body2" gutterBottom>
                    最近跳空缺口:
                  </Typography>
                  {recentGaps.map((gap) => (
                    <Typography
                      variant="caption"
                      key={gap.date}
                      display="block"
                    >
                      {dateFormat(gap.date, Mode.NumberToString)}{" "}
                      {gap.type === "up" ? "↑" : "↓"}
                      {gap.size.toFixed(2)}元 ({gap.sizePercent.toFixed(1)}%)
                      <br />
                      前日高:{gap.previousHigh} 當日低:{gap.currentLow}
                    </Typography>
                  ))}
                  {recentGaps.length === 0 && (
                    <Typography variant="caption">無最近缺口</Typography>
                  )}
                </div>
              }
              arrow
            >
              <IconButton size="small">
                <InfoIcon fontSize="small" />
              </IconButton>
            </MuiTooltip>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" color="textSecondary">
              顯示缺口
            </Typography>
            <Switch
              size="small"
              checked={showGaps}
              onChange={(e) => setShowGaps(e.target.checked)}
              color="primary"
            />
          </Stack>
        </Stack>
      </Stack>
      <Box height="calc(100vh - 64px)" width="100%">
        <ResponsiveContainer>
          <ComposedChart data={enhancedChartData.slice(-160)}>
            <XAxis dataKey="t" />
            <YAxis domain={["dataMin", hMax]} dataKey="l" />
            <ZAxis type="number" range={[10]} />
            <Tooltip offset={50} />
            <Line
              dataKey="h"
              stroke="#000"
              opacity={0} // 設置透明度為 0，隱藏線條
              dot={false}
              activeDot={false}
              legendType="none"
            />
            <Line
              dataKey="c"
              stroke="#000"
              opacity={0} // 設置透明度為 0，隱藏線條
              dot={false}
              activeDot={false}
              legendType="none"
            />
            <Line
              dataKey="l"
              stroke="#000"
              opacity={0} // 設置透明度為 0，隱藏線條
              dot={false}
              activeDot={false}
              legendType="none"
            />
            <Line
              dataKey="o"
              stroke="#000"
              opacity={0} // 設置透明度為 0，隱藏線條
              dot={false}
              activeDot={false}
              legendType="none"
            />
            <Customized component={BaseCandlestickRectangle} />
            <Line
              dataKey="ma5"
              stroke="#589bf3"
              dot={false}
              activeDot={false}
              legendType="none"
            />
            <Line
              dataKey="ma10"
              stroke="#b277f2"
              dot={false}
              activeDot={false}
              legendType="none"
            />
            <Line
              dataKey="ma20"
              stroke="#ff7300"
              dot={false}
              activeDot={false}
              legendType="none"
            />
            <Line
              dataKey="ma60"
              stroke="#63c762"
              dot={false}
              activeDot={false}
              legendType="none"
            />
            {/* 缺口線條 - 條件渲染 */}
            {showGaps &&
              gapLines
                .map((gap) => [
                  <Line
                    key={`gap-upper-${gap.date}`}
                    dataKey={`gap_upper_${gap.date}`}
                    stroke={gap.upperLine.stroke}
                    strokeWidth={gap.upperLine.strokeWidth}
                    strokeDasharray={gap.upperLine.strokeDasharray}
                    opacity={gap.upperLine.opacity}
                    dot={false}
                    activeDot={false}
                    legendType="none"
                  />,
                  <Line
                    key={`gap-lower-${gap.date}`}
                    dataKey={`gap_lower_${gap.date}`}
                    stroke={gap.lowerLine.stroke}
                    strokeWidth={gap.lowerLine.strokeWidth}
                    strokeDasharray={gap.lowerLine.strokeDasharray}
                    opacity={gap.lowerLine.opacity}
                    dot={false}
                    activeDot={false}
                    legendType="none"
                  />,
                ])
                .flat()}
            <Brush dataKey="name" height={10} stroke="#8884d8" />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Container>
  );
}
