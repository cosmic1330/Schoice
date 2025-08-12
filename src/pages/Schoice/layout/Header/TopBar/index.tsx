import { Stack } from "@mui/material";
import LatestDate from "./LatestDate";
import MarketSentiment from "./MarketSentiment";
import RollBack from "./Rollback";

export default function TopBar() {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      p={1.5}
    >
      <MarketSentiment />
      <Stack direction="row" spacing={2}>
        <RollBack />
        <LatestDate />
      </Stack>
    </Stack>
  );
}
