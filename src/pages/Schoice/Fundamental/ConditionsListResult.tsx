import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { stockFundamentalQueryBuilder } from "../../../classes/StockFundamentalQueryBuilder";
import { useUser } from "../../../context/UserContext";
import useDatabaseQuery from "../../../hooks/useDatabaseQuery";
import useCloudStore from "../../../store/Cloud.store";
import useSchoiceStore from "../../../store/Schoice.store";
import { supabase } from "../../../tools/supabase";
import { Prompts, StockTableType } from "../../../types";

export default function ConditionsListResult({
  prompts,
}: {
  prompts: Prompts;
}) {
  const [results, setResults] = useState<StockTableType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { setFilterStocks } = useSchoiceStore();
  const { setFundamentalCondition } = useCloudStore();
  const { user } = useUser();
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
        supabase
          .from("stock")
          .select("*")
          .in(
            "stock_id",
            res.map((r) => r.stock_id)
          )
          .then(({ data }) => {
            setResults(data || []);
          });
      }
    });
  }, [prompts, query]);

  const handleClick = async () => {
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
        disabled={isLoading || results.length === 0}
      >
        {isLoading ? "處理中..." : "確定"}
      </Button>
    </Stack>
  );
}
