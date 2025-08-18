import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { ToastContainer } from "react-toastify";
import "./App.css";
import { UserProvider, useUser } from "./context/UserContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Schoice from "./pages/Schoice";
import Backtest from "./pages/Schoice/Backtest";
import Favorite from "./pages/Schoice/Favorite";
import Fundamental from "./pages/Schoice/Fundamental";
import PromptAdd from "./pages/Schoice/PromptAdd";
import PromptEdit from "./pages/Schoice/PromptEdit";
import PromptList from "./pages/Schoice/PromptList";
import Setting from "./pages/Schoice/Setting";
import Trash from "./pages/Schoice/Trash";
import WaitingPage from "./pages/WaitingPage";

import { Box, CircularProgress, CssBaseline } from "@mui/material";
import { useState } from "react";
import "./App.css";
import useDatabase from "./hooks/useDatabase";

const AppRoutes = () => {
  const { session, loading } = useUser();
  const db = useDatabase();
  const [isAppReady, setIsAppReady] = useState(false);

  // 檢查是否所有依賴都已準備好
  const userReady = !loading && session !== null;
  const dbReady = db !== null;
  const allReady = userReady && dbReady;

  const handleReady = () => {
    setIsAppReady(true);
  };

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

  // 如果使用者未登入，直接顯示登入/註冊頁面
  if (!session) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
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

  // 所有依賴都準備好了，顯示主應用
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/schoice" />} />
        <Route path="/login" element={<Navigate to="/schoice" />} />
        <Route path="/register" element={<Navigate to="/schoice" />} />
        <Route path="/schoice" element={<Schoice db={db} />}>
          <Route index element={<PromptList />} />
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
  return (
    <UserProvider>
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
          theme="dark"
        />
      </Box>
    </UserProvider>
  );
}

export default App;
