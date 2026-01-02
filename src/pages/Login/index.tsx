import { alpha, Box, styled } from "@mui/material";
import ThemeToggle from "../../components/ThemeToggle";
import Version from "../../components/Version";
import Content from "./Content";
import LanguageSwitcher from "../../components/LanguageSwitcher";

const Container = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  overflow: "hidden",
  transition: "background 0.5s ease",
  background: getBackground(theme),
  // Digital Grid Overlay
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `linear-gradient(${
      theme.palette.mode === "light"
        ? "rgba(0,0,0,0.03)"
        : "rgba(255,255,255,0.03)"
    } 1px, transparent 1px), linear-gradient(90deg, ${
      theme.palette.mode === "light"
        ? "rgba(0,0,0,0.03)"
        : "rgba(255,255,255,0.03)"
    } 1px, transparent 1px)`,
    backgroundSize: "40px 40px",
    maskImage: "radial-gradient(ellipse at center, black, transparent 80%)",
  },
  // Ambient Glow
  "&::after": {
    content: '""',
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "600px",
    height: "600px",
    background: `radial-gradient(circle, ${alpha(
      "#7DB9DE",
      0.15
    )} 0%, transparent 70%)`,
    zIndex: 0,
    pointerEvents: "none",
  },
}));

// Re-defining gradient based on approved premium plan (Slate) since "改回來" usually refers to the previous stable version
const getBackground = (theme: any) => {
  if (theme.palette.mode === "light") {
    return `linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)`;
  }
  return `radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), 
          radial-gradient(at 50% 0%, hsla(225,39%,25%,1) 0, transparent 50%), 
          radial-gradient(at 100% 0%, hsla(339,49%,25%,1) 0, transparent 50%),
          #0F172A`;
};

const Login = () => {
  return (
    <Container>
      <Box sx={{ position: "absolute", top: 16, right: 16 }}>
        <ThemeToggle />
        <LanguageSwitcher />
      </Box>
      <Version />
      <Content />
    </Container>
  );
};

export default Login;
