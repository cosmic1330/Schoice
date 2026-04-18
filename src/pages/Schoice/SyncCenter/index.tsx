import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RefreshIcon from "@mui/icons-material/Refresh";
import StopIcon from "@mui/icons-material/Stop";
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
import EventTerminal from "../../../components/SyncEngine/EventTerminal";
import HealthHeatmap from "../../../components/SyncEngine/HealthHeatmap";
import LiveTelemetry from "../../../components/SyncEngine/LiveTelemetry";
import { useSyncEngine } from "../../../hooks/useSyncEngine";

const MotionBox = motion(Box);

export default function SyncCenter() {
  const { t } = useTranslation();
  const { syncStatus, syncStats, start, stop, clearSyncLogs } = useSyncEngine();

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
        p: { xs: 0.5, md: 1 },
        overflow: "hidden",
        gap: 1,
      }}
    >
      {/* Top HUD Control Bar */}
      <Box
        className="glass-card"
        sx={{
          p: 1,
          px: 2,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 160 }}>
          <Typography
            variant="subtitle1"
            fontWeight="900"
            sx={{ letterSpacing: -0.5, lineHeight: 1.1 }}
            className="text-gradient"
          >
            {t("Pages.SyncCenter.title")}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", mt: 0.2, gap: 1 }}>
            <AnimatePresence mode="wait">
              <MotionBox
                key={syncStatus}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Chip
                  label={t(`Pages.SyncCenter.status.${syncStatus}`)}
                  size="small"
                  sx={{
                    height: 22,
                    px: 0.5,
                    fontSize: "0.75rem",
                    fontWeight: 800,
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
              sx={{ opacity: 0.5, fontSize: "0.7rem" }}
            >
              {t("Pages.SyncCenter.stats.engineVersion")} 3.2
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={0.5}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.8rem", fontWeight: 700 }}
            >
              {t("Pages.SyncCenter.stats.progress")}
            </Typography>
            <Typography
              variant="caption"
              color="primary"
              sx={{ fontWeight: 900, fontSize: "0.9rem" }}
            >
              {Math.round(progress)}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: "rgba(255,255,255,0.05)",
              "& .MuiLinearProgress-bar": {
                borderRadius: 4,
                background: "linear-gradient(90deg, #3B82F6, #A855F7)",
              },
            }}
          />
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="contained"
            size="small"
            startIcon={
              syncStatus === "syncing" ? (
                <RefreshIcon className="spin" sx={{ fontSize: "1rem" }} />
              ) : (
                <PlayArrowIcon sx={{ fontSize: "1.1rem" }} />
              )
            }
            onClick={start}
            disabled={syncStatus === "syncing" || syncStatus === "scanning"}
            className="accent-gradient"
            sx={{
              px: 3,
              height: 38,
              fontSize: "0.875rem",
              fontWeight: 700,
              borderRadius: 2,
            }}
          >
            {syncStatus === "paused"
              ? t("Pages.SyncCenter.actions.resume")
              : t("Pages.SyncCenter.actions.start")}
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<StopIcon sx={{ fontSize: "1rem" }} />}
            onClick={stop}
            disabled={
              syncStatus === "idle" ||
              syncStatus === "stopped" ||
              syncStatus === "success"
            }
            sx={{
              height: 38,
              px: 2,
              fontSize: "0.875rem",
              borderRadius: 2,
              borderColor: "rgba(239, 68, 68, 0.3)",
              color: "#EF4444",
              "&:hover": {
                borderColor: "#EF4444",
                backgroundColor: "rgba(239, 68, 68, 0.05)",
              },
            }}
          >
            {t("Pages.SyncCenter.actions.stop")}
          </Button>
        </Stack>
      </Box>

      {/* Main Content Area */}
      <Grid container spacing={1} sx={{ flex: 1, minHeight: 0 }}>
        {/* Left Side: Heatmap */}
        <Grid size={{ xs: 12, lg: 9 }} sx={{ height: "100%" }}>
          <Box
            className="glass-card"
            sx={{
              borderRadius: 2.5,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <Box
              sx={{
                p: 1,
                px: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid var(--glass-border)",
              }}
            >
              <Typography
                variant="caption"
                fontWeight="800"
                sx={{
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  fontSize: "0.8rem",
                  opacity: 0.9,
                }}
              >
                {t("Pages.SyncCenter.heatmap.title")}
              </Typography>
              <Stack direction="row" spacing={2}>
                {["fresh", "missing", "syncing", "error"].map((type) => (
                  <Stack
                    key={type}
                    direction="row"
                    alignItems="center"
                    spacing={0.7}
                  >
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        backgroundColor:
                          type === "fresh"
                            ? "#10B981"
                            : type === "missing"
                              ? "#FBBF24"
                              : type === "syncing"
                                ? "#3B82F6"
                                : "#EF4444",
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ fontSize: "0.75rem", fontWeight: 600, opacity: 0.8 }}
                    >
                      {t(`Pages.SyncCenter.heatmap.legend.${type}`)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
            <Box sx={{ flex: 1, overflow: "hidden", p: 1 }}>
              <HealthHeatmap />
            </Box>
          </Box>
        </Grid>

        {/* Right Side: Telemetry + Terminal */}
        <Grid
          size={{ xs: 12, lg: 3 }}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {/* Telemetry Panel */}
          <Box className="glass-card" sx={{ p: 1, borderRadius: 2 }}>
            <Typography
              variant="caption"
              fontWeight="900"
              sx={{
                mb: 2,
                display: "block",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                fontSize: "0.8rem",
                opacity: 0.9,
                color: "primary.main",
              }}
            >
              {t("Pages.SyncCenter.telemetry.title")}
            </Typography>
            <LiveTelemetry />
          </Box>

          {/* Terminal Panel */}
          <Box
            className="glass-card"
            sx={{
              flex: 1,
              minHeight: 0,
              p: 1,
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography
                variant="caption"
                fontWeight="900"
                sx={{
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  fontSize: "0.8rem",
                  opacity: 0.9,
                  color: "secondary.main",
                }}
              >
                {t("Pages.SyncCenter.terminal.title")}
              </Typography>
              <Button
                size="small"
                variant="text"
                color="inherit"
                onClick={clearSyncLogs}
                sx={{ opacity: 0.4, fontSize: "0.75rem", minWidth: 0, p: 0 }}
              >
                {t("Pages.SyncCenter.actions.clearLogs")}
              </Button>
            </Stack>
            <Box sx={{ flex: 1, overflow: "hidden" }}>
              <EventTerminal />
            </Box>
          </Box>
        </Grid>
      </Grid>

      <style>{`
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </Box>
  );
}
