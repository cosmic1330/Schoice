import {
  Box,
  Container,
  Divider,
  Tooltip as MuiTooltip,
  Stack,
  Typography,
} from "@mui/material";
import { useContext, useMemo } from "react";
import {
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
import mfi from "../../cls_tools/mfi";
import { DealsContext } from "../../context/DealsContext";
import { DivergenceSignalType } from "../../types";

export default function Mfi() {
  const deals = useContext(DealsContext);

  const chartData = useMemo(() => {
    if (deals?.length === 0) return [];
    const response = [];
    let mfiData = mfi.init(deals[0], 14);

    response.push({
      ...deals[0],
      mfi: mfiData.mfi,
    });
    for (let i = 1; i < deals.length; i++) {
      const deal = deals[i];
      mfiData = mfi.next(deal, mfiData, 14);
      response.push({
        ...deal,
        mfi: mfiData.mfi,
      });
    }
    return response;
  }, [deals]);

  const singals = useMemo(() => {
    const response: {
      t: number;
      price: number;
      type: DivergenceSignalType;
      description: string;
    }[] = [];
    const data = chartData;
    data.forEach((element) => {
      if (element?.mfi !== null && element?.mfi < 20) {
        response.push({
          t: element.t,
          price: element.c,
          type:
            element?.mfi < 20
              ? DivergenceSignalType.BULLISH_DIVERGENCE
              : DivergenceSignalType.BEARISH_DIVERGENCE,
          description: `MFI 指標值為 ${element.mfi.toFixed(2)}`,
        });
      }
    });
    return response;
  }, [chartData]);

  return (
    <Container component="main">
      <Stack spacing={1} direction="row" alignItems="center">
        <Typography variant="h5" gutterBottom>
          MFI 流線圖
        </Typography>
        <Divider orientation="vertical" flexItem />
        {singals.length > 0 && (
          <MuiTooltip
            title={singals?.map((signal) => (
              <Typography variant="body2" key={signal.t}>
                {signal.t} {signal.type}
              </Typography>
            ))}
          >
            <Typography variant="body2" color="textSecondary">
              {`${singals[singals.length - 1].t} ${
                singals[singals.length - 1].type
              }`}
            </Typography>
          </MuiTooltip>
        )}
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
            {singals.map((signal) => (
              <ReferenceDot
                key={signal.t}
                x={signal.t}
                y={signal.price}
                r={3}
                stroke={"none"}
                fill={
                  signal.type === DivergenceSignalType.BEARISH_DIVERGENCE
                    ? "green"
                    : "red"
                }
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height="50%">
          <ComposedChart data={chartData} syncId="anySyncId">
            <XAxis dataKey="t" />
            <YAxis domain={["dataMin", "dataMax"]} />
            <Tooltip offset={50} />
            <ReferenceLine y={80} stroke="#ff0000" strokeDasharray="5 5" />
            <ReferenceLine y={20} stroke="#ff0000" strokeDasharray="5 5" />
            <Line
              dataKey="mfi"
              stroke="#589bf3"
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
