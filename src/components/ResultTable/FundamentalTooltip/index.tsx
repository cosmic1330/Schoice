import { Box, Grid, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { supabase } from "../../../tools/supabase";
import {
  FinancialMetricTableType,
  RecentFundamentalTableType,
  StockTableType,
} from "../../../types";
import StockHeader from "./StockHeader";
import EpsSection from "./sections/EpsSection";
import RevenueSection from "./sections/RevenueSection";
import ValuationSection from "./sections/ValuationSection";
import InvestorPositionsSection from "./sections/InvestorPositionsSection";

interface FundamentalTooltipProps {
  row: StockTableType;
}

export default function FundamentalTooltip({ row }: FundamentalTooltipProps) {
  const [financialMetrics, setFinancialMetrics] =
    useState<FinancialMetricTableType | null>(null);
  const [recentFundamental, setRecentFundamental] =
    useState<RecentFundamentalTableType | null>(null);
  const [investorPositions, setInvestorPositions] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // 並行載入兩個表的資料
        const [financialResult, recentResult, investorResult] = await Promise.all([
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
          supabase
            .from("investor_positions")
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
        if (investorResult.error) {
          console.error(
            "Error fetching investor positions data:",
            investorResult.error
          );
        } else {
          setInvestorPositions(investorResult.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [row.stock_id]);

  const hasData = financialMetrics || recentFundamental || investorPositions;

  return (
    <Box
      sx={{
        p: 2,
      }}
    >
      <StockHeader stock={row} />

      <Grid container spacing={3}>
        {/* 近期營收 */}
        {recentFundamental && (
          <RevenueSection recentFundamental={recentFundamental} />
        )}
        {/* 估值指標 */}
        {financialMetrics && (
          <ValuationSection financialMetrics={financialMetrics} />
        )}
        {/* 近期EPS */}
        {recentFundamental && (
          <EpsSection recentFundamental={recentFundamental} />
        )}
        {/* 投資人持倉 */}
        {investorPositions && (
          <InvestorPositionsSection investorPositions={investorPositions} />
        )}
      </Grid>

      {/* 如果沒有資料的提示 */}
      {!hasData && !loading && (
        <Box sx={{ textAlign: "center", py: 3 }}>
          <Typography variant="body2" color="text.secondary">
            暫無財務數據
          </Typography>
        </Box>
      )}
    </Box>
  );
}
