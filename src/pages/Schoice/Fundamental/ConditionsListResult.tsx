import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { stockFundamentalQueryBuilder } from "../../../classes/StockFundamentalQueryBuilder";
import { useUser } from "../../../context/UserContext";
import useDatabaseQuery from "../../../hooks/useDatabaseQuery";
import useCloudStore from "../../../store/Cloud.store";
import useSchoiceStore from "../../../store/Schoice.store";
import { FundamentalPrompts, StockTableType } from "../../../types";

export default function ConditionsListResult({
  prompts,
}: {
  prompts: FundamentalPrompts;
}) {
  const query = useDatabaseQuery();
  const [results, setResults] = useState<StockTableType[]>([]);
  const [isLoading, setIsLoading] = useState(false); // For button action
  const [isFetching, setIsFetching] = useState(false); // For background query
  const { setFilterStocks } = useSchoiceStore();
  const { setFundamentalCondition } = useCloudStore();
  const { user } = useUser();

  useEffect(() => {
    setIsFetching(true);
    setResults([]); // Clear previous results while fetching

    // Slight delay to prevent flickering for instant queries and ensure UI update
    const timer = setTimeout(() => {
      stockFundamentalQueryBuilder
        .getStocksByConditions({ conditions: prompts })
        .then((stockIds) => {
          if (stockIds.length === 0) {
            setResults([]);
            setIsFetching(false);
          } else {
            query(
              `SELECT * FROM stock WHERE stock_id IN (${stockIds
                .map((id) => `'${id}'`)
                .join(",")})`
            ).then((data: StockTableType[] | null) => {
              if (data && data.length > 0) setResults(data);
              setIsFetching(false);
            });
          }
        });
    }, 0);

    return () => clearTimeout(timer);
  }, [prompts, query]);

  const handleClick = useCallback(async () => {
    // 檢查是否正在載入中
    if (isLoading) {
      return;
    }

    // 檢查用戶登入狀態
    if (!user) {
      toast.error("请先登录");
      return;
    }

    try {
      setIsLoading(true);
      setFilterStocks(results);
      await setFundamentalCondition(prompts, user.id);
      toast.success("添加基本面篩選成功");
    } catch (error) {
      toast.error("操作失敗，請重試");
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading,
    results,
    setFilterStocks,
    setFundamentalCondition,
    prompts,
    user,
  ]);

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Box display="flex" alignItems="center" gap={2}>
        <Box>
          <Typography
            variant="h6"
            gutterBottom
            fontWeight="bold"
            sx={{ mb: 0 }}
          >
            匹配结果摘要
          </Typography>
        </Box>
        {isFetching ? (
          <CircularProgress size={24} />
        ) : (
          <Chip
            label={`总计: ${results.length} 筆符合`}
            color="primary"
            sx={{
              fontWeight: 700,
            }}
          />
        )}
      </Box>
      <Button
        variant="contained"
        color="success"
        onClick={handleClick}
        disabled={isLoading || isFetching || results.length === 0}
      >
        {isLoading ? "處理中..." : "確定"}
      </Button>
    </Stack>
  );
}
