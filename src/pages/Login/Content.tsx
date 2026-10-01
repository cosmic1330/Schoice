import {
  Box,
  Button,
  Checkbox,
  Stack,
  TextField,
  Typography,
  styled,
} from "@mui/material";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { error } from "@tauri-apps/plugin-log";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { supabase } from "../../tools/supabase";
import translateError from "../../utils/translateError";

const StyledCard = styled(Box)(({ theme }) => ({
  width: 390,
  padding: theme.spacing(4),
  position: "relative",
  background: theme.palette.background.paper,
  borderRadius: 30,
  border: "3px solid #202027",
  boxShadow: "9px 9px 0 #202027",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    width: 88,
    height: 16,
    border: 0,
    borderRadius: 999,
    background: theme.palette.secondary.main,
    transform: "translate(-15px, 8px) rotate(-8deg)",
  },
  "&::after": {
    position: "absolute",
    bottom: 0,
    right: 0,
    content: '"★"',
    width: "auto",
    height: "auto",
    color: theme.palette.warning.main,
    fontSize: 42,
    WebkitTextStroke: "2px #202027",
    transform: "translate(8px, 10px) rotate(13deg)",
  },
}));

const TechLabel = styled(Typography)(({ theme }) => ({
  fontSize: "0.65rem",
  fontFamily: "inherit",
  color: theme.palette.text.primary,
  opacity: 0.6,
  letterSpacing: "0.03em",
  marginBottom: theme.spacing(0.5),
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    backgroundColor: theme.palette.mode === "light" ? "#FFF9E8" : theme.palette.background.default,
    "& fieldset": {
      borderColor: "#202027",
    },
    "&:hover fieldset": {
      borderColor: theme.palette.secondary.main,
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.main,
      boxShadow: `3px 3px 0 ${theme.palette.secondary.main}`,
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
              style={{ width: 86, height: 86, filter: "drop-shadow(4px 4px 0 rgba(32,32,39,.2))" }}
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
                sx={{ fontWeight: 700 }}
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
                  background: "primary.main",
                  color: "#202027",
                  boxShadow: "4px 4px 0 #202027",
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

            {errorMsg && (
              <Typography
                color="error"
                variant="caption"
                align="center"
                display="block"
                mt={2}
                sx={{ fontWeight: 800 }}
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
