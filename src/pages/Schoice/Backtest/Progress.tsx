import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import useSchoiceStore from "../../../store/Schoice.store";

export default function Progress() {
  const { backtestPersent } = useSchoiceStore();
  return (
    <Stack spacing={2} direction="row" alignItems="center" mb={2}>
      <Typography variant="h5" fontWeight="bold" color="primary">
        {backtestPersent}%
      </Typography>
      <Box sx={{ width: "100%" }}>
        <LinearProgress variant="determinate" value={backtestPersent} />
      </Box>
    </Stack>
  );
}
