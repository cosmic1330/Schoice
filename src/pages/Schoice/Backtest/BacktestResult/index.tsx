import { Context } from "@ch20026103/backtest-lib";
import { Grid } from "@mui/material";
import CapitalInventory from "./CapitalInventory";
import History from "./History";
import Inventory from "./Inventory";
import TotalProfit from "./TotalProfit";
import WinLoss from "./WinLoss";
import WishList from "./WishList";

export default function BacktestResult({ ctx }: { ctx: Context }) {
  return (
    <Grid container spacing={2} alignItems="stretch" py={2}>
      <Grid size={3}>
        <WinLoss ctx={ctx} />
      </Grid>
      <Grid size={3}>
        <TotalProfit ctx={ctx} />
      </Grid>
      <Grid size={3}>
        <WishList ctx={ctx} />
      </Grid>
      <Grid size={3}>
        <CapitalInventory ctx={ctx} />
      </Grid>
      <Grid size={6}>
        <History ctx={ctx} />
      </Grid>
      <Grid size={6}>
        <Inventory ctx={ctx} />
      </Grid>
    </Grid>
  );
}
