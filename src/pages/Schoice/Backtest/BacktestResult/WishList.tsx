import { Context } from "@ch20026103/backtest-lib";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

export default function WishList({ ctx }: { ctx: Context }) {
  return (
    <Card elevation={10} sx={{ borderRadius: 2, height: "100%" }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Wish List
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Box>
            <Typography variant="subtitle1" color="textSecondary">
              Buying
            </Typography>
            <Typography variant="h5">
              {Object.keys(ctx?.record.waitPurchased || {}).length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" color="textSecondary">
              Selling
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
