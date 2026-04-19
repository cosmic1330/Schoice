import BarChartIcon from "@mui/icons-material/BarChart";
import { Box, Stack, Tooltip, Typography, alpha } from "@mui/material";
import { error } from "@tauri-apps/plugin-log";
import { useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import SqliteDataManager from "../../../../../../classes/SqliteDataManager";
import { DatabaseContext } from "../../../../../../context/DatabaseContext";
import { useSyncEngine } from "../../../../../../hooks/useSyncEngine";
import useSchoiceStore from "../../../../../../store/Schoice.store";

export default function DataCount() {
  const { t } = useTranslation();
  const { data_count, changeDataCount } = useSchoiceStore();
  const { syncStatus } = useSyncEngine();
  const { db, dbType } = useContext(DatabaseContext);

  useEffect(() => {
    if (!db) return;

    const refreshCount = () => {
      const sqliteDataManager = new SqliteDataManager(db);
      sqliteDataManager
        .getLatestDailyDealCount()
        .then((result) => {
          changeDataCount(result.count);
        })
        .catch((e) => {
          error(`Error getting latest daily deal count: ${e}`);
        });
    };

    // 初始抓取
    refreshCount();

    // 如果正在同步或掃描，每 10 秒刷新一次
    let interval: any;
    if (syncStatus === "syncing" || syncStatus === "scanning") {
      console.log(
        "[DataCount] Active sync detected. Starting periodic refresh...",
      );
      interval = setInterval(refreshCount, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [db, syncStatus]);

  const sourceLabel = dbType === "postgres" ? "(Postgres)" : "(SQLite)";

  return (
    <Tooltip title={`${t("Pages.Schoice.Header.dataCount")} ${sourceLabel}`} arrow>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{
          px: 1,
          py: 0.2,
          borderRadius: "100px",
          transition: "all 0.2s ease",
          "&:hover": {
             bgcolor: (theme) => alpha(theme.palette.text.primary, 0.02),
          }
        }}
      >
        <BarChartIcon sx={{ color: "primary.main", fontSize: 16, opacity: 0.8 }} />
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, whiteSpace: "nowrap", flexShrink: 0 }}>
          <Typography
            variant="body2"
            noWrap
            sx={{
              fontWeight: 900,
              color: "text.primary",
              fontVariantNumeric: "tabular-nums",
              fontSize: "0.85rem",
              whiteSpace: "nowrap",
            }}
          >
            {data_count}
          </Typography>
          <Typography
            variant="caption"
            noWrap
            sx={{
              color: "text.secondary",
              fontWeight: 600,
              fontSize: "0.65rem",
              opacity: 0.6,
              whiteSpace: "nowrap",
            }}
          >
             {t("Pages.Schoice.Header.stockUnit")}
          </Typography>
        </Box>
      </Stack>
    </Tooltip>
  );
}
