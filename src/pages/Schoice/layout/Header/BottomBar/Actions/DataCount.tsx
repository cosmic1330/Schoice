import BarChartIcon from "@mui/icons-material/BarChart";
import { Box, Stack, Typography } from "@mui/material";
import { error } from "@tauri-apps/plugin-log";
import { useContext, useEffect } from "react";
import SqliteDataManager from "../../../../../../classes/SqliteDataManager";
import { DatabaseContext } from "../../../../../../context/DatabaseContext";
import useSchoiceStore from "../../../../../../store/Schoice.store";

export default function DataCount() {
  const { data_count, changeDataCount } = useSchoiceStore();
  const { db } = useContext(DatabaseContext);

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
  return (
    <Stack
      direction="row"
      py={0.8}
      px={1.2}
      spacing={1}
      alignItems="center"
      sx={{
        borderRadius: 1,
      }}
    >
      <BarChartIcon color="primary" />
      <Box>
        <Typography variant="body2" color="primary">
          資料統計
        </Typography>
        <Typography variant="body2" fontWeight={700} color="primary">
          {data_count} 檔
        </Typography>
      </Box>
    </Stack>
  );
}
