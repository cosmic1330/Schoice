import { Box, Grid, Typography } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { DatabaseContext } from "../../../context/DatabaseContext";
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
  const { db } = useContext(DatabaseContext);
  const [financialMetrics, setFinancialMetrics] =
    useState<FinancialMetricTableType | null>(null);
  const [recentFundamental, setRecentFundamental] =
    useState<RecentFundamentalTableType | null>(null);
  const [investorPositions, setInvestorPositions] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const fetchTable = async (table: string): Promise<any> => {
        // 1. Try Local First
        if (db) {
          try {
            const localData: any[] = await db.select(
              `SELECT * FROM ${table} WHERE stock_id = ?`,
              [row.stock_id]
            );
            if (localData && localData.length > 0) {
              return localData[0];
            }
          } catch (e) {
            console.warn(`[Tooltip] Local fetch failed for ${table}:`, e);
          }
        }

        // 2. Fallback to Cloud
        try {
          const { data, error } = await supabase
            .from(table)
            .select("*")
            .eq("stock_id", row.stock_id)
            .maybeSingle();

          if (error) throw error;
          return data;
        } catch (e) {
          console.error(`[Tooltip] Cloud fetch failed for ${table}:`, e);
          return null;
        }
      };

      try {
        const [financialData, recentData, investorData] = await Promise.all([
          fetchTable("financial_metric"),
          fetchTable("recent_fundamental"),
          fetchTable("investor_positions"),
        ]);

        setFinancialMetrics(financialData);
        setRecentFundamental(recentData);
        setInvestorPositions(investorData);
      } catch (error) {
        console.error("Error fetching tooltip data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [row.stock_id, db]);

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
