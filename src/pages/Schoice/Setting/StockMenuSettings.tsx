import { CloudDownload, Refresh } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import useDownloadStocks from "../../../hooks/useDownloadStocks";
import { getStore } from "../../../store/Setting.store";

export default function StockMenuSettings() {
  const { handleDownloadMenu, disable } = useDownloadStocks();
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  useEffect(() => {
    getStore().then((store) => {
      store.get("lastMenuUpdate").then((val) => {
        if (typeof val === "number") setLastUpdate(val);
      });
    });
  }, [disable]);

  const formatLastUpdate = (timestamp: number) => {
    if (timestamp === 0) return "從未更新";
    return new Date(timestamp).toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <CloudDownload color="primary" />
          <Typography variant="h6" fontWeight="bold">
            股票選單管理
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary" mb={3}>
          更新本地股票選單資料，包含名稱、產業別及發行股數。這些資料將備份到本地資料庫中。
        </Typography>

        <Stack spacing={2}>
          <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={2}
            >
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  選單同步狀態
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  最後更新: {formatLastUpdate(lastUpdate)}
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="medium"
                color="primary"
                startIcon={<Refresh />}
                onClick={() => handleDownloadMenu()}
                disabled={disable}
              >
                {disable ? "更新中..." : "立即更新"}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
