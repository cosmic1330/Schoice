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

const SECTION_LABELS = ["估值指標", "營收與 EPS", "投資人持倉", "集保戶數"];

export default function FundamentalTooltip({ row }: FundamentalTooltipProps) {
  const { db } = useContext(DatabaseContext);
  const [financialMetrics, setFinancialMetrics] =
    useState<FinancialMetricTableType | null>(null);
  const [recentFundamental, setRecentFundamental] =
    useState<RecentFundamentalTableType | null>(null);
  const [investorPositions, setInvestorPositions] = useState<any>(null);
  const [tdccHolder, setTdccHolder] =
    useState<TdccHolderTableType | null>(null);
  const [pendingSections, setPendingSections] = useState<string[]>(SECTION_LABELS);
  const [failedSections, setFailedSections] = useState<string[]>([]);

  useEffect(() => {
    let isCurrentRequest = true;

    setPendingSections(SECTION_LABELS);
    setFailedSections([]);
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
            [row.stock_id],
          );
          if (localData && localData.length > 0) {
            return localData[0];
          }
        } catch (e) {
          console.warn(`[Tooltip] Local fetch failed for ${table}:`, e);
        }
      }

      // 2. Fallback to Cloud
      if (!isCurrentRequest) return null;
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("stock_id", row.stock_id)
        .maybeSingle();

      if (error) throw error;
      return data;
    };

    // Publish each section as soon as it is ready; remote data must not gate
    // rendering of sections already available in SQLite.
    const loadSection = async <T,>(
      label: string,
      request: () => Promise<T>,
      apply: (data: T) => void,
    ) => {
      try {
        const data = await request();
        if (isCurrentRequest) apply(data);
      } catch (error) {
        if (isCurrentRequest) {
          console.error(`[Tooltip] ${label} fetch failed:`, error);
          setFailedSections((sections) => [...sections, label]);
        }
      } finally {
        if (isCurrentRequest) {
          setPendingSections((sections) =>
            sections.filter((name) => name !== label),
          );
        }
      }
    };

    void loadSection(
      "估值指標", () => fetchTable("financial_metric"), setFinancialMetrics,
    );
    void loadSection(
      "營收與 EPS", () => fetchTable("recent_fundamental"), setRecentFundamental,
    );
    void loadSection(
      "投資人持倉", () => fetchTable("investor_positions"), setInvestorPositions,
    );
    void loadSection("集保戶數", () => getTdccHolder(row.stock_id), setTdccHolder);
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

      {pendingSections.length > 0 && (
        <Typography variant="caption" role="status" sx={{ display: "block", mt: 1, opacity: 0.7 }}>
          載入中：{pendingSections.join("、")}
        </Typography>
      )}
      {failedSections.length > 0 && (
        <Typography variant="caption" sx={{ display: "block", mt: 1, opacity: 0.7 }}>
          暫時無法載入：{failedSections.join("、")}
        </Typography>
      )}

      {/* Only report no data once all sections finished successfully. */}
      {!hasData && pendingSections.length === 0 && failedSections.length === 0 && (
        <Box sx={{ textAlign: "center", py: 3 }}>
          <Typography variant="body2" color="text.secondary">
            暫無財務數據
          </Typography>
        </Box>
      )}
    </Box>
  );
}
