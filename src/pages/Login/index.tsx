import { Box, Stack, styled } from "@mui/material";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import ThemeToggle from "../../components/ThemeToggle";
import Version from "../../components/Version";
import Content from "./Content";

const Container = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  overflow: "hidden",
  transition: "background .3s ease",
  backgroundColor: theme.palette.background.default,
  backgroundImage:
    theme.palette.mode === "light"
      ? "repeating-linear-gradient(-12deg, transparent 0 38px, rgba(255,159,197,.14) 39px 44px, transparent 45px 68px)"
      : "radial-gradient(circle at 20% 20%, rgba(255,159,197,.16), transparent 35%)",
  "&::before": {
    content: '"★"',
    position: "absolute",
    top: "9%",
    left: "10%",
    color: theme.palette.warning.main,
    fontSize: "clamp(60px, 10vw, 130px)",
    WebkitTextStroke: "4px #202027",
    transform: "rotate(-13deg)",
  },
  "&::after": {
    content: '"GOOD LUCK!"',
    position: "absolute",
    right: "7%",
    bottom: "11%",
    color: theme.palette.secondary.main,
    fontWeight: 1000,
    fontSize: "clamp(25px, 4vw, 58px)",
    letterSpacing: 2,
    WebkitTextStroke: "2px #202027",
    transform: "rotate(7deg)",
    zIndex: 0,
    pointerEvents: "none",
  },
}));

const Login = () => {
  return (
    <Container>
      <Box sx={{ position: "absolute", top: 16, right: 16 }}>
        <Stack direction="row" spacing={1}>
          <ThemeToggle />
          <LanguageSwitcher />
        </Stack>
      </Box>
      <Version />
      <Content />
    </Container>
  );
};

export default Login;
