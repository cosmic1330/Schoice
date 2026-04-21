import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Box,
  Stack,
  Tooltip,
  Typography,
  alpha,
  keyframes,
} from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import useSyncDashboardStore from "../../store/SyncDashboard.store";

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

/**
 * GlobalSyncIndicator - Shows sync status in the top bar.
 */
const GlobalSyncIndicator: React.FC = () => {
  const { syncStatus, syncStats } = useSyncDashboardStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const isSyncing = syncStatus === "syncing" || syncStatus === "scanning";
  const progress =
    syncStats.total > 0
      ? Math.round((syncStats.completed / syncStats.total) * 100)
      : 0;

  if (syncStatus === "idle" || syncStatus === "stopped") return null;

  return (
    <Tooltip
      title={
        isSyncing
          ? `${t("Pages.SyncCenter.stats.progress")}: ${progress}%`
          : t(`Pages.SyncCenter.status.${syncStatus}`)
      }
      arrow
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        onClick={() => navigate("/schoice/sync")}
        sx={{
          cursor: "pointer",
          px: 1.5,
          py: 0.5,
          borderRadius: 4,
          backgroundColor: (theme) =>
            alpha(
              syncStatus === "error"
                ? theme.palette.error.main
                : syncStatus === "success"
                  ? theme.palette.success.main
                  : theme.palette.primary.main,
              0.1,
            ),
          border: (theme) =>
            `1px solid ${alpha(
              syncStatus === "error"
                ? theme.palette.error.main
                : syncStatus === "success"
                  ? theme.palette.success.main
                  : theme.palette.primary.main,
              0.2,
            )}`,
          transition: "all 0.3s ease",
          "&:hover": {
            backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.1),
            transform: "translateY(-1px)",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            color: (theme) =>
              syncStatus === "error"
                ? theme.palette.error.main
                : syncStatus === "success"
                  ? theme.palette.success.main
                  : theme.palette.primary.main,
            animation: isSyncing ? `${spin} 2s linear infinite` : "none",
          }}
        >
          {syncStatus === "success" ? (
            <CheckCircleOutlineIcon sx={{ fontSize: "1rem" }} />
          ) : syncStatus === "error" ? (
            <ErrorOutlineIcon sx={{ fontSize: "1rem" }} />
          ) : (
            <RefreshIcon sx={{ fontSize: "1rem" }} />
          )}
        </Box>

        {isSyncing && (
          <Typography
            variant="caption"
            noWrap
            sx={{
              fontWeight: 800,
              fontSize: "0.75rem",
              fontFamily: "'Outfit', sans-serif",
              color: "text.primary",
              letterSpacing: 0.5,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {progress}%
          </Typography>
        )}
      </Stack>
    </Tooltip>
  );
};

export default GlobalSyncIndicator;
