import { Build, Settings } from "@mui/icons-material";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

export default function DatabaseRepair() {
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Card sx={{ height: "100%" }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <Build color="primary" />
            <Typography variant="h6" fontWeight="bold">
              資料庫修復
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" mb={2}>
            掃描並修復資料庫結構與紀錄的不一致。依資料庫大小，過程可能需數分鐘。
          </Typography>
        </CardContent>
        <CardActions>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Settings />}
            fullWidth
          >
            開始修復
          </Button>
        </CardActions>
      </Card>
    </Grid>
  );
}
