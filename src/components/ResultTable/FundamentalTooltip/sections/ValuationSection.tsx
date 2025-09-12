import { Box, Grid } from "@mui/material";
import { FinancialMetricTableType } from "../../../../types";
import SectionHeader from "../SectionHeader";
import MetricItem from "../MetricItem";

interface ValuationSectionProps {
  financialMetrics: FinancialMetricTableType;
}

export default function ValuationSection({ financialMetrics }: ValuationSectionProps) {
  return (
    <Grid size={6}>
      <SectionHeader 
        title="估值指標"
        emoji="📊"
        color="primary"
      />
      <Box>
        <MetricItem
          flex={true}
          label="本益比 (PE)"
          value={financialMetrics.pe}
          suffix="倍"
          colorRule="negative_red"
        />
        <MetricItem
          flex={true}
          label="股價淨值比 (PB)"
          value={financialMetrics.pb}
          suffix="倍"
          colorRule="negative_red"
        />
        <MetricItem
          flex={true}
          label="殖利率"
          value={financialMetrics.dividend_yield}
          suffix="%"
          colorRule="positive_green"
        />
        <MetricItem
          flex={true}
          label="每股淨值"
          value={financialMetrics.book_value_per_share}
          suffix="元"
          colorRule="positive_green"
        />
      </Box>
    </Grid>
  );
}