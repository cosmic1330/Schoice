import RefreshIcon from "@mui/icons-material/Refresh";
import SyncIcon from "@mui/icons-material/Sync";
import { alpha, Button, CircularProgress, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSyncLaunch } from "../../../../../../hooks/useSyncLaunch";

export default function UpdateDeals() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { launch, workerActive, syncStatus } = useSyncLaunch();

  const isIdle = syncStatus === "idle";
  const isSyncing = syncStatus === "syncing" || syncStatus === "scanning";
  const isCooling = syncStatus === "cooling";

  const getStatusColor = () => {
    if (isSyncing) return "primary";
    if (isCooling) return "warning";
    if (isIdle && workerActive) return "info";
    return "primary";
  };

  const getStatusHex = () => {
    const color = getStatusColor();
    return (theme.palette as any)[color].main;
  };

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Tooltip title={t("Pages.Schoice.Header.updateData")} arrow>
        <Button
          variant="contained"
          onClick={launch}
          size="small"
          color={getStatusColor()}
          sx={{
            minWidth: 0,
            width: 32,
            height: 32,
            borderRadius: "50%",
            p: 0,
            boxShadow: isSyncing || isCooling 
              ? `0 0 12px ${alpha(getStatusHex(), 0.4)}`
              : "none",
            bgcolor: isSyncing || isCooling ? alpha(getStatusHex(), 0.1) : undefined,
            color: isSyncing || isCooling ? getStatusHex() : undefined,
            "&:hover": {
              bgcolor: isSyncing || isCooling ? alpha(getStatusHex(), 0.15) : undefined,
              transform: "scale(1.05)",
            },
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {isSyncing || isCooling ? (
            <CircularProgress
              size={16}
              thickness={6}
              sx={{ color: getStatusHex() }}
            />
          ) : (
             <SyncIcon sx={{ fontSize: 18 }} />
          )}
        </Button>
      </Tooltip>

      {(isSyncing || isCooling) && (
        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            color: getStatusHex(),
            fontSize: "0.7rem",
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          {isCooling ? "Cooling" : "Syncing"}
        </Typography>
      )}
    </Stack>
  );
}
