import {
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
  useTheme,
} from "@mui/material";
import Database from "@tauri-apps/plugin-sql";
import { useEffect, useState } from "react";
import useDownloadStocks from "../../hooks/useDownloadStocks";
import { getStore } from "../../store/Setting.store";
import { StockTableType } from "../../types";

interface WaitingPageProps {
  userLoading: boolean;
  userReady: boolean;
  dbReady: boolean;
  db: Database | null;
  onReady: () => void;
}

const WaitingPage = ({
  userLoading,
  userReady,
  dbReady,
  onReady,
}: WaitingPageProps) => {
  const theme = useTheme();
  const [progress, setProgress] = useState(0);
  const [menuReady, setMenuReady] = useState(false);
  const { handleDownloadMenu } = useDownloadStocks();

  useEffect(() => {
    console.log("WaitingPage 狀態更新:", { userLoading, userReady, dbReady });

    let newProgress = 0;
    if (!userLoading) newProgress += 30; // 用戶驗證完成
    if (dbReady) newProgress += 30; // 資料庫連線完成

    // 檢查 menu 資料
    getStore().then((store) => {
      Promise.all([store.get("menu"), store.get("lastMenuUpdate")]).then(
        ([menu, lastUpdate]) => {
          const menuList = menu as StockTableType[];
          const lastUpdateTime = (lastUpdate as number) || 0;
          const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
          const isExpired = Date.now() - lastUpdateTime > sevenDaysInMs;

          if (!menuList || menuList.length === 0 || isExpired) {
            console.warn(
              !menuList || menuList.length === 0
                ? "Menu is empty, please update your menu."
                : "Menu is expired, auto updating...",
            );
            handleDownloadMenu().then(() => {
              setMenuReady(true);
              console.log("Menu 資料更新完成");
            });
          } else {
            setMenuReady(true);
          }
        },
      );
    });

    // 更新進度條
    if (menuReady) newProgress += 40; // Menu 資料準備完成
    setProgress(newProgress);

    // 當所有條件都滿足時，延遲一點時間讓使用者看到完成狀態
    if (userReady && dbReady && menuReady) {
      console.log("所有服務都準備好了，即將進入主應用");
      setTimeout(() => {
        onReady();
      }, 500);
    }
  }, [userLoading, userReady, dbReady, menuReady, onReady]);

  const getStatusText = () => {
    if (userLoading) {
      return "正在驗證使用者身份...";
    } else if (!dbReady) {
      return "正在連接資料庫...";
    } else if (!menuReady) {
      return "正在下載選單資料...";
    } else if (userReady && dbReady && menuReady) {
      return "初始化完成！";
    }
    return "正在初始化...";
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: theme.palette.background.default,
        gap: 3,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          maxWidth: 400,
          width: "100%",
          padding: 3,
        }}
      >
        {/* Logo 或應用名稱 */}
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: "bold",
            color: theme.palette.primary.main,
            marginBottom: 2,
          }}
        >
          Schoice
        </Typography>

        {/* 主要載入指示器 */}
        <CircularProgress
          size={60}
          thickness={4}
          sx={{
            color: theme.palette.primary.main,
          }}
        />

        {/* 進度條 */}
        <Box sx={{ width: "100%", marginTop: 2 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.palette.grey[300],
              "& .MuiLinearProgress-bar": {
                borderRadius: 4,
                backgroundColor: theme.palette.primary.main,
              },
            }}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", marginTop: 1 }}
          >
            {progress}%
          </Typography>
        </Box>

        {/* 狀態文字 */}
        <Typography
          variant="body1"
          color="text.primary"
          sx={{
            textAlign: "center",
            marginTop: 1,
          }}
        >
          {getStatusText()}
        </Typography>

        {/* 詳細狀態 */}
        <Box sx={{ width: "100%", marginTop: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              使用者驗證
            </Typography>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: !userLoading
                  ? theme.palette.success.main
                  : theme.palette.grey[400],
              }}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              資料庫連線
            </Typography>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: dbReady
                  ? theme.palette.success.main
                  : theme.palette.grey[400],
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default WaitingPage;
