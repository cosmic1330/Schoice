import SyncIcon from "@mui/icons-material/Sync";
import {
  alpha,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useContext } from "react";
import { useTranslation } from "react-i18next";
import { DatabaseContext } from "../../../../../../context/DatabaseContext";
import useHighConcurrencyDeals, {
  Status,
} from "../../../../../../hooks/useHighConcurrencyDeals";
import useSchoiceStore from "../../../../../../store/Schoice.store";

export default function UpdateDeals() {
  const { t } = useTranslation();
  const { update_progress } = useSchoiceStore();
  const { run, status, stop } = useHighConcurrencyDeals();
  const { dbType } = useContext(DatabaseContext);

  const handleClick = useCallback(async () => {
    if (status === Status.Idle) {
      sessionStorage.removeItem("schoice:update:stop");
      run();
    } else {
      stop();
    }
  }, [status, run, stop]);

  if (dbType === "postgres") {
    return null;
  }

  const isIdle = status === Status.Idle;

  return (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      {!isIdle && update_progress > 0 && (
        <Stack direction="row" alignItems="center" spacing={1}>
          <CircularProgress size={16} thickness={6} />
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: "primary.main" }}
          >
            {t("Pages.Schoice.Header.updating")}: {update_progress}
          </Typography>
        </Stack>
      )}
      <Button
        variant="contained"
        onClick={handleClick}
        size="medium"
        startIcon={isIdle ? <SyncIcon /> : undefined}
        color={isIdle ? "primary" : "error"}
        sx={{
          borderRadius: "12px",
          px: 3,
          fontWeight: 800,
          boxShadow: (theme) =>
            isIdle
              ? `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.39)}`
              : `0 4px 14px 0 ${alpha(theme.palette.error.main, 0.39)}`,
          "&:hover": {
            boxShadow: (theme) =>
              isIdle
                ? `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.23)}`
                : `0 6px 20px 0 ${alpha(theme.palette.error.main, 0.23)}`,
          },
        }}
      >
        {status === Status.Download
          ? t("Pages.Schoice.Header.cancel")
          : t("Pages.Schoice.Header.updateData")}
      </Button>
    </Stack>
  );
}
