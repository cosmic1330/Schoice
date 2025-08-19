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
import kd from "../../cls_tools/kd";
import macd from "../../cls_tools/macd";
import { DealsContext } from "../../context/DealsContext";

export default function MJ() {
  const deals = useContext(DealsContext);

  const chartData = useMemo(() => {
    if (deals?.length === 0) return [];
    const response = [];
    let kd_data = kd.init(deals[0], 9);
    let macd_data = macd.init(deals[0]);
    response.push({
      j: kd_data.j || null,
      osc: macd_data.osc || null,
      long: null,
      short: null,
      positiveOsc: macd_data.osc > 0 ? macd_data.osc : 0,
      negativeOsc: macd_data.osc < 0 ? macd_data.osc : 0,
      ...deals[0],
    });
    for (let i = 1; i < deals.length; i++) {
      const deal = deals[i];
      kd_data = kd.next(deal, kd_data, 9);
      macd_data = macd.next(deal, macd_data);
      response.push({
        j: kd_data.j || null,
        osc: macd_data.osc || null,
        long: kd_data.j > 50 && macd_data.osc > 0 ? kd_data.j : null,
        short: kd_data.j < 50 && macd_data.osc < 0 ? kd_data.j : null,
        positiveOsc: macd_data.osc > 0 ? macd_data.osc : 0,
        negativeOsc: macd_data.osc < 0 ? macd_data.osc : 0,
        ...deal,
      });
    }
    return response;
  }, [deals]);

  const longSignals = useMemo(() => {
    return chartData.filter(
      (item) =>
        item.j !== null && item.osc !== null && item.j > 50 && item.osc > 0
    );
  }, [chartData]);

  const shortSignals = useMemo(() => {
    return chartData.filter(
      (item) =>
        item.j !== null && item.osc !== null && item.j < 50 && item.osc < 0
    );
  }, [chartData]);

  return (
    <Container component="main">
      <Stack spacing={1} direction="row" alignItems="center">
        <MuiTooltip
          title={
            <Typography>
              J線往上穿過中線(50)且Osc從下往上穿過0線(紅柱)，代表買進點
              <br />
              J線往下穿過中線(50)且Osc從上往下穿過0線(綠柱)，代表賣出點
            </Typography>
          }
          arrow
        >
          <Typography variant="h5" gutterBottom>
            MJ 流線圖
          </Typography>
        </MuiTooltip>
      </Stack>
      <Box height="calc(100vh - 32px)" width="100%">
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

            <ReferenceLine y={50} stroke="#589bf3" strokeDasharray="3" />
            <Line
              dataKey="j"
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
      </Box>
    </Container>
  );
}
