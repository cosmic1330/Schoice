import {
  Box,
  Container,
  Tooltip as MuiTooltip,
  Stack,
  Typography,
} from "@mui/material";
import { useContext, useMemo } from "react";
import {
  ComposedChart,
  Customized,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import kd from "../../cls_tools/kd";
import BaseCandlestickRectangle from "../../components/RechartCustoms/BaseCandlestickRectangle";
import { DealsContext } from "../../context/DealsContext";
import { DivergenceSignalType } from "../../types";
import detectKdDivergence from "../../utils/detectKdDivergence";

export default function Kd() {
  const deals = useContext(DealsContext);

  const chartData = useMemo(() => {
    if (deals?.length === 0) return [];
    const response = [];
    let pre = kd.init(deals[0], 9);
    response.push({
      t: deals[0].t,
      k: pre.k,
      d: pre.d,
      o: deals[0].o,
      c: deals[0].c,
      l: deals[0].l,
      h: deals[0].h,
      prevL: null, // 第一天沒有前一天的資料
    });
    for (let i = 1; i < deals.length; i++) {
      const deal = deals[i];
      pre = kd.next(deal, pre, 9);
      response.push({
        t: deal.t,
        k: pre.k,
        d: pre.d,
        o: deal.o,
        c: deal.c,
        l: deal.l,
        h: deal.h,
        prevL: deals[i - 1].h, // 前一天的最低價
      });
    }
    return response.splice(-160);
  }, [deals]);

  const singals = useMemo(() => {
    return detectKdDivergence(chartData);
  }, [chartData]);

  return (
    <Container component="main">
      <Stack spacing={1} direction="row" alignItems="center">
        <MuiTooltip
          title={
            <Box>
              <Typography variant="body2" gutterBottom>
                KD 背離指標用於判斷股價與 KD 指標之間的背離情況。
              </Typography>
              <Typography variant="body2" gutterBottom>
                當股價創新高而 KD 沒有同步創新高，或股價創新低而 KD
                沒有同步創新低時，可能預示著趨勢的轉變。
              </Typography>
            </Box>
          }
          arrow
        >
          <Typography variant="h5" gutterBottom>
            KD 背離指標
          </Typography>
        </MuiTooltip>
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
            <YAxis domain={[0, 100]} />
            <Tooltip offset={50} />
            <ReferenceLine y={80} stroke="#ff0000" strokeDasharray="5 5" />
            <ReferenceLine y={20} stroke="#ff0000" strokeDasharray="5 5" />
            <Line
              dataKey="k"
              stroke="#589bf3"
              dot={false}
              activeDot={false}
              legendType="none"
            />
            <Line
              dataKey="d"
              stroke="#ff7300"
              dot={false}
              activeDot={false}
              legendType="none"
            />
            {singals.map((signal) => (
              <ReferenceDot
                key={signal.t}
                x={signal.t}
                y={signal.k}
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
              dataKey="c"
              stroke="#589bf3"
              dot={false}
              activeDot={false}
              legendType="none"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Container>
  );
}
