import {
  Box,
  createTheme,
  styled,
  ThemeProvider,
  useMediaQuery,
} from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import Database from "@tauri-apps/plugin-sql";
import { useEffect, useMemo } from "react";
import { Outlet, useNavigate } from "react-router";
import { DatabaseContext } from "../../context/DatabaseContext";
import useDatabaseDates from "../../hooks/useDatabaseDates";
import useSchoiceStore from "../../store/Schoice.store";
import { supabase } from "../../tools/supabase";
import Header from "./layout/Header";
import SideBar from "./layout/Sidebar";

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

function Schoice({ db }: { db: Database | null }) {
  const navigate = useNavigate();
  const { dates, fetchDates, isLoading } = useDatabaseDates(db);
  const { theme } = useSchoiceStore();

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

  return (
    <DatabaseContext.Provider value={{ db, dates, fetchDates, isLoading }}>
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
