import { Container, Grid, Typography } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import ResultTable from "../../../components/ResultTable/ResultTable";
import { ActionButtonType } from "../../../components/ResultTable/types";
import { DatabaseContext } from "../../../context/DatabaseContext";
import useFindStocksByPrompt from "../../../hooks/useFindStocksByPrompt";
import useSchoiceStore from "../../../store/Schoice.store";
import useStocksStore from "../../../store/Stock.store";
import Alarm from "./Alarm";
import InsertFavorite from "./InsertFavorite";

export default function Favorite() {
  const { stocks, reload } = useStocksStore();
  const { dates } = useContext(DatabaseContext);
  const [result, setResult] = useState<any[]>([]);
  const { getStocksData } = useFindStocksByPrompt();
  const { todayDate } = useSchoiceStore();

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    if (dates?.length === 0 || stocks.length === 0) return;
    getStocksData(
      dates[todayDate],
      stocks.map((r) => r.id)
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
