import { Box, Grid } from "@mui/material";
import { RecentFundamentalTableType } from "../../../../types";
import SectionHeader from "../SectionHeader";
import MetricItem from "../MetricItem";

interface RevenueSectionProps {
  recentFundamental: RecentFundamentalTableType;
}

export default function RevenueSection({ recentFundamental }: RevenueSectionProps) {
  return (
    <Grid size={6}>
      <SectionHeader 
        title="近期營收 mom / yoy / 累計yoy"
        emoji="💰"
        color="warning"
      />
      <Box>
        {[1, 2, 3, 4].map((month) => {
          const momKey =
            `revenue_recent_m${month}_mom` as keyof RecentFundamentalTableType;
          const yoyKey =
            `revenue_recent_m${month}_yoy` as keyof RecentFundamentalTableType;
          const yoyAccKey =
            `revenue_recent_m${month}_yoy_acc` as keyof RecentFundamentalTableType;
          const nameKey =
            `revenue_recent_m${month}_name` as keyof RecentFundamentalTableType;

          return (
            <MetricItem
              key={month}
              label={String(recentFundamental[nameKey]) || `近${month}月`}
              value={[
                recentFundamental[momKey],
                recentFundamental[yoyKey],
                recentFundamental[yoyAccKey],
              ]}
              suffix="%"
              colorRule="both_red_when_negative"
              multiColor={true}  // 啟用多色顯示
            />
          );
        })}
      </Box>
    </Grid>
  );
}