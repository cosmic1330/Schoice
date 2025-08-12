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
import useSchoiceStore from "../../../store/Schoice.store";
export default function ConditionsTable() {
  const { filterStocks, filterConditions } = useSchoiceStore();

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
            {filterConditions?.map((row, idx) => (
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
