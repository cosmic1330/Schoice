import {
  createTheme,
  styled,
  ThemeProvider,
  Box
} from "@mui/material";
import Version from "../../components/Version";
import Content from "./Content";

const Container = styled(Box)`
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1f2525;
    background-image: 
        radial-gradient(circle at top left, rgba(255,255,255,0.05) 0%, transparent 50%),
        url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
`;

const Login = () => {
  return (
    <ThemeProvider
      theme={createTheme({
        palette: {
          mode: "dark",
        },
      })}
    >
      <Container>
        <Version />
        <Content />
      </Container>
    </ThemeProvider>
  );
};

export default Login;
