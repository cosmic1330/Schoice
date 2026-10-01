import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import { Box, CircularProgress, Grid, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useContext, useEffect, useState } from "react";
import { DatabaseContext } from "../../../context/DatabaseContext";

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** unitIndex).toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

export default function SystemStatus() {
  const { db, isLoading: isDatabaseLoading } = useContext(DatabaseContext);
  const [dbSize, setDbSize] = useState("—");
  const [dbPath, setDbPath] = useState("正在取得儲存位置…");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const getStorageStatus = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await invoke<[number, string]>("get_db_size");
      if (!Array.isArray(result)) throw new Error("Invalid database status");
      const [size, path] = result;
      setDbSize(formatBytes(size));
      setDbPath(path || "無法取得路徑");
      setLastChecked(new Date());
    } catch (statusError) {
      console.error("取得資料庫狀態失敗", statusError);
      setDbSize("無法取得");
      setDbPath("請稍後再試");
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getStorageStatus();
  }, [getStorageStatus]);

  const databaseReady = Boolean(db) && !isDatabaseLoading;
  const databaseConnecting = Boolean(isDatabaseLoading);
  const statusItemSx = {
    height: "100%",
    p: 2,
    bgcolor: "background.paper",
    border: "2px solid",
    borderColor: "text.primary",
    borderRadius: 3,
  } as const;

  return (
    <Box sx={{ position: "relative", zIndex: 1 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Box>
          <Typography variant="subtitle1" fontWeight={900}>本機資料狀態</Typography>
          <Typography variant="caption" color="text.secondary">
            {lastChecked
              ? `最後檢查 ${lastChecked.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}`
              : "正在檢查…"}
          </Typography>
        </Box>
        <Tooltip title="重新整理狀態">
          <span>
            <IconButton onClick={getStorageStatus} disabled={loading} aria-label="重新整理本機資料狀態">
              {loading ? <CircularProgress size={20} /> : <RefreshRoundedIcon />}
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={statusItemSx}>
            {databaseReady ? (
              <CheckCircleRoundedIcon color="success" />
            ) : databaseConnecting ? (
              <CircularProgress size={22} />
            ) : (
              <ErrorOutlineRoundedIcon color="error" />
            )}
            <Box minWidth={0}>
              <Typography variant="caption" color="text.secondary">資料庫</Typography>
              <Typography variant="body2" fontWeight={900}>
                {databaseReady
                  ? "SQLite 已連線"
                  : databaseConnecting
                    ? "正在連線"
                    : "尚未連線"}
              </Typography>
            </Box>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={statusItemSx}>
            {error ? <ErrorOutlineRoundedIcon color="error" /> : <StorageRoundedIcon color="primary" />}
            <Box minWidth={0}>
              <Typography variant="caption" color="text.secondary">資料庫大小</Typography>
              <Typography variant="body2" fontWeight={900}>{loading ? "計算中…" : dbSize}</Typography>
            </Box>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, sm: 5 }}>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={statusItemSx}>
            <FolderRoundedIcon color="secondary" />
            <Box minWidth={0}>
              <Typography variant="caption" color="text.secondary">本機儲存位置</Typography>
              <Tooltip title={dbPath} placement="bottom-start">
                <Typography variant="body2" fontWeight={900} noWrap>{loading ? "載入中…" : dbPath}</Typography>
              </Tooltip>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
