import {
  Box,
  Button,
  Checkbox,
  Stack,
  TextField,
  Typography,
  alpha,
  styled,
} from "@mui/material";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { error } from "@tauri-apps/plugin-log";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import GoogleOauthButton from "../../components/GoogleOauthButton";
import { supabase } from "../../tools/supabase";
import translateError from "../../utils/translateError";

const StyledCard = styled(Box)(({ theme }) => ({
  width: 360,
  padding: theme.spacing(4),
  position: "relative",
  background:
    theme.palette.mode === "light"
      ? "rgba(255, 255, 255, 0.7)"
      : "rgba(15, 23, 42, 0.6)",
  backdropFilter: "blur(20px)",
  borderRadius: 24,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  boxShadow: `0 0 40px ${alpha(theme.palette.primary.main, 0.1)}`,
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTop: `2px solid ${theme.palette.primary.main}`,
    borderLeft: `2px solid ${theme.palette.primary.main}`,
    borderTopLeftRadius: 24,
  },
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottom: `2px solid ${theme.palette.primary.main}`,
    borderRight: `2px solid ${theme.palette.primary.main}`,
    borderBottomRightRadius: 24,
  },
}));

const TechLabel = styled(Typography)(({ theme }) => ({
  fontSize: "0.65rem",
  fontFamily: "monospace",
  color: theme.palette.text.primary,
  opacity: 0.6,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: theme.spacing(0.5),
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    backgroundColor: alpha(theme.palette.background.paper, 0.5),
    "& fieldset": {
      borderColor: alpha(theme.palette.primary.main, 0.2),
    },
    "&:hover fieldset": {
      borderColor: alpha(theme.palette.primary.main, 0.4),
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
  },
}));

const Content = () => {
  const { t } = useTranslation();
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(
    localStorage.getItem("slitenting-email") || ""
  );
  const [password, setPassword] = useState(
    localStorage.getItem("slitenting-password") || ""
  );
  const [remember, setRemember] = useState(true);
  let navigate = useNavigate();

  const signIn = async () => {
    setErrorMsg("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(translateError(error.message));
      } else {
        if (remember) {
          localStorage.setItem("slitenting-email", email);
          localStorage.setItem("slitenting-password", password);
        } else {
          localStorage.removeItem("slitenting-email");
          localStorage.removeItem("slitenting-password");
        }
        const alwaysOnTop =
          localStorage.getItem("slitenting-alwaysOnTop") === "true";
        getCurrentWindow().setAlwaysOnTop(alwaysOnTop);
        navigate("/schoice");
      }
    } catch (e) {
      error(`Error signing in: ${e}`);
    }
    setLoading(false);
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    signIn();
  };

  const register = async () => {
    navigate("/register");
  };

  return (
    <StyledCard>
      <form onSubmit={handleSignIn}>
        <Stack spacing={3} alignItems="center">
          <Box sx={{ position: "relative" }}>
            <img
              src="schoice_icon.png"
              alt="logo"
              style={{ width: 80, height: 80 }}
            />
          </Box>

          <Typography variant="h5" fontWeight="bold" letterSpacing={1}>
            {t("Pages.Login.title")}
          </Typography>

          <Box width="100%">
            <Box mb={2}>
              <TechLabel>{t("Pages.Login.email")}</TechLabel>
              <StyledTextField
                fullWidth
                size="small"
                placeholder="name@domain.com"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Box>

            <Box mb={1}>
              <TechLabel>{t("Pages.Login.password")}</TechLabel>
              <StyledTextField
                fullWidth
                size="small"
                placeholder="••••••••"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Box>

            <Stack direction="row" alignItems={"center"} mb={2}>
              <Checkbox
                size="small"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                sx={{ p: 0.5 }}
              />
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ fontFamily: "monospace" }}
              >
                {t("Pages.Login.rememberMe")}
              </Typography>
            </Stack>

            <Stack spacing={2}>
              <Button
                type="submit"
                disabled={loading || !email || !password}
                fullWidth
                variant="contained"
                sx={{
                  py: 1,
                  fontSize: "1rem",
                  background: (theme) =>
                    `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
                  boxShadow: (theme) =>
                    `0 4px 15px ${alpha(theme.palette.primary.main, 0.4)}`,
                }}
              >
                {t("Pages.Login.signIn")}
              </Button>

              <Button
                variant="text"
                onClick={register}
                disabled={loading}
                fullWidth
                sx={{ fontSize: "0.8rem", opacity: 0.7 }}
              >
                {t("Pages.Login.register")}
              </Button>
            </Stack>

            <Box
              mt={3}
              mb={1}
              sx={{
                display: "flex",
                alignItems: "center",
                "&::before, &::after": {
                  content: '""',
                  flex: 1,
                  height: "1px",
                  background: (theme) => theme.palette.divider,
                },
              }}
            >
              <Typography
                variant="caption"
                sx={{ px: 2, opacity: 0.5, fontFamily: "monospace" }}
              >
                OR
              </Typography>
            </Box>

            <Stack direction="row" alignItems="center" justifyContent="center">
              <GoogleOauthButton onLogin={() => navigate("/schoice")} />
            </Stack>

            {errorMsg && (
              <Typography
                color="error"
                variant="caption"
                align="center"
                display="block"
                mt={2}
                sx={{ fontFamily: "monospace" }}
              >
                [AUTH_ERROR]: {errorMsg}
              </Typography>
            )}
          </Box>
        </Stack>
      </form>
    </StyledCard>
  );
};

export default Content;
