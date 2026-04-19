import { alpha, AppBar, Box, Stack, styled } from "@mui/material";
import MarketSentiment from "./TopBar/MarketSentiment";
import Breadcrumb from "./BottomBar/Breadcrumb";
import Actions from "./BottomBar/Actions";
import RollBack from "./TopBar/Rollback";
import LatestDate from "./TopBar/LatestDate";
import GlobalSyncIndicator from "../../../../components/SyncEngine/GlobalSyncIndicator";
import useInitFilterStock from "../../../../hooks/useInitFilterStock";

const HeaderContainer = styled(AppBar)(({ theme }) => ({
  gridArea: "header",
  position: "static",
  width: "100%",
  backgroundColor:
    theme.palette.mode === "dark"
      ? alpha("#0f1214", 0.7)
      : alpha("#ffffff", 0.8),
  backdropFilter: "blur(12px) saturate(180%)",
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  boxShadow: "none",
  backgroundImage: "none",
  overflow: "hidden",
  fontVariantNumeric: "tabular-nums",
  
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "1px",
    background: `linear-gradient(90deg, 
      transparent 0%, 
      ${alpha(theme.palette.primary.main, 0.4)} 50%, 
      transparent 100%)`,
    opacity: theme.palette.mode === "dark" ? 0.3 : 0.1,
  },
}));

const VerticalDivider = styled(Box)(({ theme }) => ({
  width: "1px",
  height: "24px",
  backgroundColor: alpha(theme.palette.divider, 0.1),
  margin: theme.spacing(0, 1),
}));

export default function Header() {
  useInitFilterStock(); // 初始化股票資料
  return (
    <HeaderContainer>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        px={2.5}
        sx={{ minHeight: 64 }} // 高清標準 header 高度
      >
        {/* 左側：導航路徑 */}
        <Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
          <Breadcrumb />
        </Box>

        {/* 中間：核心行情脈搏 (視覺重心) */}
        <Box sx={{ 
          display: "flex", 
          alignItems: "center",
          px: 4,
          borderLeft: (theme) => `1px solid ${alpha(theme.palette.divider, 0.05)}`,
          borderRight: (theme) => `1px solid ${alpha(theme.palette.divider, 0.05)}`,
        }}>
          <MarketSentiment />
        </Box>

        {/* 右側：工具與操作集群 */}
        <Stack 
          direction="row" 
          alignItems="center" 
          spacing={2} 
          sx={{ flex: 1, justifyContent: "flex-end" }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <RollBack />
            <VerticalDivider />
            <LatestDate />
          </Stack>
          
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <GlobalSyncIndicator />
            <Actions />
          </Stack>
        </Stack>
      </Stack>
    </HeaderContainer>
  );
}
