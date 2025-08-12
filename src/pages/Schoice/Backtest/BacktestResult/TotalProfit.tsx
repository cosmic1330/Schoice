import { Context } from "@ch20026103/backtest-lib";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import useDatabaseQuery from "../../../../hooks/useDatabaseQuery";
import useSchoiceStore from "../../../../store/Schoice.store";

function formatNumber(n: number | undefined): string {
  if (typeof n !== "number" || isNaN(n)) return "-";
  return n.toLocaleString();
}

export default function TotalProfit({ ctx }: { ctx: Context }) {
  const { backtestPersent } = useSchoiceStore();
  const [unsoldProfit, setUnsoldProfit] = useState<number>(0);
  const query = useDatabaseQuery();

  const getUnsoldProfit = useCallback(
    async (ids: string[]) => {
      const sql = `SELECT stock_id, t, c FROM daily_deal
    WHERE (stock_id, t) IN (
         SELECT stock_id, MAX(t)
         FROM daily_deal
         WHERE stock_id IN ('${ids.join("','")}')
         GROUP BY stock_id
    );`;
      const result = (await query(sql)) as {
        stock_id: string;
        t: string;
        c: number;
      }[];
      const unsoldProfit = result.reduce(
        (acc: number, item: { stock_id: string; t: string; c: number }) => {
          const sellPrice = ctx?.transaction.getSellPrice(item.c);
          const buyPrice = ctx?.record.inventory[item.stock_id]?.buyPrice;
          return (acc += sellPrice - buyPrice);
        },
        0
      );
      setUnsoldProfit(unsoldProfit);
    },
    [query, ctx]
  );

  useEffect(() => {
    if (backtestPersent === 100 && ctx?.record?.inventory) {
      const ids = Object.keys(ctx?.record.inventory);
      getUnsoldProfit(ids);
    }
  }, [backtestPersent, getUnsoldProfit]);
  return (
    <Card elevation={10} sx={{ borderRadius: 2, height: "100%" }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Profit
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Box>
            <Typography variant="subtitle1" color="textSecondary">
              Sold
            </Typography>
            <Typography variant="h6">
              {formatNumber(ctx?.record.profit)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" color="textSecondary">
              Unsold
            </Typography>
            <Typography variant="h6">{formatNumber(unsoldProfit)}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" color="textSecondary">
              Total
            </Typography>
            <Typography variant="h6">
              {formatNumber(ctx?.record.profit + unsoldProfit)}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
