import { Box, Grid, Typography } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { getTdccHolder } from "../../../api/tdccApi";
import { DatabaseContext } from "../../../context/DatabaseContext";
import { supabase } from "../../../tools/supabase";
import {
  FinancialMetricTableType,
  RecentFundamentalTableType,
  StockTableType,
  TdccHolderTableType,
} from "../../../types";
import StockHeader from "./StockHeader";
import EpsSection from "./sections/EpsSection";
import RevenueSection from "./sections/RevenueSection";
import ValuationSection from "./sections/ValuationSection";
import InvestorPositionsSection from "./sections/InvestorPositionsSection";
import TdccHolderSection from "./sections/TdccHolderSection";

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
  const [tdccHolder, setTdccHolder] =
    useState<TdccHolderTableType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCurrentRequest = true;

    const fetchData = async () => {
      setLoading(true);
      setFinancialMetrics(null);
      setRecentFundamental(null);
      setInvestorPositions(null);
      setTdccHolder(null);

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
        const [financialData, recentData, investorData, tdccData] =
          await Promise.all([
            fetchTable("financial_metric"),
            fetchTable("recent_fundamental"),
            fetchTable("investor_positions"),
            getTdccHolder(row.stock_id).catch((error) => {
              console.error("[Tooltip] TDCC fetch failed:", error);
              return null;
            }),
          ]);

        if (!isCurrentRequest) return;
        setFinancialMetrics(financialData);
        setRecentFundamental(recentData);
        setInvestorPositions(investorData);
        setTdccHolder(tdccData);
      } catch (error) {
        if (isCurrentRequest) {
          console.error("Error fetching tooltip data:", error);
        }
      } finally {
        if (isCurrentRequest) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isCurrentRequest = false;
    };
  }, [row.stock_id, db]);

  const hasData =
    financialMetrics || recentFundamental || investorPositions || tdccHolder;

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
        {/* 集保戶數 */}
        {tdccHolder && <TdccHolderSection holder={tdccHolder} />}
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
