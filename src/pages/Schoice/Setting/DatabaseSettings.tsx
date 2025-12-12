import {
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { useContext } from "react";
import { DatabaseContext } from "../../../context/DatabaseContext";

export default function DatabaseSettings() {
  const { dbType, switchDatabase, isSwitching } = useContext(DatabaseContext);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newType = event.target.value as "sqlite" | "postgres";
    switchDatabase(newType);
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
      </Paper>
    </Grid>
  );
}
