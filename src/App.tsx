import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { ToastContainer } from "react-toastify";
import "./App.css";
import { useUser, UserProvider } from "./context/UserContext";
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

import { Box, CircularProgress, CssBaseline } from "@mui/material";
import "./App.css";

const AppRoutes = () => {
  const { session, loading } = useUser();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={!session ? <Navigate to="/login" /> : <Navigate to="/schoice" />} />
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/schoice" />} />
        <Route path="/register" element={!session ? <Register /> : <Navigate to="/schoice" />} />
        <Route path="/schoice" element={session ? <Schoice /> : <Navigate to="/login" />}>
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
}


function App() {
  return (
    <UserProvider>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", width: "100%" }}>
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
