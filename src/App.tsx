import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { ToastContainer } from "react-toastify";
import "./App.css";
import { UserProvider } from "./context/UserContext";
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

import { Box, CssBaseline } from "@mui/material";
import "./App.css";

function App() {
  return (
    <UserProvider>
      <CssBaseline />
      <Box sx={{ height: "100vh", width: "100%" }}>
        <BrowserRouter>
          <Routes>
            <Route index element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="schoice" element={<Schoice />}>
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
        </BrowserRouter>
      </Box>
    </UserProvider>
  );
}

export default App;
