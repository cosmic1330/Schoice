import { Context } from "@ch20026103/backtest-lib";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useDatabaseQuery from "../../../../hooks/useDatabaseQuery";
import useSchoiceStore from "../../../../store/Schoice.store";

const GlassPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  backgroundColor: alpha(theme.palette.background.paper, 0.4),
  backdropFilter: "blur(10px)",
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: "16px",
  height: "100%",
  boxShadow: "none",
}));

function formatNumber(n: number | undefined): string {
  if (typeof n !== "number" || isNaN(n)) return "-";
  return n.toLocaleString();
}

export default function TotalProfit({ ctx }: { ctx: Context }) {
  const { t } = useTranslation();
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

  const totalProfit = (ctx?.record.profit || 0) + unsoldProfit;

  return (
    <GlassPaper elevation={0}>
      <Typography
        variant="caption"
        fontWeight={800}
        color="text.secondary"
        sx={{
          textTransform: "uppercase",
          mb: 2,
          display: "block",
          letterSpacing: "0.1em",
        }}
      >
        {t("Pages.Schoice.Backtest.totalProfitTitle")}
      </Typography>
      <Stack direction="row" spacing={2} justifyContent="space-between">
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {t("Pages.Schoice.Backtest.sold")}
          </Typography>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            color={
              (ctx?.record.profit || 0) >= 0 ? "success.main" : "error.main"
            }
          >
            {formatNumber(ctx?.record.profit)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {t("Pages.Schoice.Backtest.unsold")}
          </Typography>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            color={unsoldProfit >= 0 ? "success.main" : "error.main"}
          >
            {formatNumber(unsoldProfit)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {t("Pages.Schoice.Backtest.total")}
          </Typography>
          <Typography
            variant="h5"
            fontWeight={900}
            color={totalProfit >= 0 ? "success.main" : "error.main"}
          >
            {formatNumber(totalProfit)}
          </Typography>
        </Box>
      </Stack>
    </GlassPaper>
  );
}
