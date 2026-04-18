import React from "react";
import { Box, Tooltip, useTheme, useMediaQuery } from "@mui/material";
import { motion } from "framer-motion";
import useSyncDashboardStore, { HealthStatus } from "../../store/SyncDashboard.store";

/**
 * HealthHeatmap - Visualizes the status of all stocks as an adaptive grid.
 */
const HealthHeatmap: React.FC = () => {
  const { syncHealthMap } = useSyncDashboardStore();
  const theme = useTheme();
  
  // RWD: Adjust grid and pixel size based on screen width
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  
  const stocks = Object.keys(syncHealthMap);
  const pixelSize = isMobile ? "8px" : isTablet ? "10px" : "12px";

  const getStatusColor = (status: HealthStatus) => {
    switch (status) {
      case "fresh": return "#10B981";
      case "stale": return "rgba(255, 255, 255, 0.05)";
      case "missing": return "#FBBF24";
      case "syncing": return "#3B82F6";
      case "error": return "#EF4444";
      default: return "rgba(255, 255, 255, 0.03)";
    }
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fill, minmax(${pixelSize}, 1fr))`,
        gap: isMobile ? "2px" : "4px",
        p: 3,
        overflowY: "auto",
        maxHeight: "500px",
        "&::-webkit-scrollbar": { width: "6px" },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "var(--glass-border)",
          borderRadius: "10px",
        },
      }}
    >
      {stocks.map((id, index) => (
        <Tooltip key={id} title={`${id}: ${syncHealthMap[id]}`} arrow disableInteractive>
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(index * 0.001, 1), duration: 0.3 }}
          >
            <Box
              sx={{
                width: pixelSize,
                height: pixelSize,
                borderRadius: "2px",
                backgroundColor: getStatusColor(syncHealthMap[id]),
                transition: "all 0.2s ease",
                cursor: "pointer",
                "&:hover": {
                  transform: "scale(1.8)",
                  zIndex: 2,
                  boxShadow: `0 0 12px ${getStatusColor(syncHealthMap[id])}`,
                },
                ...(syncHealthMap[id] === "syncing" && {
                  animation: "syncPulse 1.2s infinite ease-in-out",
                  "@keyframes syncPulse": {
                    "0%": { opacity: 0.3, transform: "scale(1)" },
                    "50%": { opacity: 1, transform: "scale(1.2)" },
                    "100%": { opacity: 0.3, transform: "scale(1)" },
                  },
                }),
              }}
            />
          </motion.div>
        </Tooltip>
      ))}
    </Box>
  );
};

export default HealthHeatmap;
