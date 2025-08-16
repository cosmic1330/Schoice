import { Container, Grid, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import ResultTable from "../../../components/ResultTable/ResultTable";
import { ActionButtonType } from "../../../components/ResultTable/types";
import useCloudStore from "../../../store/Cloud.store";
import { supabase } from "../../../tools/supabase";
import { StockTableType } from "../../../types";
import Alarm from "./Alarm";
import InsertFavorite from "./InsertFavorite";

export default function Favorite() {
  const { watchStocks } = useCloudStore();
  const [stocks, setStocks] = useState<StockTableType[]>([]);

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
          <ResultTable result={stocks} type={ActionButtonType.Decrease} />
        </Grid>
      </Grid>
    </Container>
  );
}
