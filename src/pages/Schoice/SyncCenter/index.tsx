import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RefreshIcon from "@mui/icons-material/Refresh";
import StopIcon from "@mui/icons-material/Stop";
import LaunchIcon from "@mui/icons-material/Launch";
import React, { useEffect } from "react";
import {
  Box,
  Button,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { listen, emit } from "@tauri-apps/api/event";
import EventTerminal from "../../../components/SyncEngine/EventTerminal";
import HealthHeatmap from "../../../components/SyncEngine/HealthHeatmap";
import LiveTelemetry from "../../../components/SyncEngine/LiveTelemetry";
import { useSyncEngine } from "../../../hooks/useSyncEngine";
import useSyncDashboardStore from "../../../store/SyncDashboard.store";

const MotionBox = motion(Box);

export default function SyncCenter() {
  const { t } = useTranslation();
  const { syncStatus, syncStats, start, stop } = useSyncEngine();
  const [workerActive, setWorkerActive] = React.useState(false);

  // Lifecycle: Listen for a global shutdown signal from our worker window
  useEffect(() => {
     const unlisten = listen("sync:worker_closed", () => {
        console.log("[SyncCenter] Received global worker shutdown notice. Resetting UI...");
        setWorkerActive(false);
        const store = useSyncDashboardStore.getState();
        store.setSyncStatus("idle");
        store.setSyncStats({ rpm: 0, completed: 0, total: 0, remainingTime: "00:00:00" });
     });
     
     return () => {
       unlisten.then(fn => fn());
     };
  }, []);

  // Lifecycle: Initial check for worker presence
  React.useEffect(() => {
    const checkWorker = async () => {
      const win = await WebviewWindow.getByLabel("sync-worker");
      setWorkerActive(!!win);
    };
    checkWorker();
  }, []);

  // Auto-close command: Only close worker window when task is DEFINITIVELY finished success
  useEffect(() => {
    if (syncStatus === "success") {
      const timer = setTimeout(async () => {
        const win = await WebviewWindow.getByLabel("sync-worker");
        if (win) {
          console.log(`[SyncCenter] Task Success. Closing worker window...`);
          await win.close();
        }
      }, 5000); // 延長至 5 秒讓使用者確認
      return () => clearTimeout(timer);
    }
  }, [syncStatus]);

  const handleStart = async () => {
    // 1. Ensure Worker Window is open
    try {
      const label = "sync-worker";
      let workerWin = await WebviewWindow.getByLabel(label);
      
      const setupReadyListener = () => new Promise<void>((resolve) => {
        console.log("[SyncCenter] Waiting for worker ready signal...");
        const unlisten = listen("sync:worker_ready", () => {
          unlisten.then(fn => fn());
          console.log("[SyncCenter] Received sync:worker_ready! Worker is active.");
          resolve();
        });
        // Also send a ping in case it's already open but we missed the first ready signal
        console.log("[SyncCenter] Sending sync:ping...");
        emit("sync:ping");
      });

      if (!workerWin) {
        workerWin = new WebviewWindow(label, {
          url: "/sync-worker",
          title: "Schoice Sync Worker",
          width: 800,
          height: 600,
          resizable: true,
          alwaysOnTop: false,
        });

        // The useEffect above will catch the presence, but for immediate consistency:
        workerWin.listen("tauri://destroyed", () => {
           setWorkerActive(false);
           const store = useSyncDashboardStore.getState();
           store.setSyncStatus("idle");
           store.setSyncStats({ rpm: 0, completed: 0, total: 0, remainingTime: "00:00:00" });
        });

        // We MUST wait for it to boot up
        await setupReadyListener();
        setWorkerActive(true);
      } else {
        await workerWin.show();
        await workerWin.setFocus();
        // Even if it's open, make sure listeners are active
        await setupReadyListener();
        setWorkerActive(true);
      }
    } catch (e) {
      console.error("Failed to launch sync worker window", e);
    }

    // 2. Trigger start command
    console.log("[SyncCenter] Emitting sync:command_start...");
    start();
  };

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

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Decorative background element */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        sx={{
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          textAlign: "center",
        }}
      >
        <Box>
          <Typography
            variant="h3"
            fontWeight="900"
            className="text-gradient"
            sx={{ mb: 1, letterSpacing: -1 }}
          >
            {t("Pages.SyncCenter.title")}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.6, maxWidth: 400, mx: "auto" }}>
            {t("Pages.SyncCenter.description")}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <AnimatePresence mode="wait">
              <MotionBox
                key={syncStatus}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Chip
                  label={t(`Pages.SyncCenter.status.${syncStatus}`).toUpperCase()}
                  size="medium"
                  sx={{
                    px: 1,
                    fontWeight: 900,
                    letterSpacing: 1,
                    backgroundColor: `${getStatusColor()}20`,
                    color: getStatusColor(),
                    border: `1px solid ${getStatusColor()}40`,
                  }}
                />
              </MotionBox>
            </AnimatePresence>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ opacity: 0.6, fontSize: "0.7rem", fontWeight: 700 }}
            >
              {t("Pages.SyncCenter.workerActive")}
            </Typography>
        </Box>

        <Button
          variant="contained"
          size="large"
          startIcon={
            syncStatus === "syncing" ? (
              <RefreshIcon className="spin" />
            ) : (
                <LaunchIcon />
            )
          }
          onClick={handleStart}
          className="accent-gradient"
          sx={{
            px: 6,
            py: 2,
            fontSize: "1.1rem",
            fontWeight: 800,
            borderRadius: 3,
            boxShadow: `0 10px 30px ${getStatusColor()}30`,
          }}
        >
          {workerActive 
            ? t("Pages.SyncCenter.actions.openDashboard").toUpperCase() 
            : t("Pages.SyncCenter.actions.launchWorker").toUpperCase()}
        </Button>

        <Typography variant="caption" sx={{ opacity: 0.3, mt: 4 }}>
            {t("Pages.SyncCenter.stats.engineVersion")} 3.2 • Powered by Schoice Core
        </Typography>
      </MotionBox>

      <style>{`
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .text-gradient {
            background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
      `}</style>
    </Box>
  );
}
