import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { ToastContainer } from "react-toastify";
import "./App.css";
import { UserProvider } from "./context/UserContext";
import Schoice from "./pages/Schoice";
import Backtest from "./pages/Schoice/Backtest";
import Favorite from "./pages/Schoice/Favorite";
import Fundamental from "./pages/Schoice/Fundamental";
import PromptAdd from "./pages/Schoice/PromptAdd";
import PromptEdit from "./pages/Schoice/PromptEdit";
import PromptList from "./pages/Schoice/PromptList";
import Setting from "./pages/Schoice/Setting";
import Trash from "./pages/Schoice/Trash";

import { Box, CssBaseline, ThemeProvider, useMediaQuery } from "@mui/material";
import { useMemo } from "react";
import Detail from "./pages/Detail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import useSchoiceStore from "./store/Schoice.store";
import { getTheme } from "./theme";
import SyncCenter from "./pages/Schoice/SyncCenter";
import SyncWorker from "./pages/Schoice/SyncWorker";
import { DatabaseContext } from "./context/DatabaseContext";
import useDatabase from "./hooks/useDatabase";
import useDatabaseDates from "./hooks/useDatabaseDates";
import { useEffect } from "react";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/schoice" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="detail/:id" element={<Detail />} />
        <Route path="/sync-worker" element={<SyncWorker />} />
        
        <Route path="/schoice" element={<Schoice />}>
          <Route index element={<PromptList />} />
          <Route path="sync" element={<SyncCenter />} />
          <Route path="favorite" element={<Favorite />} />
          <Route path="add" element={<PromptAdd />} />
          <Route path="edit/:id" element={<PromptEdit />} />
          <Route path="setting" element={<Setting />} />
          <Route path="trash" element={<Trash />} />
          <Route path="backtest" element={<Backtest />} />
          <Route path="fundamental" element={<Fundamental />} />
          <Route path="*" element={<Navigate to="/schoice" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

function App() {
  const { theme } = useSchoiceStore();
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const themeConfig = useMemo(() => {
    const mode =
      (theme as "light" | "dark") || (prefersDarkMode ? "dark" : "light");
    return getTheme(mode);
  }, [theme, prefersDarkMode]);

  const { db, dbType, switchDatabase, isSwitching } = useDatabase();
  const { dates, fetchDates, isLoading } = useDatabaseDates(db);

  return (
    <UserProvider>
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
          <Box sx={{ width: "100%" }}>
            <AppRoutes />
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick={false}
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme={themeConfig.palette.mode}
            />
          </Box>
        </ThemeProvider>
      </DatabaseContext.Provider>
    </UserProvider>
  );
}

export default App;
