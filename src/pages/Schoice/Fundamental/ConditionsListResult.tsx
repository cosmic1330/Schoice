import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { stockFundamentalQueryBuilder } from "../../../classes/StockFundamentalQueryBuilder";
import { useUser } from "../../../context/UserContext";
import useCloudStore from "../../../store/Cloud.store";
import useSchoiceStore from "../../../store/Schoice.store";
import { supabase } from "../../../tools/supabase";
import { FundamentalPrompts, StockTableType } from "../../../types";

export default function ConditionsListResult({
  prompts,
}: {
  prompts: FundamentalPrompts;
}) {
  const [results, setResults] = useState<StockTableType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { setFilterStocks } = useSchoiceStore();
  const { setFundamentalCondition } = useCloudStore();
  const { user } = useUser();

  useEffect(() => {
    stockFundamentalQueryBuilder
      .getStocksByConditions({ conditions: prompts })
      .then((stockIds) => {
        if (stockIds.length === 0) {
          setResults([]);
          return;
        }
        return supabase
          .from("stock")
          .select("*")
          .in("stock_id", stockIds)
          .then(({ data }: { data: StockTableType[] | null }) => {
            if (!data || data.length === 0) {
              setResults([]);
              return;
            }
            setResults(data);
          });
      });
  }, [prompts]);

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
        disabled={isLoading || results.length === 0}
      >
        {isLoading ? "處理中..." : "確定"}
      </Button>
    </Stack>
  );
}
