import { Box, Grid } from "@mui/material";
import { InvestorPositionsTableType } from "../../../../types";
import MetricItem from "../MetricItem";
import SectionHeader from "../SectionHeader";

interface InvestorPositionsSectionProps {
  investorPositions: InvestorPositionsTableType;
}

export default function InvestorPositionsSection({
  investorPositions,
}: InvestorPositionsSectionProps) {
  return (
    <Grid size={6}>
      <SectionHeader title="近期外資大戶比例" emoji="📈" color="info" />
      <Box>
        {/* 近期外資比例 */}
        <MetricItem
          label={`近一週外資 ${investorPositions.recent_w1_name}`}
          value={investorPositions.recent_w1_foreign_ratio}
          suffix="%"
          colorRule="negative_red"
        />
        <MetricItem
          label={`近二週外資 ${investorPositions.recent_w2_name}`}
          value={investorPositions.recent_w2_foreign_ratio}
          suffix="%"
          colorRule="negative_red"
        />
        <MetricItem
          label={`近三週外資 ${investorPositions.recent_w3_name}`}
          value={investorPositions.recent_w3_foreign_ratio}
          suffix="%"
          colorRule="negative_red"
        />
        <MetricItem
          label={`近四週外資 ${investorPositions.recent_w4_name}`}
          value={investorPositions.recent_w4_foreign_ratio}
          suffix="%"
          colorRule="negative_red"
        />
        {/* 近期大戶比例 */}
        <MetricItem
          label={`近一週大戶 ${investorPositions.recent_w1_name}`}
          value={investorPositions.recent_w1_big_investor_ratio}
          suffix="%"
          colorRule="negative_red"
        />
        <MetricItem
          label={`近二週大戶 ${investorPositions.recent_w2_name}`}
          value={investorPositions.recent_w2_big_investor_ratio}
          suffix="%"
          colorRule="negative_red"
        />
        <MetricItem
          label={`近三週大戶 ${investorPositions.recent_w3_name}`}
          value={investorPositions.recent_w3_big_investor_ratio}
          suffix="%"
          colorRule="negative_red"
        />
        <MetricItem
          label={`近四週大戶 ${investorPositions.recent_w4_name}`}
          value={investorPositions.recent_w4_big_investor_ratio}
          suffix="%"
          colorRule="negative_red"
        />
      </Box>
    </Grid>
  );
}
