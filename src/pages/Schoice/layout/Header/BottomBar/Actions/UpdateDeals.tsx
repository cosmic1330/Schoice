import RefreshIcon from "@mui/icons-material/Refresh";
import SyncIcon from "@mui/icons-material/Sync";
import { alpha, Button, CircularProgress, Stack, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSyncLaunch } from "../../../../../../hooks/useSyncLaunch";

export default function UpdateDeals() {
  const { t } = useTranslation();
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

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Tooltip title={t("Pages.Schoice.Header.updateData")} arrow>
        <Button
          variant={isSyncing || isCooling ? "soft" : ("contained" as any)}
          onClick={launch}
          size="medium"
          color={getStatusColor()}
          startIcon={
            isSyncing ? (
              <RefreshIcon className="spin" />
            ) : isCooling ? (
              <CircularProgress size={18} color="warning" thickness={5} />
            ) : (
              <SyncIcon />
            )
          }
          sx={{
            borderRadius: "12px",
            height: 40,
            px: 2.5,
            fontWeight: 800,
            // 保持清爽：只在閒置時顯示完整文字，同步中保持簡約
            minWidth: isSyncing || isCooling ? "auto" : 120,
            boxShadow: (theme) =>
              isIdle
                ? `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.2)}`
                : "none",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {!(isSyncing || isCooling) &&
            (workerActive
              ? t("Pages.SyncCenter.actions.openDashboard")
              : t("Pages.Schoice.Header.updateData"))}
        </Button>
      </Tooltip>

      <style>{`
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </Stack>
  );
}
