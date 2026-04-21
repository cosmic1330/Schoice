import { Box, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { useTranslation } from "react-i18next";
import useSyncDashboardStore from "../../store/SyncDashboard.store";

/**
 * EventTerminal - Advanced HUD Log Terminal.
 */
const EventTerminal: React.FC = () => {
  const { syncLogs } = useSyncDashboardStore();
  const { t } = useTranslation();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when logs change
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [syncLogs]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "error":
        return "#EF4444";
      case "wait":
        return "#FBBF24";
      case "success":
        return "#10B981";
      default:
        return "#94A3B8";
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          borderRadius: 2,
          p: 2,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.85rem",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 0.8,
          scrollBehavior: "smooth",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          boxShadow: "inset 0 4px 12px rgba(0,0,0,0.4)",
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "10px",
          },
        }}
      >
        <AnimatePresence initial={false}>
          {syncLogs.length === 0 ? (
            <Typography
              variant="body2"
              color="text.disabled"
              sx={{ fontStyle: "italic", fontSize: "0.9rem", opacity: 0.5 }}
            >
              {t("Pages.SyncCenter.terminal.empty")}
            </Typography>
          ) : (
            syncLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.1 }}
                style={{
                  display: "flex",
                  gap: "10px",
                  borderLeft: `2px solid ${getTypeColor(log.type)}30`,
                  paddingLeft: "8px",
                }}
              >
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.3)",
                    userSelect: "none",
                    fontSize: "0.75rem",
                    minWidth: "65px",
                  }}
                >
                  [{log.time}]
                </Typography>
                <Typography
                  sx={{
                    color: getTypeColor(log.type),
                    wordBreak: "break-all",
                    lineHeight: 1.4,
                    fontWeight: 500,
                  }}
                >
                  {log.msg}
                </Typography>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default EventTerminal;
