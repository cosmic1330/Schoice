import { Backup, CheckCircle, Storage } from "@mui/icons-material";
import { Box, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";

export default function SystemStatus() {
  const [dbSize, setDbSize] = useState<string | null>(null);
  const [dbPath, setDbPath] = useState<string | null>(null);

  const getStorageSize = useCallback(async () => {
    // get_db_size 現在回傳 [size, db_path]
    const result = await invoke<[number, string]>("get_db_size");
    if (result && Array.isArray(result)) {
      const [size, path] = result;
      const sizeInGB = (size / (1024 * 1024 * 1024)).toFixed(2);
      setDbSize(`${sizeInGB} GB`);
      setDbPath(path);
    } else {
      setDbSize("未知");
      setDbPath(null);
    }
  }, []);

  useEffect(() => {
    getStorageSize();
  }, [getStorageSize]);

  return (
    <Box mt={4}>
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" mb={2}>
            系統狀態
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CheckCircle color="success" />
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    資料庫狀態：
                    <span style={{ color: "#2ecc40" }}>Online</span>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    2 分鐘前檢查
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Storage color="primary" />
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    資料庫大小：{dbSize || "載入中..."}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dbPath || "載入中..."}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Backup color="secondary" />
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    最後備份：昨天 23:42
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    今日已排程自動備份
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
