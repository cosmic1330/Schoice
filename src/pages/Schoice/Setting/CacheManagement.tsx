import { Cached } from "@mui/icons-material";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Grid,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useState } from "react";

export default function CacheManagement() {
  const [autoClear, setAutoClear] = useState(false);
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Card sx={{ height: "100%" }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <Cached color="warning" />
            <Typography variant="h6" fontWeight="bold">
              快取管理
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" mb={2}>
            清除系統快取以釋放空間並解決效能問題，不影響資料。
          </Typography>
        </CardContent>
        <CardActions
          sx={{ flexDirection: "column", alignItems: "flex-start", gap: 1 }}
        >
          <Button variant="contained" color="warning" startIcon={<Cached />}>
            清除快取
          </Button>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Switch
              checked={autoClear}
              onChange={(e) => setAutoClear(e.target.checked)}
              color="warning"
            />
            <Typography variant="body2">每日自動清除快取</Typography>
          </Stack>
        </CardActions>
      </Card>
    </Grid>
  );
}
