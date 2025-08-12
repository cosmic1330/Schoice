import DarkModeIcon from "@mui/icons-material/DarkMode";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import FastRewindIcon from "@mui/icons-material/FastRewind";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import LightModeIcon from "@mui/icons-material/LightMode";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import SettingsIcon from "@mui/icons-material/Settings";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { Box, IconButton, Stack, styled, Tooltip } from "@mui/material";
import { useNavigate } from "react-router";
import InsertRuleButton from "../../../../components/InsertRuleButton";
import useSchoiceStore from "../../../../store/Schoice.store";
import useStocksStore from "../../../../store/Stock.store";
import SmartButtonIcon from "@mui/icons-material/SmartButton";
import LanguageSwitcher from "../../../../components/LanguageSwitcher";

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
  const { theme, changeTheme } = useSchoiceStore();
  const { reload } = useStocksStore();

  const toSetting = () => {
    navigate("/schoice/setting");
  };

  const onThemeChange = () => {
    if (theme === "light") changeTheme("dark");
    else changeTheme("light");
  };

  return (
    <Box gridArea="sidebar">
      <GridItem>
        <Stack spacing={2} alignItems="center">
          <QueryStatsIcon sx={{ fontSize: "50px" }} color="primary" />
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
                reload();
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
        </Stack>

        <Stack spacing={2} alignItems="center">
          <LanguageSwitcher />
          <Tooltip title="切換主題" arrow placement="right">
            <IconButton onClick={onThemeChange}>
              {theme === "light" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          <InsertRuleButton />
          <Tooltip title="設定" arrow placement="right">
            <IconButton onClick={toSetting}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </GridItem>
    </Box>
  );
}
