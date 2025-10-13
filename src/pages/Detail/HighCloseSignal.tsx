import {
  Box,
  Container,
  FormControlLabel,
  Tooltip as MuiTooltip,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useContext, useMemo, useState } from "react";
import {
  ComposedChart,
  Customized,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import kd from "../../cls_tools/kd";
import BaseCandlestickRectangle from "../../components/RechartCustoms/BaseCandlestickRectangle";
import { DealsContext } from "../../context/DealsContext";

export default function HighCloseSignal() {
  const deals = useContext(DealsContext);
  const [showCandlestick, setShowCandlestick] = useState(false);

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
      prev: null, // 第一天沒有前一天的資料
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
        prev: deals[i - 1].l, // 前一天的最低價
      });
    }
    return response.splice(-160);
  }, [deals]);

  return (
    <Container component="main">
      <Stack spacing={1} direction="row" alignItems="center">
        <MuiTooltip
          title={
            <Box>
              <Typography variant="body2" gutterBottom></Typography>
            </Box>
          }
          arrow
        >
          <Typography variant="h5" gutterBottom>
            高收指標
          </Typography>
        </MuiTooltip>
        <FormControlLabel
          control={
            <Switch
              checked={showCandlestick}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setShowCandlestick(event.target.checked)
              }
              size="small"
            />
          }
          label="顯示燭台圖"
        />
      </Stack>
      <Box height="calc(100vh - 64px)" width="100%">
        <ResponsiveContainer width="100%" height="100%">
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
            {showCandlestick && (
              <Customized component={BaseCandlestickRectangle} />
            )}
            <Line
              dataKey="prev"
              stroke="#ff7300"
              dot={false}
              activeDot={false}
              legendType="none"
            />
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
