import {
  Box,
  createTheme,
  styled,
  ThemeProvider,
  useMediaQuery,
} from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { useEffect, useMemo } from "react";
import { Outlet } from "react-router";
import { DatabaseContext } from "../../context/DatabaseContext";
import useDatabase from "../../hooks/useDatabase";
import useDatabaseDates from "../../hooks/useDatabaseDates";
import useSchoiceStore from "../../store/Schoice.store";
import Header from "./layout/Header";
import SideBar from "./layout/Sidebar";

const Main = styled(Box)`
  width: 100%;
  height: 100vh;
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
  const { reload, theme } = useSchoiceStore();
  const { dates, fetchDates } = useDatabaseDates(db);

  useEffect(() => {
    reload();
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
