import { Container, Grid, Typography } from "@mui/material";
import { debounce } from "lodash-es";
import { useContext, useEffect, useMemo, useState } from "react";
import ResultTable from "../../../components/ResultTable/ResultTable";
import { ActionButtonType } from "../../../components/ResultTable/types";
import { DatabaseContext } from "../../../context/DatabaseContext";
import useFindStocksByPrompt from "../../../hooks/useFindStocksByPrompt";
import useCloudStore from "../../../store/Cloud.store";
import useSchoiceStore from "../../../store/Schoice.store";
import { supabase } from "../../../tools/supabase";
import { StockTableType } from "../../../types";
import Alarm from "./Alarm";
import InsertFavorite from "./InsertFavorite";

export default function Favorite() {
  const { dates } = useContext(DatabaseContext);
  const [result, setResult] = useState<any[]>([]);
  const { getStocksData } = useFindStocksByPrompt();
  const { todayDate } = useSchoiceStore();
  const { watchStocks } = useCloudStore();
  const [stocks, setStocks] = useState<StockTableType[]>([]);

  // 新增：debounce 版資料抓取
  const debouncedFetch = useMemo(
    () =>
      debounce((date: string, ids: string[]) => {
        getStocksData(date, ids).then((result) => {
          if (result) setResult(result);
        });
      }, 500),
    [getStocksData]
  );

  useEffect(() => {
    if (!dates || dates.length === 0) return;
    debouncedFetch(dates[todayDate], watchStocks);
    return () => {
      debouncedFetch.cancel();
    };
  }, [watchStocks, dates, todayDate, debouncedFetch]);

  useEffect(() => {
    supabase
      .from("stock")
      .select("*")
      .in("stock_id", watchStocks)
      .then(({ data }) => {
        setStocks(data || []);
      });
  }, [watchStocks]);

  return (
    <Container>
      <Grid container>
        <Grid size={12}>
          <Typography variant="h5" gutterBottom textTransform="uppercase">
            Favorite
          </Typography>
          <Alarm stocks={stocks} />
          <InsertFavorite />
          <ResultTable result={result} type={ActionButtonType.Decrease} />
        </Grid>
      </Grid>
    </Container>
  );
}
