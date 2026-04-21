import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import useSyncDashboardStore from "../../store/SyncDashboard.store";
import SpeedIcon from "@mui/icons-material/Speed";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import TimerIcon from "@mui/icons-material/Timer";
import AssignmentIcon from "@mui/icons-material/Assignment";

const LiveTelemetry: React.FC = () => {
  const { syncStats } = useSyncDashboardStore();
  const { t } = useTranslation();

  const metrics = [
    { icon: <SpeedIcon sx={{ fontSize: "1.1rem" }} />, label: t("Pages.SyncCenter.stats.rpm"), value: syncStats.rpm, color: "#3B82F6" },
    { icon: <TimerIcon sx={{ fontSize: "1.1rem" }} />, label: t("Pages.SyncCenter.stats.remaining"), value: syncStats.remainingTime, color: "#FBBF24" },
    { icon: <AssignmentIcon sx={{ fontSize: "1.1rem" }} />, label: t("Pages.SyncCenter.stats.progress"), value: `${syncStats.completed}/${syncStats.total}`, color: "#A855F7" },
    { icon: <CheckCircleOutlineIcon sx={{ fontSize: "1.1rem" }} />, label: t("Pages.SyncCenter.stats.successRate"), value: `${syncStats.successRate}%`, color: "#10B981" },
  ];

  return (
    <Stack spacing={1.5}>
      {metrics.map((m, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 1.5,
              borderRadius: 2,
              backgroundColor: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.05)",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.06)",
                transform: "translateX(-4px)",
              }
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ color: m.color, display: "flex" }}>{m.icon}</Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.85rem", fontWeight: 600, opacity: 0.9 }}>
                {m.label}
              </Typography>
            </Stack>
            <Typography variant="body1" sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: m.color }}>
              {m.value}
            </Typography>
          </Box>
        </motion.div>
      ))}
    </Stack>
  );
};

export default LiveTelemetry;
