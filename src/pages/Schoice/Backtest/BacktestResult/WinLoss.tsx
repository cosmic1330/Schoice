import { Context } from "@ch20026103/backtest-lib";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function WinLoss({ ctx }: { ctx: Context }) {
  const { t } = useTranslation();

  return (
    <Card elevation={10} sx={{ borderRadius: 2, height: "100%" }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {t("Pages.Schoice.Backtest.winLossTitle")}
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Box>
            <Typography variant="subtitle1" color="textSecondary">
              {t("Pages.Schoice.Backtest.win")}
            </Typography>
            <Typography variant="h5">{ctx?.record.win}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" color="textSecondary">
              {t("Pages.Schoice.Backtest.loss")}
            </Typography>
            <Typography variant="h5">{ctx?.record.lose}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" color="textSecondary">
              {t("Pages.Schoice.Backtest.transactionCount")}
            </Typography>
            <Typography variant="h5">{ctx?.record.history.length}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
