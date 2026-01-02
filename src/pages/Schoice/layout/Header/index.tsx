import { alpha, AppBar, styled } from "@mui/material";
import BottomBar from "./BottomBar";
import TopBar from "./TopBar";

const HeaderContainer = styled(AppBar)(({ theme }) => ({
  gridArea: "header",
  position: "static",
  width: "100%",
  backgroundColor:
    theme.palette.mode === "dark"
      ? alpha(theme.palette.background.paper, 0.6)
      : alpha(theme.palette.background.paper, 0.8),
  backdropFilter: "blur(20px) saturate(180%)",
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: "none",
  backgroundImage: "none",
  overflow: "hidden",
  // Glow effect at the bottom
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "1px",
    background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent)`,
    opacity: 0.3,
  },
}));

export default function Header() {
  return (
    <HeaderContainer>
      <TopBar />
      <BottomBar />
    </HeaderContainer>
  );
}
