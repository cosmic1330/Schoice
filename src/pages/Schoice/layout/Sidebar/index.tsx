import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import FastRewindIcon from "@mui/icons-material/FastRewind";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import SmartButtonIcon from "@mui/icons-material/SmartButton";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { Box, IconButton, Stack, styled, Tooltip, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router";
import { toast } from "react-toastify";
import { logout } from "../../../../lib/auth";
import InsertRuleButton from "./InsertRuleButton";

const GridItem = styled(Box)`
  width: 88px;
  height: 100vh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  border-right: 3px solid #202027;
  padding: 12px 0 14px;
  background: ${({ theme }) =>
    theme.palette.mode === "light" ? "#fff1f6" : "#343145"};
  box-shadow: 5px 0 0 rgba(32, 32, 39, 0.08);
  z-index: 5;

  // mobile
  @media screen and (max-width: 600px) {
    width: 100%;
    border-right: 0;
    border-bottom: 3px solid #202027;
    flex-direction: row;
    position: relative;
    padding: 0 1rem;
    height: 60px;
  }
`;

export default function SideBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navButtonSx = (path: string) => ({
    width: 44,
    height: 44,
    color: "text.primary",
    border: "2px solid #202027",
    bgcolor: location.pathname === path ? "primary.main" : "background.paper",
    boxShadow: location.pathname === path ? "3px 3px 0 #202027" : "none",
    "&:hover": { bgcolor: "secondary.main" },
  });

  const toSetting = () => {
    navigate("/schoice/setting");
  };

  const onLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "登出失敗，請稍後再試。";
      toast.error(message);
    }
  };

  return (
    <Box gridArea="sidebar">
      <GridItem>
        <Stack
          spacing={2}
          alignItems="center"
          direction={{ xs: "row", sm: "column" }}
        >
          <Box sx={{ textAlign: "center", transform: "rotate(-2deg)" }}>
            <Box
              component="img"
              src="/schoice_icon.png"
              alt="logo"
              sx={{
                width: 52,
                height: 52,
                filter: "drop-shadow(2px 3px 0 rgba(32,32,39,.25))",
              }}
            />
            <Typography sx={{ fontWeight: 1000, fontSize: 10, letterSpacing: 1, mt: -0.5 }}>
              SCHOICE!
            </Typography>
          </Box>
          <Tooltip title="策略清單" arrow placement="right">
            <IconButton sx={navButtonSx("/schoice")} onClick={() => navigate("/schoice")}>
              <HomeRoundedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="基本面篩選" arrow placement="right">
            <IconButton sx={navButtonSx("/schoice/fundamental")} onClick={() => navigate("/schoice/fundamental")}>
              <SmartButtonIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="自選股" arrow placement="right">
            <IconButton
              sx={navButtonSx("/schoice/favorite")}
              onClick={() => {
                navigate("/schoice/favorite");
              }}
            >
              <StarRoundedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="垃圾桶" arrow placement="right">
            <IconButton sx={navButtonSx("/schoice/trash")} onClick={() => navigate("/schoice/trash")}>
              <DeleteRoundedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="回測" arrow placement="right">
            <IconButton sx={navButtonSx("/schoice/backtest")} onClick={() => navigate("/schoice/backtest")}>
              <FastRewindIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="設定" arrow placement="right">
            <IconButton sx={navButtonSx("/schoice/setting")} onClick={toSetting}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        <Stack spacing={2} alignItems="center">
          <InsertRuleButton />
          <Tooltip title="登出" arrow placement="right">
            <IconButton onClick={onLogout} sx={{ ...navButtonSx("__logout"), color: "error.main" }}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </GridItem>
    </Box>
  );
}
