import { Container, Grid, Typography } from "@mui/material";
import { useCallback, useContext, useEffect, useState } from "react";
import ResultTable from "../../../components/ResultTable/ResultTable";
import { ActionButtonType } from "../../../components/ResultTable/types";
import { DatabaseContext } from "../../../context/DatabaseContext";
import useFindStocksByPrompt from "../../../hooks/useFindStocksByPrompt";
import useSchoiceStore from "../../../store/Schoice.store";
import { supabase } from "../../../tools/supabase";
import Alarm from "./Alarm";
import InsertFavorite from "./InsertFavorite";
import { StockStoreType } from "../../../types";

export default function Favorite() {
  const { dates } = useContext(DatabaseContext);
  const [stocks, setStocks] = useState<StockStoreType[]>([]);
  const [result, setResult] = useState<any[]>([]);
  const { getStocksData } = useFindStocksByPrompt();
  const { todayDate } = useSchoiceStore();

  const load_watch_stocks = useCallback(async () => {
    const user_id = await supabase.auth
      .getUser()
      .then((res) => res.data.user?.id);
    const { data, error } = await supabase
      .from("watch_stocks")
      .select("*, stocks(*)")
      .eq("user_id", user_id);
    if (error) {
      console.error("Error loading watch stocks:", error);
      return [];
    }
    setStocks(data || []);
  }, []);

  useEffect(() => {
    load_watch_stocks();
  }, [load_watch_stocks]);

  useEffect(() => {
    if (dates?.length === 0) return;
    getStocksData(
      dates[todayDate],
      stocks.map((r: StockStoreType) => r.stock_id)
    ).then((result) => {
      if (result) setResult(result);
    });
  }, [stocks, dates, getStocksData]);

  return (
    <Container>
      <Grid container>
        <Grid size={12}>
          <Typography variant="h5" gutterBottom textTransform="uppercase">
            Favorite
          </Typography>
          <Alarm stocks={stocks} />
          <InsertFavorite />
          <ResultTable {...{ result }} type={ActionButtonType.Decrease} />
        </Grid>
      </Grid>
    </Container>
  );
}
