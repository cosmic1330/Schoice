import { Context } from "@ch20026103/backtest-lib";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

const GlassPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  backgroundColor: alpha(theme.palette.background.paper, 0.4),
  backdropFilter: "blur(10px)",
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: "16px",
  height: "100%",
  boxShadow: "none",
}));

export default function WishList({ ctx }: { ctx: Context }) {
  const { t } = useTranslation();

  return (
    <GlassPaper elevation={0}>
      <Typography
        variant="caption"
        fontWeight={800}
        color="text.secondary"
        sx={{
          textTransform: "uppercase",
          mb: 2,
          display: "block",
          letterSpacing: "0.1em",
        }}
      >
        {t("Pages.Schoice.Backtest.wishListTitle")}
      </Typography>
      <Stack direction="row" spacing={2} justifyContent="space-between">
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {t("Pages.Schoice.Backtest.buying")}
          </Typography>
          <Typography variant="h5" fontWeight={900} color="primary.main">
            {Object.keys(ctx?.record.waitPurchased || {}).length}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {t("Pages.Schoice.Backtest.selling")}
          </Typography>
          <Typography variant="h5" fontWeight={900} color="primary.main">
            {Object.keys(ctx?.record.waitSale || {}).length}
          </Typography>
        </Box>
      </Stack>
    </GlassPaper>
  );
}
