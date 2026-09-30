import { Box, CircularProgress, styled } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { DatabaseContext } from "../../context/DatabaseContext";
import { useUser } from "../../context/UserContext";
import Header from "./layout/Header";
import SideBar from "./layout/Sidebar";
import WaitingPage from "./WaitingPage";

const Main = styled(Box)`
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "sidebar header "
    "sidebar  page  ";

  isolation: isolate;
  transition: background 0.3s ease;
  background-color: ${({ theme }) => theme.palette.background.default};
  background-image: ${({ theme }) =>
    theme.palette.mode === "light"
      ? `radial-gradient(circle at 12% 18%, rgba(255,159,197,.32) 0 5px, transparent 6px),
         radial-gradient(circle at 82% 12%, rgba(91,185,233,.28) 0 7px, transparent 8px),
         linear-gradient(115deg, transparent 0 63%, rgba(255,217,106,.18) 63% 75%, transparent 75%),
         repeating-linear-gradient(-9deg, transparent 0 34px, rgba(255,159,197,.07) 35px 38px, transparent 39px 58px)`
      : `radial-gradient(circle at 12% 18%, rgba(255,159,197,.18) 0 5px, transparent 6px),
         radial-gradient(circle at 82% 12%, rgba(112,201,241,.18) 0 7px, transparent 8px)`};

  &::after {
    content: "★";
    position: absolute;
    right: 3vw;
    bottom: 2vh;
    z-index: -1;
    color: #ffd96a;
    font-size: clamp(50px, 8vw, 100px);
    line-height: 1;
    transform: rotate(12deg);
    -webkit-text-stroke: 3px #202027;
    opacity: 0.34;
  }

  // mobile
  @media screen and (max-width: 600px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr;
    grid-template-areas:
      "sidebar"
      "header"
      "page";
  }
`;

function Schoice() {
  const { session, loading, status } = useUser();
  const { db } = useContext(DatabaseContext);
  const [isAppReady, setIsAppReady] = useState(false);
  const navigate = useNavigate();

  // 檢查是否所有依賴都已準備好
  const userReady = !loading && session !== null;
  const dbReady = db !== null;
  const allReady = userReady && dbReady;

  const handleReady = () => {
    setIsAppReady(true);
  };

  useEffect(() => {
    if (status === "unauthenticated" || status === "error") {
      navigate("/login", { replace: true });
    }
  }, [navigate, status]);

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
        db={db}
        onReady={handleReady}
      />
    );
  }

  return (
    <Main>
      <SideBar />
      <Header />
      <Box sx={{ gridArea: "page", overflow: "hidden" }}>
        <Outlet />
      </Box>
    </Main>
  );
}
export default Schoice;
