import { dateFormat } from "@ch20026103/anysis";
import { Mode } from "@ch20026103/anysis/dist/esm/stockSkills/utils/dateFormat";
import { Context } from "@ch20026103/backtest-lib";
import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import useDatabaseQuery from "../../../../hooks/useDatabaseQuery";
import useSchoiceStore from "../../../../store/Schoice.store";
import StockTextButton from "./StockTextButton";

export default function Inventory({ ctx }: { ctx: Context }) {
  const { backtestPersent } = useSchoiceStore();
  const [unsoldProfits, setUnsoldProfits] = useState<
    | {
        [id: string]: {
          t: string;
          c: number;
        };
      }
    | undefined
  >();
  const query = useDatabaseQuery();

  const getData = useCallback(async (ids: string[]) => {
    const sql = `SELECT stock_id, t, c FROM daily_deal
    WHERE (stock_id, t) IN (
         SELECT stock_id, MAX(t)
         FROM daily_deal
         WHERE stock_id IN ('${ids.join("','")}')
         GROUP BY stock_id
    );`;
    const result = (await query(sql)) as [];

    const resultMap: { [id: string]: { t: string; c: number } } = result.reduce(
      (acc: any, item: any) => {
        acc[item.stock_id] = { t: item.t, c: item.c };
        return acc;
      },
      {}
    );
    setUnsoldProfits(resultMap);
  }, []);

  useEffect(() => {
    if (backtestPersent === 100 && ctx?.record?.inventory) {
      const ids = Object.keys(ctx?.record.inventory);
      getData(ids);
    }
  }, [backtestPersent, getData]);
  return (
    <Card elevation={10} sx={{ borderRadius: 2, height: "100%" }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Inventory
        </Typography>
        <TableContainer sx={{ maxHeight: "500px" }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">Buy Date</TableCell>
                <TableCell align="center">Buy Price</TableCell>
                <TableCell align="center">Stock</TableCell>
                <TableCell align="center">Unsold Date</TableCell>
                <TableCell align="center">Unsold Price</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.values(ctx?.record.inventory || {}).map((item, index) => (
                <TableRow key={index}>
                  <TableCell align="center">
                    {dateFormat(item.buyDate, Mode.NumberToString)}
                  </TableCell>
                  <TableCell align="center" sx={{ color: "primary.main" }}>
                    {`$${item.buyData.c}`}
                  </TableCell>
                  <TableCell align="center">
                    <StockTextButton id={item.id} name={item.name} />
                  </TableCell>
                  <TableCell align="center" sx={{ color: "primary.main" }}>
                    {unsoldProfits ? unsoldProfits[item.id]?.t : "N/A"}
                  </TableCell>
                  <TableCell align="center" sx={{ color: "primary.main" }}>
                    {unsoldProfits ? `$${unsoldProfits[item.id]?.c}` : "N/A"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
