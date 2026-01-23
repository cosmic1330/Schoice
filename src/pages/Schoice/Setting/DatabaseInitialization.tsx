import { RestartAlt } from "@mui/icons-material";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { confirm } from "@tauri-apps/plugin-dialog";
import { useContext } from "react";
import { toast } from "react-toastify";

import SqliteDataManager from "../../../classes/SqliteDataManager";
import { DatabaseContext } from "../../../context/DatabaseContext";
import useSchoiceStore from "../../../store/Schoice.store";

export default function DatabaseInitialization() {
  const { db } = useContext(DatabaseContext);
  const { changeDataCount } = useSchoiceStore();

  const handleInitializeDB = async () => {
    if (!db) return;

    const isConfirmed = await confirm(
      "確定要手動初始化嗎？這將會清空所有 SQLite 資料，且此操作無法復原。",
      { title: "手動初始化", kind: "warning" },
    );
    if (!isConfirmed) return;

    // 清空資料表
    const sqliteDataManager = new SqliteDataManager(db);
    const success = await sqliteDataManager.clearTable();

    if (success) {
      changeDataCount(0);
      toast.success("資料庫已初始化");
    } else {
      toast.error("資料庫初始化失敗");
    }
  };

  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Card sx={{ height: "100%" }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <RestartAlt color="warning" />
            <Typography variant="h6" fontWeight="bold">
              手動初始化
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" mb={2}>
            手動清空本地 SQLite
            資料庫所有內容並重置狀態。此操作無法復原，請謹慎執行。
          </Typography>
        </CardContent>
        <CardActions>
          <Button
            variant="contained"
            color="warning"
            startIcon={<RestartAlt />}
            fullWidth
            onClick={handleInitializeDB}
          >
            初始化資料庫
          </Button>
        </CardActions>
      </Card>
    </Grid>
  );
}
