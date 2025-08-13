import {
  Box,
  createTheme,
  styled,
  ThemeProvider,
  useMediaQuery,
} from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { useEffect, useMemo } from "react";
import { Outlet, useNavigate } from "react-router";
import { useUser } from "../../context/UserContext";
import useDatabase from "../../hooks/useDatabase";
import useDatabaseDates from "../../hooks/useDatabaseDates";
import useSchoiceStore from "../../store/Schoice.store";
import { supabase } from "../../tools/supabase";
import Header from "./layout/Header";
import SideBar from "./layout/Sidebar";
import { DatabaseContext } from "../../context/DatabaseContext";

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
  const db = useDatabase();
  const navigate = useNavigate();
  const { user } = useUser();
  const { dates, fetchDates } = useDatabaseDates(db);
  const { reload, theme } = useSchoiceStore();
  useEffect(() => {
    if (user) {
      reload(user.id);
    }
  }, []);

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
    <DatabaseContext.Provider value={{ db, dates, fetchDates }}>
      <ThemeProvider theme={themeConfig}>
        <CssBaseline />
        <Main>
          <SideBar />
          <Header />
          <Outlet />
        </Main>
      </ThemeProvider>
    </DatabaseContext.Provider>
  );
}
export default Schoice;
