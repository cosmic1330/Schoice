import { Box, Typography } from "@mui/material";
import { useCallback, useContext, useEffect, useState } from "react";
import ResultTable from "../../../../../../components/ResultTable/ResultTable";
import { DatabaseContext } from "../../../../../../context/DatabaseContext";
import useDatabaseQuery from "../../../../../../hooks/useDatabaseQuery";
import useFindStocksByPrompt from "../../../../../../hooks/useFindStocksByPrompt";
import useCloudStore from "../../../../../../store/Cloud.store";
import useSchoiceStore from "../../../../../../store/Schoice.store";
import { SelectType, StockTableType } from "../../../../../../types";

export default function Result({ select }: { select: SelectType }) {
  const { getPromptSqlScripts, getCombinedSqlScript } = useFindStocksByPrompt();
  const { dates } = useContext(DatabaseContext);
  const bulls = useCloudStore((state) => state.bulls);
  const bears = useCloudStore((state) => state.bears);
  const todayDate = useSchoiceStore((state) => state.todayDate);
  const filterStocks = useSchoiceStore((state) => state.filterStocks);
  const [result, setResult] = useState<StockTableType[]>([]);
  const query = useDatabaseQuery();

  const run = useCallback(async () => {
    setResult([]);
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

    // 合併查詢
    const combinedSQL = getCombinedSqlScript(sqls);

    // 檢查 combinedSQL 是否為空
    if (!combinedSQL || !combinedSQL.trim()) {
      console.log("No valid SQL generated");
      return;
    }

    query(combinedSQL)
      .then(async (res: { stock_id: string }[] | undefined) => {
        if (res && res.length > 0) {
          query(
            `SELECT * FROM stock WHERE stock_id IN (${res
              .map((r) => `'${r.stock_id}'`)
              .join(",")}) Order By stock_id ASC`,
          ).then((data: StockTableType[] | null) => {
            if (data && data.length > 0) setResult(data);
          });
        }
      })
      .catch((error) => {
        console.error("Query error:", error);
      });
  }, [dates, select, query, todayDate, bulls, bears]);

  useEffect(() => {
    run();
  }, [run]);

  return result ? (
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
  ) : (
    "讀取中..."
  );
}
