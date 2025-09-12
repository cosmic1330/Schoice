import { Box, Grid } from "@mui/material";
import SectionHeader from "../SectionHeader";
import MetricItem from "../MetricItem";
import { RecentFundamentalTableType } from "../../../../types";

interface EpsSectionProps {
  recentFundamental: RecentFundamentalTableType;
}

export default function EpsSection({ recentFundamental }: EpsSectionProps) {
  return (
    <Grid size={6}>
      <SectionHeader 
        title="近期 EPS"
        emoji="📈"
        color="info"
      />
      <Box>
        <MetricItem
          label={recentFundamental.eps_recent_q1_name || "近一季"}
          value={recentFundamental.eps_recent_q1}
          suffix="元"
          colorRule="positive_green"
        />
        <MetricItem
          label={recentFundamental.eps_recent_q2_name || "近二季"}
          value={recentFundamental.eps_recent_q2}
          suffix="元"
          colorRule="positive_green"
        />
        <MetricItem
          label={recentFundamental.eps_recent_q3_name || "近三季"}
          value={recentFundamental.eps_recent_q3}
          suffix="元"
          colorRule="positive_green"
        />
        <MetricItem
          label={recentFundamental.eps_recent_q4_name || "近四季"}
          value={recentFundamental.eps_recent_q4}
          suffix="元"
          colorRule="positive_green"
        />
        <MetricItem
          label={recentFundamental.eps_recent_y1_name || "近一年"}
          value={recentFundamental.eps_recent_y1}
          suffix="元"
          colorRule="positive_green"
        />
        <MetricItem
          label={recentFundamental.eps_recent_y2_name || "近二年"}
          value={recentFundamental.eps_recent_y2}
          suffix="元"
          colorRule="positive_green"
        />
        <MetricItem
          label={recentFundamental.eps_recent_y3_name || "近三年"}
          value={recentFundamental.eps_recent_y3}
          suffix="元"
          colorRule="positive_green"
        />
        <MetricItem
          label={recentFundamental.eps_recent_y4_name || "近四年"}
          value={recentFundamental.eps_recent_y4}
          suffix="元"
          colorRule="positive_green"
        />
      </Box>
    </Grid>
  );
}