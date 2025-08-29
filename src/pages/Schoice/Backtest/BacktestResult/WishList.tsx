import { Context } from "@ch20026103/backtest-lib";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function WishList({ ctx }: { ctx: Context }) {
  const { t } = useTranslation();

  return (
    <Card elevation={10} sx={{ borderRadius: 2, height: "100%" }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {t("Pages.Schoice.Backtest.wishListTitle")}
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Box>
            <Typography variant="subtitle1" color="textSecondary">
              {t("Pages.Schoice.Backtest.buying")}
            </Typography>
            <Typography variant="h5">
              {Object.keys(ctx?.record.waitPurchased || {}).length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" color="textSecondary">
              {t("Pages.Schoice.Backtest.selling")}
            </Typography>
            <Typography variant="h5">
              {Object.keys(ctx?.record.waitSale || {}).length}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
