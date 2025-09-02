import {
  CheckCircle,
  Download,
  Info,
  Refresh,
  RestartAlt,
  Update,
} from "@mui/icons-material";
import CloudIcon from "@mui/icons-material/Cloud";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import React, { useEffect, useState } from "react";
import { getStore } from "../../../store/Setting.store";

const CheckUpdate: React.FC = () => {
  const [autoUpdate, setAutoUpdate] = useState(false);

  const [updateState, setUpdateState] = useState({
    isChecking: false,
    isDownloading: false,
    updateAvailable: false,
    currentVersion: "",
    newVersion: "",
    updateNotes: "",
    downloadProgress: 0,
    error: null as string | null,
    lastChecked: null as Date | null,
  });

  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  useEffect(() => {
    initializeSettings().then(() => {
      checkForUpdates(); // 強制檢查更新
    });
  }, []);

  const initializeSettings = async () => {
    const store = await getStore();
    const exists = await store.has("autoUpdate");
    if (!exists) {
      await store.set("autoUpdate", false);
    }
    const value = await store.get("autoUpdate");
    setAutoUpdate(!!value);

    const lastChecked = localStorage.getItem("lastChecked");
    if (lastChecked) {
      setUpdateState((prev) => ({
        ...prev,
        lastChecked: new Date(lastChecked),
      }));
    }
  };

  const toggleAutoUpdate = async () => {
    const newValue = !autoUpdate;
    setAutoUpdate(newValue);
    const store = await getStore();
    await store.set("autoUpdate", newValue);
  };

  const checkForUpdates = async (userInitiated = false) => {
    setUpdateState((prev) => ({
      ...prev,
      isChecking: true,
      error: null,
    }));

    try {
      const update = await check();
      const currentTime = new Date();

      if (
        update &&
        update.version &&
        update.version !== update.currentVersion
      ) {
        setUpdateState((prev) => ({
          ...prev,
          isChecking: false,
          updateAvailable: true,
          currentVersion: update.currentVersion || "未知",
          newVersion: update.version,
          updateNotes: update.body || "無更新說明",
          lastChecked: currentTime,
        }));
        localStorage.setItem("lastChecked", currentTime.toISOString());

        // 僅在用戶手動啟動檢查時顯示對話框
        if (userInitiated) {
          setShowUpdateDialog(true);
        }
      } else {
        setUpdateState((prev) => ({
          ...prev,
          isChecking: false,
          updateAvailable: false,
          lastChecked: currentTime,
        }));
        localStorage.setItem("lastChecked", currentTime.toISOString());
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "未知錯誤";
      const currentTime = new Date();
      setUpdateState((prev) => ({
        ...prev,
        isChecking: false,
        error: `檢查更新失敗: ${errorMessage}`,
        lastChecked: currentTime,
      }));
      localStorage.setItem("lastChecked", currentTime.toISOString());
    }
  };

  const downloadAndInstall = async () => {
    setUpdateState((prev) => ({
      ...prev,
      isDownloading: true,
      downloadProgress: 0,
      error: null,
    }));

    try {
      const update = await check();

      if (update) {
        await update.downloadAndInstall((event) => {
          if (
            event.event === "Progress" &&
            "chunkLength" in event.data &&
            "contentLength" in event.data &&
            typeof event.data.chunkLength === "number" &&
            typeof event.data.contentLength === "number"
          ) {
            const progress = Math.round(
              (event.data.chunkLength / (event.data.contentLength || 1)) * 100
            );
            setUpdateState((prev) => ({
              ...prev,
              downloadProgress: progress,
            }));
          }
        });

        setTimeout(async () => {
          try {
            await relaunch();
          } catch (err) {
            const errorMessage =
              err instanceof Error ? err.message : "未知錯誤";
            setUpdateState((prev) => ({
              ...prev,
              error: `重啟失敗: ${errorMessage}`,
              isDownloading: false,
            }));
          }
        }, 1000);
      } else {
        setUpdateState((prev) => ({
          ...prev,
          isDownloading: false,
          error: "找不到可用的更新",
        }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "未知錯誤";
      setUpdateState((prev) => ({
        ...prev,
        isDownloading: false,
        error: `下載更新失敗: ${errorMessage}`,
      }));
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "從未檢查";
    return date.toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Grid size={6}>
      <Card sx={{ height: "100%" }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <CloudIcon sx={{ color: "white" }} />
            <Typography variant="h6" fontWeight="bold">
              應用更新
            </Typography>
          </Stack>

          {/* 錯誤訊息 */}
          {updateState.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {updateState.error}
            </Alert>
          )}

          {/* 檢查更新狀態 */}
          {updateState.isChecking && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={16} />
                正在檢查更新...
              </Box>
            </Alert>
          )}

          {/* 下載進度 */}
          {updateState.isDownloading && (
            <Box sx={{ mb: 2 }}>
              <Alert severity="info" sx={{ mb: 1 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Download />
                  正在下載更新... {updateState.downloadProgress}%
                </Box>
              </Alert>
              <LinearProgress
                variant="determinate"
                value={updateState.downloadProgress}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}

          {/* 應用狀態資訊 */}
          <Stack spacing={2}>
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                應用狀態
              </Typography>
              {updateState.lastChecked && (
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  {updateState.updateAvailable ? (
                    <Chip
                      icon={<Update />}
                      label="有可用更新"
                      color="warning"
                      size="small"
                    />
                  ) : (
                    <Chip
                      icon={<CheckCircle />}
                      label="已是最新版本"
                      color="success"
                      size="small"
                    />
                  )}
                </Box>
              )}
              <Typography variant="body2" color="text.secondary">
                上次檢查: {formatDate(updateState.lastChecked)}
              </Typography>
            </Box>

            {updateState.currentVersion && (
              <>
                <Divider />
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    版本資訊
                  </Typography>
                  <Typography variant="body2">
                    當前版本: <strong>{updateState.currentVersion}</strong>
                  </Typography>
                  {updateState.updateAvailable && (
                    <Typography variant="body2" color="primary">
                      最新版本: <strong>{updateState.newVersion}</strong>
                    </Typography>
                  )}
                </Box>
              </>
            )}

            {/* 操作按鈕 */}
            <Box display="flex" gap={1} mt={2}>
              <Button
                variant="outlined"
                onClick={() => checkForUpdates(true)}
                disabled={updateState.isChecking || updateState.isDownloading}
                startIcon={<Refresh />}
                size="small"
              >
                重新檢查
              </Button>

              {updateState.updateAvailable && (
                <Button
                  variant="contained"
                  onClick={() => setShowUpdateDialog(true)}
                  disabled={updateState.isDownloading}
                  startIcon={<Download />}
                  size="small"
                >
                  立即更新
                </Button>
              )}
            </Box>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
            >
              <Typography>
                {autoUpdate ? "自動更新已啟用" : "自動更新已停用"}
              </Typography>
              <Switch
                checked={autoUpdate}
                onChange={toggleAutoUpdate}
                color="primary"
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* 更新確認對話框 */}
      <Dialog
        open={showUpdateDialog}
        onClose={() => setShowUpdateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Update color="primary" />
          發現新版本 v{updateState.newVersion}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                當前版本: {updateState.currentVersion}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                最新版本: {updateState.newVersion}
              </Typography>
            </Box>

            {updateState.updateNotes && (
              <Box>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Info fontSize="small" />
                  更新內容
                </Typography>
                <Box>
                  <Typography
                    variant="body2"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {updateState.updateNotes}
                  </Typography>
                </Box>
              </Box>
            )}

            {updateState.isDownloading && (
              <Box>
                <Typography variant="body2" gutterBottom>
                  下載進度: {updateState.downloadProgress}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={updateState.downloadProgress}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                {updateState.downloadProgress === 100 && (
                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                    <RestartAlt color="primary" />
                    <Typography variant="body2" color="primary">
                      準備重啟應用程式...
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setShowUpdateDialog(false)}
            disabled={updateState.isDownloading}
          >
            稍後更新
          </Button>
          <Button
            onClick={downloadAndInstall}
            disabled={updateState.isDownloading}
            variant="contained"
            startIcon={
              updateState.isDownloading ? (
                <CircularProgress size={16} />
              ) : (
                <Download />
              )
            }
          >
            {updateState.isDownloading ? "下載中..." : "立即更新"}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default CheckUpdate;
