import {
  Box,
  Container,
  Tooltip as MuiTooltip,
  Stack,
  Typography,
} from "@mui/material";
import { useContext, useMemo } from "react";
import {
  Area,
  Bar,
  Brush,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import macd from "../../cls_tools/macd";
import rsi from "../../cls_tools/rsi";
import { DealsContext } from "../../context/DealsContext";

export default function MR() {
  const deals = useContext(DealsContext);

  const chartData = useMemo(() => {
    if (deals?.length === 0) return [];
    const response = [];
    let rsi_data = rsi.init(deals[0], 5);
    let macd_data = macd.init(deals[0]);
    response.push({
      rsi: rsi_data.rsi || null,
      osc: macd_data.osc || null,
      long: null,
      short: null,
      positiveOsc: macd_data.osc > 0 ? macd_data.osc : 0,
      negativeOsc: macd_data.osc < 0 ? macd_data.osc : 0,
      ...deals[0],
    });
    for (let i = 1; i < deals.length; i++) {
      const deal = deals[i];
      rsi_data = rsi.next(deal, rsi_data, 5);
      macd_data = macd.next(deal, macd_data);
      response.push({
        rsi: rsi_data.rsi || null,
        osc: macd_data.osc || null,
        long: rsi_data.rsi > 50 && macd_data.osc > 0 ? rsi_data.rsi : null,
        short: rsi_data.rsi < 50 && macd_data.osc < 0 ? rsi_data.rsi : null,
        positiveOsc: macd_data.osc > 0 ? macd_data.osc : 0,
        negativeOsc: macd_data.osc < 0 ? macd_data.osc : 0,
        ...deal,
      });
    }
    return response;
  }, [deals]);

  const longSignals = useMemo(() => {
    return chartData.filter((item, idx, arr) => {
      // 第一筆沒有前一筆，略過
      if (idx === 0) return false;
      const prev = arr[idx - 1];
      if (item.rsi === null || item.osc === null || prev.osc === null)
        return false;
      // rsi 維持大於 50，且當前 osc 要大於前一筆的 osc
      return item.rsi > 50 && item.osc > prev.osc;
    });
  }, [chartData]);

  const shortSignals = useMemo(() => {
    return chartData.filter((item, idx, arr) => {
      if (idx === 0) return false;
      const prev = arr[idx - 1];
      if (item.rsi === null || item.osc === null || prev.osc === null)
        return false;
      // rsi 維持小於 50，且當前 osc 要小於前一筆的 osc
      return item.rsi < 50 && item.osc < prev.osc;
    });
  }, [chartData]);

  return (
    <Container component="main">
      <Stack spacing={1} direction="row" alignItems="center">
        <MuiTooltip
          title={
            <Box>
              <Typography variant="body2">
                1. 當 RSI 線往下穿過中線 (50) 且 Osc 從上往下穿過 0 線
                (綠柱)，代表賣出點。
              </Typography>
              <Typography variant="body2">
                2. 當 RSI 線往上穿過中線 (50) 且 Osc 從下往上穿過 0 線
                (紅柱)，代表買進點。
              </Typography>
            </Box>
          }
          arrow
        >
          <Typography variant="h5" gutterBottom>
            MR 流線圖
          </Typography>
        </MuiTooltip>
      </Stack>
      <Box height="calc(100vh - 32px)" width="100%">
        <ResponsiveContainer width="100%" height="25%">
          <ComposedChart data={chartData} syncId="anySyncId">
            <XAxis dataKey="t" />
            <YAxis />
            <ReferenceLine y={0} stroke="#589bf3" strokeDasharray="3" />
            <Tooltip offset={50} />
            {/* Red bars for positive values */}
            <Bar
              dataKey="positiveOsc"
              fill="#ff0000"
              barSize={6}
              name="Oscillator"
            />
            {/* Green bars for negative values */}
            <Bar
              dataKey="negativeOsc"
              fill="#00aa00"
              barSize={6}
              name="Oscillator"
            />
            <Brush dataKey="name" height={20} stroke="#8884d8" />
          </ComposedChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height="50%">
          <ComposedChart data={chartData} syncId="anySyncId">
            <XAxis dataKey="t" />
            <YAxis domain={["dataMin", "dataMax"]} />
            <Tooltip offset={50} />
            <Line
              dataKey="c"
              stroke="#000"
              dot={false}
              activeDot={false}
              legendType="none"
            />
            {longSignals.map((signal) => (
              <ReferenceDot
                key={signal.t}
                x={signal.t}
                y={signal.c + signal.c * 0.02}
                r={1.5}
                fill={"red"}
                stroke={"none"}
              />
            ))}
            {shortSignals.map((signal) => (
              <ReferenceDot
                key={signal.t}
                x={signal.t}
                y={signal.c - signal.c * 0.02}
                r={1.5}
                fill={"green"}
                stroke={"none"}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height="25%">
          <ComposedChart data={chartData} syncId="anySyncId">
            <XAxis dataKey="t" />
            <YAxis
              domain={["dataMin", "dataMax"]}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip offset={50} />
            <ReferenceLine y={80} stroke="#ff0000" strokeDasharray="5 5" />
            <ReferenceLine y={20} stroke="#ff0000" strokeDasharray="5 5" />
            <ReferenceLine y={50} stroke="#589bf3" strokeDasharray="3" />
            <Line
              dataKey="rsi"
              stroke="#589bf3"
              dot={false}
              activeDot={false}
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="long"
              fill="#faa"
              stroke="#faa"
              baseValue={50}
            />
            <Area
              type="monotone"
              dataKey="short"
              fill="#afa"
              stroke="#afa"
              baseValue={50}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Container>
  );
}
