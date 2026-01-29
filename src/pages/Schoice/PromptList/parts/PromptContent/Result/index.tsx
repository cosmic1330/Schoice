import { Box, CircularProgress, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import ResultTable from "../../../../../../components/ResultTable/ResultTable";
import useDatabaseQuery from "../../../../../../hooks/useDatabaseQuery";
import useFindStocksByPrompt from "../../../../../../hooks/useFindStocksByPrompt";
import useCloudStore from "../../../../../../store/Cloud.store";
import useSchoiceStore from "../../../../../../store/Schoice.store";
import { SelectType, StockTableType } from "../../../../../../types";

export default function Result({ select }: { select: SelectType }) {
  const { getPromptSqlScripts, getCombinedSqlScript } = useFindStocksByPrompt();
  const bulls = useCloudStore((state) => state.bulls);
  const bears = useCloudStore((state) => state.bears);
  const todayDate = useSchoiceStore((state) => state.todayDate);
  const filterStocks = useSchoiceStore((state) => state.filterStocks);
  const [result, setResult] = useState<StockTableType[]>([]);
  const [loading, setLoading] = useState(false);
  const query = useDatabaseQuery();

  const run = useCallback(async () => {
    setLoading(true);
    setResult([]);
    try {
      const item =
        select.type === "bull"
          ? bulls[select.prompt_id]
          : bears[select.prompt_id];
      if (!item) return;

      const sqls = await getPromptSqlScripts(
        item,
        filterStocks?.map((item) => item.stock_id) || undefined,
      );
      if (sqls.length === 0) return;

      const combinedSQL = getCombinedSqlScript(sqls);
      if (!combinedSQL || !combinedSQL.trim()) {
        console.log("No valid SQL generated");
        return;
      }

      const res: { stock_id: string }[] | undefined = await query(combinedSQL);
      if (res && res.length > 0) {
        const data: StockTableType[] | null = await query(
          `SELECT * FROM stock WHERE stock_id IN (${res
            .map((r) => `'${r.stock_id}'`)
            .join(",")}) Order By stock_id ASC`,
        );
        if (data && data.length > 0) setResult(data);
      }
    } catch (error) {
      console.error("Query error:", error);
    } finally {
      setLoading(false);
    }
  }, [select, query, todayDate, bulls, bears, filterStocks]);

  useEffect(() => {
    run();
  }, [run]);

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        py={8}
        width="100%"
      >
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          讀取中...
        </Typography>
      </Box>
    );
  }

  if (result.length === 0) {
    return (
      <Box py={4} width="100%" textAlign="center">
        <Typography variant="body1" color="text.secondary">
          沒有符合的結果
        </Typography>
      </Box>
    );
  }

  return (
    <Box width="100%">
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        符合策略結果共 {result.length} 筆
      </Typography>
      <ResultTable
        {...{ result }}
        strategyName={
          select.type === "bull"
            ? bulls[select.prompt_id]?.name
            : bears[select.prompt_id]?.name
        }
        strategyScript={JSON.stringify(
          select.type === "bull"
            ? bulls[select.prompt_id]?.conditions
            : bears[select.prompt_id]?.conditions,
        )}
      />
    </Box>
  );
}
