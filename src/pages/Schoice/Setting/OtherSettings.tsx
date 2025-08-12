import { Settings } from "@mui/icons-material";
import {
  Card,
  CardContent,
  Grid,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useState } from "react";

export default function OtherSettings() {
  const [disableNoti, setDisableNoti] = useState(false);
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Card sx={{ height: "100%" }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <Settings color="success" />
            <Typography variant="h6" fontWeight="bold">
              其他設定
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" mb={2}>
            設定暫時性系統選項，將於指定時間或重啟後還原。
          </Typography>
          <Stack spacing={1} mt={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch
                checked={disableNoti}
                onChange={(e) => setDisableNoti(e.target.checked)}
                color="success"
              />
              <Typography variant="body2">停用通知</Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
}
