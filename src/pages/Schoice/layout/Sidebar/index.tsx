import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import FastRewindIcon from "@mui/icons-material/FastRewind";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import SmartButtonIcon from "@mui/icons-material/SmartButton";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { Box, IconButton, Stack, styled, Tooltip } from "@mui/material";
import { useNavigate } from "react-router";
import { supabase } from "../../../../tools/supabase";
import InsertRuleButton from "./InsertRuleButton";
const GridItem = styled(Box)`
  width: 70px;
  height: 100vh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  border-right: 1px solid rgba(0, 0, 0, 0.25);
  padding: 1rem 0;

  // mobile
  @media screen and (max-width: 600px) {
    width: 100%;
    height: 50px;
  }
`;
export default function SideBar() {
  const navigate = useNavigate();

  const toSetting = () => {
    navigate("/schoice/setting");
  };

  const onLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <Box gridArea="sidebar">
      <GridItem>
        <Stack spacing={2} alignItems="center">
          <img
            src="schoice_icon.png"
            alt="logo"
            style={{ width: 50, height: 50 }}
          />
          <Tooltip title="首頁" arrow placement="right">
            <IconButton onClick={() => navigate("/schoice")}>
              <HomeRoundedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="基本面塞選" arrow placement="right">
            <IconButton onClick={() => navigate("/schoice/fundamental")}>
              <SmartButtonIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="自選股" arrow placement="right">
            <IconButton
              onClick={() => {
                navigate("/schoice/favorite");
              }}
            >
              <StarRoundedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="垃圾桶" arrow placement="right">
            <IconButton onClick={() => navigate("/schoice/trash")}>
              <DeleteRoundedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="回測" arrow placement="right">
            <IconButton onClick={() => navigate("/schoice/backtest")}>
              <FastRewindIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="設定" arrow placement="right">
            <IconButton onClick={toSetting}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        <Stack spacing={2} alignItems="center">
          <InsertRuleButton />
          <Tooltip title="登出" arrow placement="right">
            <IconButton onClick={onLogout}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </GridItem>
    </Box>
  );
}
