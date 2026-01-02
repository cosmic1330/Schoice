import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import useSchoiceStore from "../../../store/Schoice.store";

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 10,
  borderRadius: 5,
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  overflow: "hidden",
  "& .MuiLinearProgress-bar": {
    borderRadius: 5,
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
    boxShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.5)}`,
  },
}));

export default function Progress() {
  const { backtestPersent } = useSchoiceStore();
  return (
    <Stack spacing={2} sx={{ mb: 4 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-end"
      >
        <Typography
          variant="subtitle2"
          fontWeight={800}
          color="text.secondary"
          sx={{ textTransform: "uppercase", letterSpacing: "0.1em" }}
        >
          Analysis Progress
        </Typography>
        <Typography
          variant="h5"
          fontWeight={900}
          color="primary"
          sx={{ lineHeight: 1 }}
        >
          {backtestPersent}%
        </Typography>
      </Stack>
      <Box sx={{ width: "100%" }}>
        <StyledLinearProgress variant="determinate" value={backtestPersent} />
      </Box>
    </Stack>
  );
}
