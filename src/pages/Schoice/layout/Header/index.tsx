import { AppBar, Avatar, Box, Stack, styled, Typography } from "@mui/material";
import GlobalSyncIndicator from "../../../../components/SyncEngine/GlobalSyncIndicator";
import { useUser } from "../../../../context/UserContext";
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
      ? "#343145"
      : "#fffefacc",
  backdropFilter: "blur(10px)",
  borderBottom: "3px solid #202027",
  boxShadow: "0 5px 0 rgba(32,32,39,.08)",
  backgroundImage: "none",
  overflow: "hidden",
  fontVariantNumeric: "tabular-nums",

  "&::after": {
    content: '""',
    position: "absolute",
    bottom: 0,
    height: "5px",
    width: "120px",
    left: "28px",
    right: "auto",
    background: theme.palette.secondary.main,
    borderRadius: "999px 999px 0 0",
  },
}));

const VerticalDivider = styled(Box)(({ theme }) => ({
  width: "1px",
  height: "24px",
  backgroundColor: theme.palette.divider,
  margin: theme.spacing(0, 1),
}));

export default function Header() {
  useInitFilterStock();
  const { user } = useUser();
  const avatarUrl =
    typeof user?.user_metadata.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : undefined;
  const avatarFallback = user?.email?.charAt(0).toUpperCase() || "?";

  return (
    <HeaderContainer>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        px={2.5}
        sx={{ minHeight: 72 }}
      >
        {/* 左側：導航路徑 (受限寬度以防擠壓) */}
        <Box sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 3 }}>
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
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ minWidth: 0, maxWidth: 220 }}
            >
              <Avatar
                src={avatarUrl}
                alt={user?.email || "使用者"}
                sx={{ width: 36, height: 36, border: "2px solid #202027" }}
              >
                {avatarFallback}
              </Avatar>
              <Typography
                variant="caption"
                title={user?.email || undefined}
                sx={{
                  display: { xs: "none", xl: "block" },
                  fontWeight: 800,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.email || "已登入"}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </HeaderContainer>
  );
}
