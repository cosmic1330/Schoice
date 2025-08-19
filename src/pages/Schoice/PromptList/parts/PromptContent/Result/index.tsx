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
  const { bulls, bears } = useCloudStore();
  const { todayDate, filterStocks } = useSchoiceStore();
  const [result, setResult] = useState<StockTableType[]>([]);
  const query = useDatabaseQuery();

  const run = useCallback(async () => {
    setResult([]);
    const item =
      select.type === "bull"
        ? bulls[select.prompt_id]
        : bears[select.prompt_id];
    const sqls = await getPromptSqlScripts(
      item,
      filterStocks?.map((item) => item.stock_id) || undefined
    );
    if (sqls.length === 0) return;
    // 合併查詢
    const combinedSQL = getCombinedSqlScript(sqls);
    query(combinedSQL).then(async (res: { stock_id: string }[] | undefined) => {
      if (res && res.length > 0) {
        query(
          `SELECT * FROM stock WHERE stock_id IN (${res
            .map((r) => r.stock_id)
            .join(",")})`
        ).then((data: StockTableType[] | null) => {
          if (data && data.length > 0) setResult(data);
        });
      }
    });
  }, [dates, select, query, todayDate]);

  useEffect(() => {
    run();
  }, [run]);

  return result ? (
    <Box width="100%">
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        符合策略結果共 {result.length} 筆
      </Typography>
      <ResultTable {...{ result }} />
    </Box>
  ) : (
    "讀取中..."
  );
}
