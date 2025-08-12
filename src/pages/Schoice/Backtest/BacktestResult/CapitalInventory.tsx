import { Context } from "@ch20026103/backtest-lib";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

export default function CapitalInventory({ ctx }: { ctx: Context }) {
  return (
    <Card elevation={10} sx={{ borderRadius: 2, height: "100%" }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Capital / Inventory
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Box>
            <Typography variant="subtitle1" color="textSecondary">
              Capital
            </Typography>
            <Typography variant="h5">{ctx?.capital}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" color="textSecondary">
              Inventory
            </Typography>
            <Typography variant="h5">{Object.keys(ctx?.record.inventory).length}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
