import { Context } from "@ch20026103/backtest-lib";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

export default function WinLoss({ ctx }: { ctx: Context }) {
  return (
    <Card elevation={10} sx={{ borderRadius: 2, height: "100%" }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Win/Loss Ratio
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Box>
            <Typography variant="subtitle1" color="textSecondary">
              Win
            </Typography>
            <Typography variant="h5">{ctx?.record.win}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" color="textSecondary">
              Loss
            </Typography>
            <Typography variant="h5">{ctx?.record.lose}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" color="textSecondary">
              Transaction Count
            </Typography>
            <Typography variant="h5">{ctx?.record.history.length}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
