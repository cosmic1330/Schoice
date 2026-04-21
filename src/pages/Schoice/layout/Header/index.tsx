import { alpha, AppBar, Box, Stack, styled } from "@mui/material";
import GlobalSyncIndicator from "../../../../components/SyncEngine/GlobalSyncIndicator";
import useInitFilterStock from "../../../../hooks/useInitFilterStock";
import Actions from "./BottomBar/Actions";
import Breadcrumb from "./BottomBar/Breadcrumb";
import LatestDate from "./TopBar/LatestDate";
import MarketSentiment from "./TopBar/MarketSentiment";
import RollBack from "./TopBar/Rollback";

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
  useInitFilterStock();

  return (
    <HeaderContainer>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        px={2.5}
        sx={{ minHeight: 64 }}
      >
        {/* 左側：導航路徑 (受限寬度以防擠壓) */}
        <Box sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap:3 }}>
          <Breadcrumb />
          <MarketSentiment />
        </Box>

        {/* 右側：工具與操作集群 (向右對齊且受限寬度) */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ flex: 1, minWidth: 0, justifyContent: "flex-end" }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ display: { xs: "none", lg: "flex" } }}>
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
