import { Box, styled } from "@mui/material";
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
  transition: "background 0.5s ease",
  background:
    theme.palette.mode === "light"
      ? `linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)`
      : `radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), 
       radial-gradient(at 50% 0%, hsla(225,39%,25%,1) 0, transparent 50%), 
       radial-gradient(at 100% 0%, hsla(339,49%,25%,1) 0, transparent 50%),
       #0F172A`,
}));

const Register = () => {
  return (
    <Container>
      <Box sx={{ position: "absolute", top: 16, right: 16 }}>
        <ThemeToggle />
      </Box>
      <Version />
      <Content />
    </Container>
  );
};

export default Register;
