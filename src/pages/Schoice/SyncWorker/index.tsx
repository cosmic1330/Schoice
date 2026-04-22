import ListIcon from "@mui/icons-material/List";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import StopIcon from "@mui/icons-material/Stop";
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { emit, listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import SyncDatabaseHelper from "../../../classes/SyncDatabaseHelper";
import SyncEngine from "../../../classes/SyncEngine";
import EventTerminal from "../../../components/SyncEngine/EventTerminal";
import HealthHeatmap from "../../../components/SyncEngine/HealthHeatmap";
import useDatabase from "../../../hooks/useDatabase";
import { useSyncEngine } from "../../../hooks/useSyncEngine";

const MotionBox = motion(Box);

/**
 * SyncWorker - The full-featured standalone synchronization dashboard.
 * Migrated from SyncCenter to run in a separate execution context.
 */
export default function SyncWorker() {
  const { t } = useTranslation();
  const { db } = useDatabase();
  const { syncStatus, syncStats, syncHealthMap, start, stop } = useSyncEngine();

  // Local UI State
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [stockNames, setStockNames] = React.useState<Record<string, string>>(
    {},
  );

  // Engine Initialization & Command Listeners
  useEffect(() => {
    console.log("[SyncWorker] Lifecycle: Component Mounted");
    if (db) {
      console.log(
        "[SyncWorker] Lifecycle: Database Connected, initializing engine...",
      );
      const engine = SyncEngine.getInstance();
      engine.setDbHelper(new SyncDatabaseHelper(db));

      let unlisten: (() => void) | undefined;
      engine.setupCommandListeners().then((fn) => {
        unlisten = fn;
        console.log(
          "[SyncWorker] Lifecycle: Command listeners active. Sending Ready signal...",
        );
        emit("sync:worker_ready");
      });

      // Handle ping requests for handshake
      const unlistenPing = listen("sync:ping", () => {
        console.log(
          "[SyncWorker] Event: Received sync:ping, responding with ready...",
        );
        emit("sync:worker_ready");
      });

      const win = getCurrentWindow();
      const unlistenClose = win.onCloseRequested(async () => {
        console.log(
          "[SyncWorker] Lifecycle: Close requested. Sending global shutdown signal...",
        );
        await emit("sync:worker_closed");
        engine.stop();
      });

      return () => {
        console.log(
          "[SyncWorker] Lifecycle: Cleaning up listeners and stopping engine...",
        );
        engine.stop();
        if (unlisten) unlisten();
        unlistenPing.then((f) => f());
        unlistenClose.then((f) => f());
      };
    } else {
      console.warn(
        "[SyncWorker] Lifecycle: Waiting for database connection...",
      );
    }
  }, [db]);

  // Fetch Stock Names for the list
  useEffect(() => {
    if (db) {
      db.select<any[]>("SELECT stock_id, stock_name FROM stock").then(
        (rows) => {
          const map: Record<string, string> = {};
          rows.forEach((r) => (map[r.stock_id] = r.stock_name));
          setStockNames(map);
        },
      );
    }
  }, [db]);

  const getStatusColor = () => {
    switch (syncStatus) {
      case "syncing":
        return "#3B82F6";
      case "scanning":
        return "#A855F7";
      case "cooling":
        return "#FBBF24";
      case "success":
        return "#10B981";
      case "error":
        return "#EF4444";
      default:
        return "rgba(255,255,255,0.3)";
    }
  };

  const progress =
    syncStats.total > 0 ? (syncStats.completed / syncStats.total) * 100 : 0;

  // [v10] 移除自動關閉邏輯，視窗生命週期由使用者主導
  
  // 當視窗即將關閉時，通知主畫面
  useEffect(() => {
    return () => {
      console.log("[SyncWorker] Window unmounting. Notifying main window...");
      emit("sync:worker_closed");
    };
  }, []);

  // 我們需要計算剩餘冷卻時間（近似值，從日誌或狀態推導較難，但這裏先顯示狀態）
  const isCooling = syncStatus === "cooling";

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        p: 1.5,
        bgcolor: "#0f172a",
        color: "white",
        overflow: "hidden",
        gap: 1.5,
      }}
    >
      {/* Cooling Down Banner */}
      <AnimatePresence>
        {isCooling && (
          <MotionBox
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            sx={{
              bgcolor: "rgba(251, 191, 36, 0.15)",
              border: "1px solid rgba(251, 191, 36, 0.3)",
              borderRadius: 2,
              p: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              overflow: "hidden"
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: "#FBBF24",
                animation: "pulse 1.5s infinite"
              }}
            />
            <Typography variant="body2" fontWeight="900" sx={{ color: "#FBBF24" }}>
              警告：偵測到伺服器存取過於頻繁，目前正在原地休眠中。請勿關閉視窗，系統將於冷卻結束後自動恢復同步...
            </Typography>
          </MotionBox>
        )}
      </AnimatePresence>
      {/* Top HUD Control Bar */}
      <Box
        className="glass-card"
        sx={{
          p: 1.5,
          px: 2.5,
          borderRadius: 2.5,
          display: "flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        <Box sx={{ minWidth: 200 }}>
          <Typography
            variant="h6"
            fontWeight="900"
            sx={{ letterSpacing: -0.5, lineHeight: 1.1 }}
            className="text-gradient"
          >
            {t("Pages.SyncWorker.title")}
          </Typography>
          <Box
            sx={{ display: "flex", alignItems: "center", mt: 0.5, gap: 1.5 }}
          >
            <AnimatePresence mode="wait">
              <MotionBox
                key={syncStatus}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <Chip
                  label={t(
                    `Pages.SyncCenter.status.${syncStatus}`,
                  ).toUpperCase()}
                  size="small"
                  sx={{
                    height: 24,
                    px: 1,
                    fontSize: "0.7rem",
                    fontWeight: 900,
                    backgroundColor: `${getStatusColor()}20`,
                    color: getStatusColor(),
                    border: `1px solid ${getStatusColor()}40`,
                  }}
                />
              </MotionBox>
            </AnimatePresence>
            <Typography
              variant="caption"
              sx={{ opacity: 0.4, fontSize: "0.7rem" }}
            >
              WORKER v3.2 • {db ? "SQLITE ACTIVE" : "DB OFFLINE"}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Stack direction="row" justifyContent="space-between" mb={0.5}>
            <Typography
              variant="caption"
              fontWeight="700"
              sx={{ opacity: 0.8 }}
            >
              {t("Pages.SyncWorker.overallProgress").toUpperCase()}
            </Typography>
            <Typography
              variant="caption"
              color="primary"
              sx={{ fontWeight: 900 }}
            >
              {syncStats.completed} / {syncStats.total} ({Math.round(progress)}
              %)
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 10,
              borderRadius: 5,
              backgroundColor: "rgba(255,255,255,0.05)",
              "& .MuiLinearProgress-bar": {
                borderRadius: 5,
                background: "linear-gradient(90deg, #3B82F6, #A855F7)",
              },
            }}
          />
        </Box>

        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            size="small"
            startIcon={
              syncStatus === "syncing" ? (
                <RefreshIcon className="spin" />
              ) : (
                <PlayArrowIcon />
              )
            }
            onClick={() => start()}
            disabled={
              !db || syncStatus === "syncing" || syncStatus === "scanning"
            }
            className="accent-gradient"
            sx={{ px: 4, height: 42, fontWeight: 800, borderRadius: 2 }}
          >
            {syncStatus === "paused"
              ? t("Pages.SyncCenter.actions.resume")
              : t("Pages.SyncCenter.actions.start")}
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<StopIcon />}
            onClick={stop}
            disabled={
              !db || ["idle", "stopped", "success"].includes(syncStatus)
            }
            sx={{
              height: 42,
              px: 2,
              borderRadius: 2,
              borderColor: "rgba(239, 68, 68, 0.4)",
              color: "#EF4444",
            }}
          >
            {t("Pages.SyncCenter.actions.stop")}
          </Button>

          <IconButton
            onClick={() => setDrawerOpen(true)}
            sx={{
              bgcolor: "rgba(255,255,255,0.05)",
              borderRadius: 2,
              width: 42,
              height: 42,
              color: "white",
              "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
            }}
          >
            <ListIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* Main Content Area - Full Heatmap */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "row", // 改為橫向排列，左邊日誌，右邊地圖
          gap: 1.5,
        }}
      >
        {/* Real-time Logs */}
        <Box sx={{ width: 400, display: "flex", flexDirection: "column" }}>
          <EventTerminal />
        </Box>

        {/* Main Content Area - Full Heatmap */}
        <Box
          className="glass-card"
          sx={{
            flex: 1,
            borderRadius: 3,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              p: 1.5,
              px: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid var(--glass-border)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <Typography
              variant="caption"
              fontWeight="900"
              sx={{
                textTransform: "uppercase",
                letterSpacing: 2,
                opacity: 0.8,
              }}
            >
              {t("Pages.SyncWorker.heatmapVisualization")}
            </Typography>
            <Stack direction="row" spacing={3}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="caption" sx={{ opacity: 0.5 }}>
                  {t("Pages.SyncWorker.stats.status")}
                </Typography>
                <Typography variant="caption" fontWeight="800" color="primary">
                  {t(`Pages.SyncCenter.status.${syncStatus}`).toUpperCase()}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="caption" sx={{ opacity: 0.5 }}>
                  {t("Pages.SyncWorker.stats.speed")}
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight="800"
                  color="secondary"
                >
                  {syncStats.rpm} RPM
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="caption" sx={{ opacity: 0.5 }}>
                  {t("Pages.SyncWorker.stats.eta")}
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight="800"
                  sx={{ color: "#10B981" }}
                >
                  {syncStats.remainingTime}
                </Typography>
              </Box>
            </Stack>
          </Box>
          <Box sx={{ flex: 1, overflow: "hidden", p: 1 }}>
            <HealthHeatmap />
          </Box>
        </Box>
      </Box>

      <style>{`
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
        .text-gradient {
            background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* Pending Stocks Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 350,
            bgcolor: "#0f172a",
            color: "white",
            borderLeft: "1px solid var(--glass-border)",
            backgroundImage: "none",
          },
        }}
      >
        <Box
          sx={{
            p: 3,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography variant="h6" fontWeight="900" mb={1}>
            {t("Pages.SyncWorker.pendingList")}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.5 }} mb={3}>
            {t("Pages.SyncWorker.pendingCount", {
              count: Object.entries(syncHealthMap).filter(([_, s]) =>
                ["stale", "missing"].includes(s),
              ).length,
            })}
          </Typography>

          <TextField
            fullWidth
            size="small"
            placeholder={t("Pages.SyncWorker.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon
                  sx={{ color: "rgba(255,255,255,0.3)", mr: 1, fontSize: 20 }}
                />
              ),
              sx: {
                bgcolor: "rgba(255,255,255,0.05)",
                color: "white",
                borderRadius: 2,
                "& fieldset": { border: "none" },
              },
            }}
            sx={{ mb: 2 }}
          />

          <Divider sx={{ mb: 2, opacity: 0.1 }} />

          <List sx={{ flex: 1, overflowY: "auto", pr: 1 }}>
            {Object.entries(syncHealthMap)
              .filter(([id, status]) => {
                const isPending = ["stale", "missing"].includes(status);
                if (!isPending) return false;
                const name = stockNames[id] || "";
                return id.includes(searchQuery) || name.includes(searchQuery);
              })
              .map(([id, status]) => (
                <ListItem
                  key={id}
                  sx={{
                    mb: 1,
                    borderRadius: 2,
                    bgcolor: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor:
                          status === "missing"
                            ? "#FBBF24"
                            : "rgba(255,255,255,0.1)",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${id} ${stockNames[id] || ""}`}
                    secondary={status === "missing" ? "MISSING" : "STALE"}
                    primaryTypographyProps={{
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "white",
                    }}
                    secondaryTypographyProps={{
                      fontSize: "0.7rem",
                      color:
                        status === "missing"
                          ? "#FBBF24"
                          : "rgba(255,255,255,0.4)",
                    }}
                  />
                </ListItem>
              ))}
            {Object.entries(syncHealthMap).filter(([_, s]) =>
              ["stale", "missing"].includes(s),
            ).length === 0 && (
              <Box sx={{ py: 10, textAlign: "center", opacity: 0.3 }}>
                <Typography variant="body2">
                  {t("Pages.SyncWorker.noPendingStocks")}
                </Typography>
              </Box>
            )}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
}
