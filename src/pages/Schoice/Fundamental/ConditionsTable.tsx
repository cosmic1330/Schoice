import {
  Box,
  Paper,
  // ...existing imports...
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect } from "react";
import { stockFundamentalQueryBuilder } from "../../../classes/StockFundamentalQueryBuilder";
import useDatabaseQuery from "../../../hooks/useDatabaseQuery";
import useCloudStore from "../../../store/Cloud.store";
import useSchoiceStore from "../../../store/Schoice.store";
export default function ConditionsTable() {
  const { filterStocks } = useSchoiceStore();
  const { fundamentalCondition } = useCloudStore();
  const query = useDatabaseQuery();
  const { setFilterStocks } = useSchoiceStore();

  useEffect(() => {
    if (!fundamentalCondition) return;
    const conditions = fundamentalCondition.map((prompt) =>
      stockFundamentalQueryBuilder.generateExpression(prompt).join(" ")
    );
    const sqlQuery = stockFundamentalQueryBuilder.generateSqlQuery({
      conditions,
    });
    query(sqlQuery).then((res) => {
      if (res) {
        const sql = `SELECT * FROM stock
          WHERE id IN ('${res.map((r) => r.stock_id).join("','")}')`;
        query(sql).then((result) => {
          if (result) setFilterStocks(result);
        });
      }
    });
  }, [fundamentalCondition]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        現有匹配結果: {filterStocks?.length}
      </Typography>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        現有條件
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>类别</TableCell>
              <TableCell>操作符</TableCell>
              <TableCell>值</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fundamentalCondition?.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>{row.indicator1}</TableCell>
                <TableCell>{row.operator}</TableCell>
                <TableCell>{row.indicator2}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
