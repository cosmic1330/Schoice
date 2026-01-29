import { Box, CircularProgress, Typography } from "@mui/material";
import useSWR from "swr";
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
  const query = useDatabaseQuery();

  // 使用 SWR 處理資料抓取，利用 keepPreviousData 保持畫面穩定
  const { data: result = [], isValidating: loading } = useSWR(
    ["search", select.prompt_id, todayDate, filterStocks?.length],
    async () => {
      const item =
        select.type === "bull"
          ? bulls[select.prompt_id]
          : bears[select.prompt_id];
      if (!item) return [];

      const sqls = await getPromptSqlScripts(
        item,
        filterStocks?.map((item) => item.stock_id) || undefined,
      );
      if (sqls.length === 0) return [];

      const combinedSQL = getCombinedSqlScript(sqls);
      if (!combinedSQL || !combinedSQL.trim()) {
        console.log("No valid SQL generated");
        return [];
      }

      const res: { stock_id: string }[] | undefined = await query(combinedSQL);
      if (res && res.length > 0) {
        const data: StockTableType[] | null = await query(
          `SELECT * FROM stock WHERE stock_id IN (${res
            .map((r) => `'${r.stock_id}'`)
            .join(",")}) Order By stock_id ASC`,
        );
        return data || [];
      }
      return [];
    },
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );

  const strategyName =
    select.type === "bull"
      ? bulls[select.prompt_id]?.name
      : bears[select.prompt_id]?.name;
  const strategyScript = JSON.stringify(
    select.type === "bull"
      ? bulls[select.prompt_id]?.conditions
      : bears[select.prompt_id]?.conditions,
  );

  // 當真正沒有資料且不在載入中時顯示「沒有符合的結果」
  const noData = result.length === 0 && !loading;

  return (
    <Box width="100%" position="relative" sx={{ minHeight: 200 }}>
      {loading && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          bgcolor="rgba(255, 255, 255, 0.5)"
          sx={{ zIndex: 1, backdropFilter: "blur(1px)", borderRadius: 2 }}
        >
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            讀取中...
          </Typography>
        </Box>
      )}

      {noData ? (
        <Box py={8} width="100%" textAlign="center">
          <Typography variant="body1" color="text.secondary">
            沒有符合的結果
          </Typography>
        </Box>
      ) : (
        <Box
          width="100%"
          sx={{
            opacity: loading && result.length > 0 ? 0.7 : 1,
            pointerEvents: loading && result.length === 0 ? "none" : "auto",
            transition: "opacity 0.2s",
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            符合策略結果共 {result.length} 筆
          </Typography>
          <ResultTable
            {...{ result }}
            strategyName={strategyName}
            strategyScript={strategyScript}
          />
        </Box>
      )}
    </Box>
  );
}
