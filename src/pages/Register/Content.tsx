import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  alpha,
  styled,
} from "@mui/material";
import { error } from "@tauri-apps/plugin-log";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { supabase } from "../../tools/supabase";
import translateError from "../../utils/translateError";

const StyledCard = styled(Box)(({ theme }) => ({
  width: 400,
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
  color: theme.palette.primary.contrastText,
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  let navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signUp();
  };

  const signUp = async () => {
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match!");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMsg(translateError(error.message));
      } else {
        alert("Registration Successful!");
        navigate("/");
      }
    } catch (e) {
      error(`Error signing up: ${e}`);
    }
    setLoading(false);
  };

  return (
    <StyledCard>
      <form onSubmit={handleSubmit}>
        <Stack spacing={3} alignItems="center">
          <Typography variant="h5" fontWeight="bold" letterSpacing={1}>
            {t("Pages.Register.register").toUpperCase()}
          </Typography>

          <Box width="100%">
            <Box mb={2}>
              <TechLabel>{t("Pages.Register.email")}</TechLabel>
              <StyledTextField
                fullWidth
                size="small"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Box>

            <Box mb={2}>
              <TechLabel>{t("Pages.Register.password")}</TechLabel>
              <StyledTextField
                fullWidth
                size="small"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Box>

            <Box mb={3}>
              <TechLabel>{t("Pages.Register.confirmPassword")}</TechLabel>
              <StyledTextField
                fullWidth
                size="small"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </Box>

            <Button
              type="submit"
              disabled={loading || !email || !password || !confirmPassword}
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
              {t("Pages.Register.register")}
            </Button>

            <Typography
              color="error"
              variant="caption"
              align="center"
              display="block"
              mt={2}
              sx={{ fontFamily: "monospace" }}
            >
              {errorMsg && `[REG_ERROR]: ${errorMsg}`}
            </Typography>

            <Box mt={3} sx={{ textAlign: "center" }}>
              <Typography
                variant="caption"
                sx={{
                  opacity: 0.7,
                  cursor: "pointer",
                  "&:hover": {
                    color: "primary.main",
                    textDecoration: "underline",
                  },
                }}
                onClick={() => navigate("/")}
              >
                {t("Pages.Register.haveAccount")}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </form>
    </StyledCard>
  );
};

export default Content;
