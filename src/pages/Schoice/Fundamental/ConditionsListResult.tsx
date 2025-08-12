import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { stockFundamentalQueryBuilder } from "../../../classes/StockFundamentalQueryBuilder";
import useDatabaseQuery from "../../../hooks/useDatabaseQuery";
import useSchoiceStore from "../../../store/Schoice.store";
import { FilterStock, StorePrompt } from "../../../types";

export default function ConditionsListResult({
  prompts,
}: {
  prompts: StorePrompt[];
}) {
  const [results, setResults] = useState<FilterStock[]>([]);
  const { addFilterStocks } = useSchoiceStore();
  const query = useDatabaseQuery();
  useEffect(() => {
    const conditions = prompts.map((prompt) =>
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
          if (result) setResults(result);
        });
      }
    });
  }, [prompts]);

  const handleClick = () => {
    addFilterStocks(results, prompts);
    toast.success("添加基本面塞選成功");
  };

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Box>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          匹配结果摘要
        </Typography>
        <Chip
          label={`总计: ${results.length} 筆符合`}
          color="primary"
          sx={{
            fontWeight: 700,
          }}
        />
      </Box>
      <Button
        variant="contained"
        color="success"
        onClick={handleClick}
        disabled={results.length === 0}
      >
        確定
      </Button>
    </Stack>
  );
}
