import AnalyticsIcon from "@mui/icons-material/Analytics";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import {
  Box,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { AnimatePresence, motion } from "framer-motion";
import useSWR from "swr";
import ResultTable from "../../../../../../components/ResultTable/ResultTable";
import useDatabaseQuery from "../../../../../../hooks/useDatabaseQuery";
import useFindStocksByPrompt from "../../../../../../hooks/useFindStocksByPrompt";
import useCloudStore from "../../../../../../store/Cloud.store";
import useSchoiceStore from "../../../../../../store/Schoice.store";
import { SelectType, StockTableType } from "../../../../../../types";

// --- Styled Components ---

const GlassWrapper = styled(Box)(() => ({
  width: "100%",
  position: "relative",
  minHeight: 300,
  borderRadius: "16px",
  overflow: "hidden",
  transition: "all 0.3s ease",
}));

const LoadingOverlay = styled(motion.div)(({ theme }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background:
    theme.palette.mode === "dark"
      ? alpha(theme.palette.background.paper, 0.7)
      : alpha("#fff", 0.7),
  backdropFilter: "blur(12px)",
  zIndex: 10,
}));

const StatsBadge = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(0.5, 2),
  borderRadius: "20px",
  background: alpha(theme.palette.primary.main, 0.1),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const EmptyStateContainer = styled(Stack)(({ theme }) => ({
  padding: theme.spacing(10, 2),
  alignItems: "center",
  justifyContent: "center",
  color: theme.palette.text.secondary,
}));

const AnimatedContent = styled(motion.div)({
  width: "100%",
});

export default function Result({ select }: { select: SelectType }) {
  const { getPromptSqlScripts, getCombinedSqlScript } = useFindStocksByPrompt();
  const bulls = useCloudStore((state) => state.bulls);
  const bears = useCloudStore((state) => state.bears);
  const todayDate = useSchoiceStore((state) => state.todayDate);
  const filterStocks = useSchoiceStore((state) => state.filterStocks);
  const query = useDatabaseQuery();

  // 使用 SWR 處理資料抓取，將策略清單長度加入 Key 以確保雲端資料載入後自動重新整理
  const { data: result = [], isValidating: loading } = useSWR(
    [
      "search",
      select.prompt_id,
      todayDate,
      filterStocks?.length,
      Object.keys(bulls).length,
      Object.keys(bears).length,
    ],
    async () => {
      const item =
        select.type === "bull"
          ? bulls[select.prompt_id]
          : bears[select.prompt_id];
      if (!item) return [];

      // 如果 filterStocks 是空陣列 []，傳遞 undefined 給 SQL 產生器以避免 IN ('') 查不到資料
      const stockIds =
        filterStocks && filterStocks.length > 0
          ? filterStocks.map((item) => item.stock_id)
          : undefined;

      const sqls = await getPromptSqlScripts(item, stockIds);
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

  return (
    <GlassWrapper>
      <AnimatePresence>
        {loading && result.length === 0 && (
          <LoadingOverlay
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <CircularProgress
                size={56}
                thickness={4}
                sx={{
                  circle: {
                    stroke: "url(#loading_gradient)",
                    strokeLinecap: "round",
                  },
                }}
              />
              <svg width="0" height="0">
                <defs>
                  <linearGradient
                    id="loading_gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#1976d2" />
                    <stop offset="100%" stopColor="#9c27b0" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
            <Typography
              variant="body1"
              sx={{
                mt: 3,
                fontWeight: 700,
                letterSpacing: 1,
                background: "linear-gradient(45deg, #1976d2 30%, #9c27b0 90%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              分析數據中...
            </Typography>
          </LoadingOverlay>
        )}
      </AnimatePresence>

      <Box sx={{ p: 1 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 3, px: 1, minHeight: 40 }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <AnalyticsIcon color="primary" />
            <Box>
              <Typography variant="h6" fontWeight={800} letterSpacing={-0.5} sx={{ lineHeight: 1.2 }}>
                分析結果演算法
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -0.5 }}>
                {strategyName || "未命名策略"}
              </Typography>
            </Box>
            {loading && result.length > 0 && (
              <CircularProgress size={14} thickness={6} color="primary" />
            )}
          </Stack>

          {result.length > 0 && (
            <StatsBadge elevation={0}>
              <Typography
                variant="caption"
                fontWeight={900}
                color="primary.main"
              >
                MATCHES
              </Typography>
              <Typography variant="body2" fontWeight={900}>
                {result.length}
              </Typography>
            </StatsBadge>
          )}
        </Stack>

        <AnimatePresence mode="wait">
          {result.length > 0 ? (
            <AnimatedContent
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Box
                sx={{
                  borderRadius: "12px",
                  border: (theme) =>
                    `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  overflow: "hidden",
                  boxShadow: "0 4px 20px -5px rgba(0,0,0,0.05)",
                  bgcolor: "background.paper",
                }}
              >
                <ResultTable
                  result={result}
                  strategyName={strategyName}
                  strategyScript={strategyScript}
                />
              </Box>
            </AnimatedContent>
          ) : !loading ? (
            <AnimatedContent
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <EmptyStateContainer spacing={2}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: "50%",
                    bgcolor: (theme) => alpha(theme.palette.divider, 0.05),
                    mb: 1,
                  }}
                >
                  <SearchOffIcon sx={{ fontSize: 48, opacity: 0.5 }} />
                </Box>
                <Typography variant="h6" fontWeight={700}>
                  沒有符合的結果
                </Typography>
                <Typography variant="body2" textAlign="center" maxWidth={400}>
                  目前的選股策略在目標日期內未發現符合條件的股票，請嘗試調整策略參數。
                </Typography>
                {filterStocks && filterStocks.length > 0 && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 1.5,
                      borderRadius: "8px",
                      bgcolor: (theme) => alpha(theme.palette.warning.main, 0.05),
                      border: (theme) => `1px dashed ${alpha(theme.palette.warning.main, 0.3)}`,
                    }}
                  >
                    <Typography variant="caption" color="warning.main" fontWeight={700}>
                      💡 提示：目前已啟用 Fundamental 財務篩選器 (共 {filterStocks.length} 筆目標)，搜尋結果僅限於這些股票中。
                    </Typography>
                  </Box>
                )}
              </EmptyStateContainer>
            </AnimatedContent>
          ) : null}
        </AnimatePresence>
      </Box>
    </GlassWrapper>
  );
}
