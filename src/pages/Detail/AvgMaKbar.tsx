import {
  Box,
  Container,
  Tooltip as MuiTooltip,
  Stack,
  Typography,
} from "@mui/material";
import { useContext, useMemo } from "react";
import {
  Brush,
  ComposedChart,
  Customized,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import ema from "../../cls_tools/ema";
import ArrowDown from "../../components/ArrowDown";
import ArrowUp from "../../components/ArrowUp";
import AvgCandlestickRectangle from "../../components/RechartCustoms/AvgCandlestickRectangle";
import { DealsContext } from "../../context/DealsContext";

export default function AvgMaKbar() {
  const deals = useContext(DealsContext);

  const chartData = useMemo(() => {
    if (deals?.length === 0) return [];
    const response = [];
    let ema5_data = ema.init(deals[0], 5);
    let ema10_data = ema.init(deals[0], 10);
    response.push({
      ema5: ema5_data.ema || null,
      ema10: ema10_data.ema || null,
      ...deals[0],
    });
    for (let i = 1; i < deals.length; i++) {
      const deal = deals[i];
      ema5_data = ema.next(deal, ema5_data, 5);
      ema10_data = ema.next(deal, ema10_data, 10);
      response.push({
        ema10: ema10_data.ema || null,
        ema5: ema5_data.ema || null,
        ...deal,
      });
    }
    return response;
  }, [deals]);
  // 計算 h 的最大值和 l 的最小值
  const hMax =
    +chartData.length === 0
      ? 0
      : Math.max(...chartData.map((d) => d.h ?? -Infinity));

  // 找出ema和ema10交叉的點
  const singals = useMemo(() => {
    const points = [];
    for (let i = 1; i < chartData.length; i++) {
      const prev = chartData[i - 1];
      const curr = chartData[i];
      if (
        prev.ema5 !== null &&
        prev.ema10 !== null &&
        curr.ema5 !== null &&
        curr.ema10 !== null
      ) {
        if (prev.ema5 < prev.ema10 && curr.ema5 > curr.ema10) {
          points.push({
            ...curr,
            type: "golden",
          });
        } else if (prev.ema5 > prev.ema10 && curr.ema5 < curr.ema10) {
          points.push({
            ...curr,
            type: "death",
          });
        }
      }
    }
    return points;
  }, [chartData]);

  return (
    <Container component="main">
      <Stack spacing={1} direction="row" alignItems="center">
        <MuiTooltip
          title={
            <Typography>
              判斷上漲動能是否延續
              <br />
              紅色：多方動能
              <br />
              綠色：空方動能
              <br />
              柱體：越長越強
            </Typography>
          }
          arrow
        >
          <Typography variant="h5" gutterBottom>
            均K力道指標
          </Typography>
        </MuiTooltip>
        {chartData.length > 0 &&
        chartData[chartData.length - 1].ema5 !== null &&
        chartData[chartData.length - 1].ema10 !== null &&
        chartData[chartData.length - 1].ema5! >
          chartData[chartData.length - 1].ema10! ? (
          <ArrowUp color="#e26d6d" />
        ) : (
          <ArrowDown color="#79e26d" />
        )}
      </Stack>
      <Box height="calc(100vh - 32px)" width="100%">
        <ResponsiveContainer>
          <ComposedChart data={chartData.slice(-160)}>
            <XAxis dataKey="t" />
            <YAxis domain={["dataMin", hMax]} dataKey="l" />
            <ZAxis type="number" range={[10]} />
            <Tooltip offset={10} />

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
            <Customized component={AvgCandlestickRectangle} />

            <Line
              dataKey="ema5"
              stroke="#589bf3"
              dot={false}
              activeDot={false}
              legendType="none"
            />
            <Line
              dataKey="ema10"
              stroke="#ff7300"
              dot={false}
              activeDot={false}
              legendType="none"
            />
            {singals.map((signal) => (
              <ReferenceDot
                key={signal.t}
                x={signal.t}
                y={
                  signal.type === "golden" ? signal.ema5! + signal.ema5!*0.015 : signal.ema5! - signal.ema5!*0.015
                }
                r={2}
                fill={signal.type === "golden" ? "#e26d6d" : "#79e26d"}
                stroke="none"
              />
            ))}
            <Brush dataKey="name" height={5} stroke="#8884d8" />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Container>
  );
}
