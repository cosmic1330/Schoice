import {
  Box,
  CircularProgress,
  createTheme,
  styled,
  ThemeProvider,
  useMediaQuery,
} from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { DatabaseContext } from "../../context/DatabaseContext";
import { useUser } from "../../context/UserContext";
import useDatabase from "../../hooks/useDatabase";
import useDatabaseDates from "../../hooks/useDatabaseDates";
import useSchoiceStore from "../../store/Schoice.store";
import { supabase } from "../../tools/supabase";
import Header from "./layout/Header";
import SideBar from "./layout/Sidebar";
import WaitingPage from "./WaitingPage";

const Main = styled(Box)`
  width: 100%;
  min-height: 100vh;
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "sidebar header "
    "sidebar  page  ";

  // mobile
  @media screen and (max-width: 600px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr;
    grid-template-areas:
      "sidebar"
      "header"
      "page"
      "page";
  }
`;

function Schoice() {
  const { session, loading } = useUser();
  const { db, dbType, switchDatabase, isSwitching } = useDatabase();
  const [isAppReady, setIsAppReady] = useState(false);
  const navigate = useNavigate();
  const { dates, fetchDates, isLoading } = useDatabaseDates(db);
  const { theme } = useSchoiceStore();

  // 檢查是否所有依賴都已準備好
  const userReady = !loading && session !== null;
  const dbReady = db !== null;
  const allReady = userReady && dbReady;

  const handleReady = () => {
    setIsAppReady(true);
  };

  // 監聽系統的深色模式設定
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  // 動態設定主題
  const themeConfig = useMemo(
    () =>
      createTheme({
        palette: {
          mode: (theme as any) || (prefersDarkMode ? "dark" : "light"),
        },
      }),
    [prefersDarkMode, theme]
  );

  useEffect(() => {
    // 檢測是否登入
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!user) {
          navigate("/login");
        }
      })
      .catch(() => {
        // 如果檢測失敗，則重定向到登入
        navigate("/login");
      });
  }, []);

  // 如果使用者正在載入，顯示載入畫面
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // 如果使用者已登入但資料庫未準備好，或者整個應用尚未準備好，顯示等待頁面
  if (!allReady || !isAppReady) {
    return (
      <WaitingPage
        userLoading={loading}
        userReady={userReady}
        dbReady={dbReady}
        onReady={handleReady}
      />
    );
  }

  return (
    <DatabaseContext.Provider
      value={{
        db,
        dates,
        fetchDates,
        isLoading,
        dbType,
        switchDatabase,
        isSwitching,
      }}
    >
      <ThemeProvider theme={themeConfig}>
        <CssBaseline />
        <Main>
          <SideBar />
          <Header />
          <Outlet />
        </Main>
        {/* <DatabasePerformanceDebugger /> */}
      </ThemeProvider>
    </DatabaseContext.Provider>
  );
}
export default Schoice;
