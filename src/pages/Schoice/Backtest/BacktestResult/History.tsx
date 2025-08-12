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
import StockTextButton from "./StockTextButton";

export default function History({ ctx }: { ctx: Context }) {
  return (
    <Card elevation={10} sx={{ borderRadius: 2, height: "100%" }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          History
        </Typography>
        <TableContainer sx={{ maxHeight: "500px" }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">Buy Date</TableCell>
                <TableCell align="center">Buy Price</TableCell>
                <TableCell align="center">Sell Date</TableCell>
                <TableCell align="center">Sell Price</TableCell>
                <TableCell align="center">Stock</TableCell>
                <TableCell align="center">Profit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.values(ctx?.record.history || {}).map((item, index) => (
                <TableRow key={index}>
                  <TableCell align="center">
                    {dateFormat(item.buyDate, Mode.NumberToString)}
                  </TableCell>
                  <TableCell align="center" sx={{ color: "primary.main" }}>
                    {`$${item.buyPrice}`}
                  </TableCell>
                  <TableCell align="center">
                    {dateFormat(item.sellDate, Mode.NumberToString)}
                  </TableCell>
                  <TableCell align="center" sx={{ color: "primary.main" }}>
                    {`$${item.sellPrice}`}
                  </TableCell>
                  <TableCell align="center">
                    <StockTextButton id={item.id} name={item.name} />
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color:
                        item.sellPrice - item.buyPrice > 0
                          ? "success.main"
                          : "error.main",
                    }}
                  >
                    {`$${item.sellPrice - item.buyPrice}`}
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
