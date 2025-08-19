import { dateFormat } from "@ch20026103/anysis";
import { Mode } from "@ch20026103/anysis/dist/esm/stockSkills/utils/dateFormat";
import {
  Box,
  Container,
  Divider,
  Tooltip as MuiTooltip,
  Stack,
  Typography,
} from "@mui/material";
import { useContext } from "react";
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
import useMarketAnalysis from "../../hooks/useMarketAnalysis";
import { UrlTaPerdOptions } from "../../types";

export default function MaKbar({ perd }: { perd: UrlTaPerdOptions }) {
  const deals = useContext(DealsContext);
  const {
    trends: chartData,
    trendChangePoints,
    power,
  } = useMarketAnalysis({
    ta: deals,
    perd,
  });

  // 計算 h 的最大值和 l 的最小值
  const hMax = Math.max(...chartData.map((d) => d.h ?? -Infinity));

  return (
    <Container component="main">
      <Stack spacing={1} direction="row" alignItems="center">
        <MuiTooltip
          title={trendChangePoints?.splice(-5)?.map((point) => (
            <Typography variant="body2" key={point.t}>
              {dateFormat(point.t, Mode.NumberToString)} {point.trend}
            </Typography>
          ))}
          arrow
        >
          <Typography variant="h5" gutterBottom>
            K線
          </Typography>
        </MuiTooltip>
        <Stack  direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" color="textSecondary">
            {chartData.length > 0 && chartData[chartData.length - 1]?.trend}
          </Typography>
          <Divider orientation="vertical" flexItem />
          <Typography variant="body2" color="textSecondary">
            {power}
          </Typography>
        </Stack>
      </Stack>
      <Box height="calc(100vh - 32px)" width="100%">
        <ResponsiveContainer>
          <ComposedChart data={chartData.slice(-160)}>
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
            <Brush dataKey="name" height={20} stroke="#8884d8" />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Container>
  );
}
