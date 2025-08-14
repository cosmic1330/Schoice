import { Box, Typography } from "@mui/material";
import { throttle } from "lodash-es";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import ResultTable from "../../../../../../components/ResultTable/ResultTable";
import { DatabaseContext } from "../../../../../../context/DatabaseContext";
import useDatabaseQuery from "../../../../../../hooks/useDatabaseQuery";
import useFindStocksByPrompt from "../../../../../../hooks/useFindStocksByPrompt";
import useCloudStore from "../../../../../../store/Cloud.store";
import useSchoiceStore from "../../../../../../store/Schoice.store";
import { SelectType } from "../../../../../../types";

export default function Result({ select }: { select: SelectType | null }) {
  const { getPromptSqlScripts, getCombinedSqlScript, getStocksData } =
    useFindStocksByPrompt();
  const { dates } = useContext(DatabaseContext);
  const { todayDate, filterStocks } = useSchoiceStore();
  const { bulls, bears, fundamentalCondition, menu } = useCloudStore();

  const [result, setResult] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const query = useDatabaseQuery();

  // 節流後的 query，避免頻繁狀態變更時重複查詢資料庫
  const throttledQuery = useMemo(() => {
    // 以 Promise 包裝，確保呼叫端仍可使用 then
    const fn = throttle(
      (sql: string, resolve: (v: any) => void) => {
        query(sql).then(resolve);
      },
      1000, // 節流間隔 (ms) 可視需要調整
      { leading: true, trailing: true }
    );
    return (sql: string) => new Promise<any>((resolve) => fn(sql, resolve));
  }, [query]);

  const run = useCallback(async () => {
    if (!select) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const item =
      select.type === "bull"
        ? bulls[select.prompt_id]
        : bears[select.prompt_id];
    let stocks = menu.map((item) => item.stock_id);
    if (fundamentalCondition) {
      stocks = filterStocks?.map((item) => item.stock_id) || [];
    }
    const sqls = await getPromptSqlScripts(item, stocks);
    if (sqls.length === 0) {
      setLoading(false);
      return;
    }
    // 合併查詢
    const combinedSQL = getCombinedSqlScript(sqls);
    throttledQuery(combinedSQL)
      .then(async (res: { stock_id: string }[] | undefined) => {
        if (res) {
          const result = await getStocksData(
            dates[todayDate],
            res.map((r) => r.stock_id)
          );
          if (result) setResult(result);
        }
      })
      .finally(() => setLoading(false));
  }, [
    dates,
    select,
    todayDate,
    bulls,
    bears,
    menu,
    fundamentalCondition,
    filterStocks,
    getPromptSqlScripts,
    getCombinedSqlScript,
    getStocksData,
    throttledQuery,
  ]);

  useEffect(() => {
    run();
  }, [run]);

  // 元件卸載時取消節流內排隊的呼叫
  useEffect(() => {
    return () => {
      // @ts-ignore - 存取 throttle 內建的 cancel
      throttledQuery.cancel && throttledQuery.cancel();
    };
  }, [throttledQuery]);

  return (
    <Box width="100%">
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        {loading ? "讀取中..." : `符合策略結果共 ${result.length} 筆`}
      </Typography>
      {!loading && <ResultTable {...{ result }} />}
    </Box>
  );
}
