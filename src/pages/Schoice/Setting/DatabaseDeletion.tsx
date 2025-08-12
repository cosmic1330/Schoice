import { Delete } from "@mui/icons-material";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { useContext } from "react";
import { toast } from "react-toastify";

import SqliteDataManager from "../../../classes/SqliteDataManager";
import { DatabaseContext } from "../../../context/DatabaseContext";
import useSchoiceStore from "../../../store/Schoice.store";
export default function DatabaseDeletion() {
  const { db } = useContext(DatabaseContext);
  const { changeDataCount } = useSchoiceStore();

  const handleClearDB = async () => {
    if (!db) return;
    // 清空資料表
    const sqliteDataManager = new SqliteDataManager(db);
    await sqliteDataManager.clearTable();
    changeDataCount(0);
    toast.success("資料庫已清空");
  };

  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Card sx={{ height: "100%" }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <Delete color="error" />
            <Typography variant="h6" fontWeight="bold">
              資料庫刪除
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" mb={2}>
            永久刪除資料庫及所有內容。此操作無法復原，請先備份。
          </Typography>
        </CardContent>
        <CardActions>
          <Button
            variant="contained"
            color="error"
            startIcon={<Delete />}
            fullWidth
            onClick={handleClearDB}
          >
            刪除資料庫
          </Button>
        </CardActions>
      </Card>
    </Grid>
  );
}
