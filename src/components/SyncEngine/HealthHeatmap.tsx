import React, { memo } from "react";
import { Box, useTheme, useMediaQuery, GlobalStyles } from "@mui/material";
import useSyncDashboardStore, { HealthStatus } from "../../store/SyncDashboard.store";

/**
 * Optimized StockPixel component using React.memo to prevent unnecessary re-renders.
 * Only re-renders when the status of this specific stock changes.
 */
const StockPixel = memo(({ id, status, size }: { id: string; status: HealthStatus; size: string }) => {
  const getStatusColor = (status: HealthStatus) => {
    switch (status) {
      case "fresh": return "#10B981";
      case "stale": return "rgba(255, 255, 255, 0.15)";
      case "missing": return "#FBBF24";
      case "syncing": return "#3B82F6";
      case "error": return "#EF4444";
      default: return "rgba(255, 255, 255, 0.08)";
    }
  };

  const color = getStatusColor(status);

  return (
    <Box
      data-stock-id={id}
      sx={{
        width: size,
        height: size,
        borderRadius: "2px",
        backgroundColor: color,
        transition: "background-color 0.3s ease",
        cursor: "pointer",
        position: "relative",
        "&:hover": {
          transform: "scale(1.5)",
          zIndex: 10,
          boxShadow: `0 0 10px ${color}`,
          "&::after": {
            content: `"${id}"`,
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0,0,0,0.8)",
            color: "white",
            padding: "2px 6px",
            borderRadius: "4px",
            fontSize: "10px",
            whiteSpace: "nowrap",
            zIndex: 100,
            pointerEvents: "none",
          }
        },
        ...(status === "syncing" && {
          animation: "syncPulse 1.5s infinite ease-in-out",
        }),
      }}
    />
  );
}, (prev, next) => prev.status === next.status && prev.size === next.size);

/**
 * HealthHeatmap - High-performance visualization for thousands of stock points.
 * Optimized to handle high-frequency status updates without crashing the webview.
 */
const HealthHeatmap: React.FC = () => {
  const { syncHealthMap } = useSyncDashboardStore();
  const theme = useTheme();
  
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const pixelSize = isMobile ? "8px" : isTablet ? "10px" : "12px";

  // Use a stable array of keys. Dependency must be the length of keys since map is an object.
  const stockIds = React.useMemo(() => Object.keys(syncHealthMap), [Object.keys(syncHealthMap).length]);

  return (
    <>
      <GlobalStyles
        styles={{
          "@keyframes syncPulse": {
            "0%": { opacity: 0.4, transform: "scale(1)" },
            "50%": { opacity: 1, transform: "scale(1.15)" },
            "100%": { opacity: 0.4, transform: "scale(1)" },
          },
        }}
      />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fill, minmax(${pixelSize}, 1fr))`,
          gap: isMobile ? "2px" : "4px",
          p: 2,
          overflowY: "auto",
          maxHeight: "60vh",
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "10px",
          },
        }}
      >
        {stockIds.map((id) => (
          <StockPixel 
            key={id} 
            id={id} 
            status={syncHealthMap[id]} 
            size={pixelSize} 
          />
        ))}
      </Box>
    </>
  );
};

export default HealthHeatmap;
