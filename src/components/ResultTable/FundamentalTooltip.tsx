import { Box, Chip, Divider, Grid, Skeleton, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { supabase } from "../../tools/supabase";
import {
  FinancialMetricTableType,
  RecentFundamentalTableType,
  StockTableType,
} from "../../types";

export default function FundamentalTooltip({ row }: { row: StockTableType }) {
  const [financialMetrics, setFinancialMetrics] =
    useState<FinancialMetricTableType | null>(null);
  const [recentFundamental, setRecentFundamental] =
    useState<RecentFundamentalTableType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // 並行載入兩個表的資料
        const [financialResult, recentResult] = await Promise.all([
          supabase
            .from("financial_metric")
            .select("*")
            .eq("stock_id", row.stock_id)
            .single(),
          supabase
            .from("recent_fundamental")
            .select("*")
            .eq("stock_id", row.stock_id)
            .single(),
        ]);

        if (financialResult.error) {
          console.error(
            "Error fetching financial metrics:",
            financialResult.error
          );
        } else {
          setFinancialMetrics(financialResult.data);
        }

        if (recentResult.error) {
          console.error(
            "Error fetching recent fundamental data:",
            recentResult.error
          );
        } else {
          setRecentFundamental(recentResult.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [row.stock_id]);

  const formatValue = (
    value: any | [any, any],
    suffix: string = "",
    decimals: number = 2
  ) => {
    if (Array.isArray(value)) {
      const [first, second] = value;
      const formattedFirst =
        first === null || first === undefined || first === "" || isNaN(first)
          ? "N/A"
          : Number(first).toFixed(decimals);
      const formattedSecond =
        second === null ||
        second === undefined ||
        second === "" ||
        isNaN(second)
          ? "N/A"
          : Number(second).toFixed(decimals);
      return `${formattedFirst}${suffix} / ${formattedSecond}${suffix}`;
    }

    if (value === null || value === undefined || value === "" || isNaN(value)) {
      return "N/A";
    }
    const numValue = Number(value);
    return `${numValue.toFixed(decimals)}${suffix}`;
  };

  const getValueColor = (value: any, isPositive: boolean = true) => {
    if (value === null || value === undefined || value === "" || isNaN(value)) {
      return "text.secondary";
    }
    const numValue = Number(value);
    if (numValue > 0) {
      return isPositive ? "success.main" : "error.main";
    } else if (numValue < 0) {
      return isPositive ? "error.main" : "success.main";
    }
    return "text.primary";
  };

  const MetricItem = ({
    label,
    value,
    suffix = "",
    decimals = 2,
    isPositive = true,
    flex = true,
  }: {
    label: string;
    value: any;
    suffix?: string;
    decimals?: number;
    isPositive?: boolean;
    flex?: boolean;
  }) => (
    <Box
      sx={{
        display: flex ? "flex" : "block",
        justifyContent: flex ? "space-between" : "flex-start",
        mb: 0.3,
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontSize: "0.7rem" }}
      >
        {label}:
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontWeight: "medium",
          color: getValueColor(value, isPositive),
          fontSize: "0.7rem",
          ...(flex ? {} : { display: "block", mt: 0.2 }),
        }}
      >
        {formatValue(value, suffix, decimals)}
      </Typography>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3, minWidth: 300 }}>
        <Skeleton variant="text" width="80%" height={30} />
        <Skeleton variant="text" width="60%" height={20} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="80%" height={200} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      {/* 標題區域 */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0.5 }}>
          {row.stock_name}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            label={row.stock_id}
            size="small"
            variant="outlined"
            color="primary"
          />
          <Chip
            label={row.market_type}
            size="small"
            color={row.market_type === "上市" ? "success" : "info"}
          />
        </Box>
      </Box>

      <Divider sx={{ mb: 1 }} />

      <Grid container spacing={3}>
        {/* 估值指標 */}
        {financialMetrics && (
          <Grid size={6}>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1.5,
                fontWeight: "bold",
                color: "primary.main",
                borderBottom: 1,
                borderColor: "primary.light",
                pb: 0.5,
              }}
            >
              📊 估值指標
            </Typography>
            <Box>
              <MetricItem
                flex={false}
                label="本益比 (PE)"
                value={financialMetrics.pe}
                suffix="倍"
              />
              <MetricItem
                flex={false}
                label="股價淨值比 (PB)"
                value={financialMetrics.pb}
                suffix="倍"
              />
              <MetricItem
                flex={false}
                label="殖利率"
                value={financialMetrics.dividend_yield}
                suffix="%"
              />
              <MetricItem
                flex={false}
                label="每股淨值"
                value={financialMetrics.book_value_per_share}
                suffix="元"
              />
            </Box>
          </Grid>
        )}

        {/* 近期EPS */}
        {recentFundamental && (
          <Grid size={6}>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1.5,
                fontWeight: "bold",
                color: "info.main",
                borderBottom: 1,
                borderColor: "info.light",
                pb: 0.5,
              }}
            >
              📈 近期 EPS
            </Typography>
            <Box>
              <MetricItem
                label={recentFundamental.eps_recent_q1_name || "近一季"}
                value={recentFundamental.eps_recent_q1}
                suffix="元"
              />
              <MetricItem
                label={recentFundamental.eps_recent_q2_name || "近二季"}
                value={recentFundamental.eps_recent_q2}
                suffix="元"
              />
              <MetricItem
                label={recentFundamental.eps_recent_q3_name || "近三季"}
                value={recentFundamental.eps_recent_q3}
                suffix="元"
              />
              <MetricItem
                label={recentFundamental.eps_recent_q4_name || "近四季"}
                value={recentFundamental.eps_recent_q4}
                suffix="元"
              />
              <MetricItem
                label={recentFundamental.eps_recent_y1_name || "近一年"}
                value={recentFundamental.eps_recent_y1}
                suffix="元"
              />
              <MetricItem
                label={recentFundamental.eps_recent_y2_name || "近二年"}
                value={recentFundamental.eps_recent_y2}
                suffix="元"
              />
              <MetricItem
                label={recentFundamental.eps_recent_y3_name || "近三年"}
                value={recentFundamental.eps_recent_y3}
                suffix="元"
              />

              <MetricItem
                label={recentFundamental.eps_recent_y4_name || "近四年"}
                value={recentFundamental.eps_recent_y4}
                suffix="元"
              />
            </Box>
          </Grid>
        )}

        {/* 近期營收 */}
        {recentFundamental && (
          <Grid size={12}>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1.5,
                fontWeight: "bold",
                color: "warning.main",
                borderBottom: 1,
                borderColor: "warning.light",
                pb: 0.5,
              }}
            >
              💰 近期營收 mom / yoy
            </Typography>
            <Box>
              {[1, 2, 3, 4].map((month) => {
                const momKey =
                  `revenue_recent_m${month}_mom` as keyof RecentFundamentalTableType;
                const yoyKey =
                  `revenue_recent_m${month}_yoy` as keyof RecentFundamentalTableType;
                const nameKey =
                  `revenue_recent_m${month}_name` as keyof RecentFundamentalTableType;

                return (
                  <MetricItem
                    key={month}
                    label={String(recentFundamental[nameKey]) || `近${month}月`}
                    value={[
                      recentFundamental[momKey],
                      recentFundamental[yoyKey],
                    ]}
                  />
                );
              })}
            </Box>
          </Grid>
        )}
      </Grid>

      {/* 如果沒有資料的提示 */}
      {!financialMetrics && !recentFundamental && (
        <Box sx={{ textAlign: "center", py: 3 }}>
          <Typography variant="body2" color="text.secondary">
            暫無財務數據
          </Typography>
        </Box>
      )}
    </Box>
  );
}
