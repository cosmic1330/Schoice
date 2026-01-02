import { Stack, alpha } from "@mui/material";
import LatestDate from "./LatestDate";
import MarketSentiment from "./MarketSentiment";
import RollBack from "./Rollback";

export default function TopBar() {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      px={2.5}
      py={1.2}
      sx={{
        borderBottom: (theme) =>
          `1px solid ${alpha(theme.palette.divider, 0.05)}`,
      }}
    >
      <MarketSentiment />
      <Stack direction="row" spacing={2.5}>
        <RollBack />
        <LatestDate />
      </Stack>
    </Stack>
  );
}
