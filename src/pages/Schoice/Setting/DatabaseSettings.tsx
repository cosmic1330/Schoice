import {
  Alert,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  Paper,
  Radio,
  RadioGroup,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { useContext, useState } from "react";
import { DatabaseContext } from "../../../context/DatabaseContext";

export default function DatabaseSettings() {
  const { dbType, switchDatabase, isSwitching } = useContext(DatabaseContext);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newType = event.target.value as "sqlite" | "postgres";
    try {
      await switchDatabase(newType);
    } catch (e: any) {
      // 顯示詳細錯誤訊息，如果是物件則取 message，否則轉為字串
      const errorMessage =
        e instanceof Error
          ? e.message
          : typeof e === "string"
          ? e
          : JSON.stringify(e);
      setError(`${newType} 連線失敗: ${errorMessage}`);
    }
  };

  const handleClose = () => {
    setError(null);
  };

  return (
    <Grid size={{ xs: 12 }}>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={1}>
          <Typography variant="h6" fontWeight="bold">
            資料庫設定
          </Typography>
          {isSwitching && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                切換連線中...
              </Typography>
            </Stack>
          )}
        </Stack>

        <Typography variant="body2" color="text.secondary" mb={2}>
          選擇資料來源。PostgreSQL 為雲端資料庫（自動更新），SQLite
          為本地資料庫（需手動更新）。
        </Typography>
        <FormControl disabled={isSwitching}>
          <RadioGroup
            row
            aria-labelledby="database-settings-group-label"
            name="database-settings-group"
            value={dbType}
            onChange={handleChange}
          >
            <FormControlLabel
              value="sqlite"
              control={<Radio />}
              label="本地 SQLite"
            />
            <FormControlLabel
              value="postgres"
              control={<Radio />}
              label="雲端 PostgreSQL"
            />
          </RadioGroup>
        </FormControl>
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert onClose={handleClose} severity="error" sx={{ width: "100%" }}>
            {error}
          </Alert>
        </Snackbar>
      </Paper>
    </Grid>
  );
}
