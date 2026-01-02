import BarChartIcon from "@mui/icons-material/BarChart";
import { Box, Stack, Typography, alpha } from "@mui/material";
import { error } from "@tauri-apps/plugin-log";
import { useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import SqliteDataManager from "../../../../../../classes/SqliteDataManager";
import { DatabaseContext } from "../../../../../../context/DatabaseContext";
import useSchoiceStore from "../../../../../../store/Schoice.store";

export default function DataCount() {
  const { t } = useTranslation();
  const { data_count, changeDataCount } = useSchoiceStore();
  const { db, dbType } = useContext(DatabaseContext);

  useEffect(() => {
    if (!db) return;
    const sqliteDataManager = new SqliteDataManager(db);
    sqliteDataManager
      .getLatestDailyDealCount()
      .then((result) => {
        changeDataCount(result.count);
      })
      .catch((e) => {
        error(`Error getting latest daily deal count: ${e}`);
      });
  }, [db]);

  const sourceLabel = dbType === "postgres" ? "(Postgres)" : "(SQLite)";

  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      sx={{
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
        px: 2,
        py: 0.8,
        borderRadius: 2,
        border: "1px solid",
        borderColor: (theme) => alpha(theme.palette.primary.main, 0.1),
      }}
    >
      <BarChartIcon sx={{ color: "primary.main", fontSize: 20 }} />
      <Box>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontWeight: 600,
            display: "block",
            lineHeight: 1,
          }}
        >
          {t("Pages.Schoice.Header.dataCount")} {sourceLabel}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 800,
            color: "primary.main",
            lineHeight: 1.2,
          }}
        >
          {data_count} {t("Pages.Schoice.Header.stockUnit")}
        </Typography>
      </Box>
    </Stack>
  );
}
