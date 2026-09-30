import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  styled,
} from "@mui/material";
import { error } from "@tauri-apps/plugin-log";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import GoogleOauthButton from "../../components/GoogleOauthButton";
import { supabase } from "../../tools/supabase";
import translateError from "../../utils/translateError";

const StyledCard = styled(Box)(({ theme }) => ({
  width: 400,
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
    borderRadius: 999,
    background: theme.palette.primary.main,
    transform: "translate(-15px, 8px) rotate(-8deg)",
  },
  "&::after": {
    content: '"★"',
    position: "absolute",
    bottom: 0,
    right: 0,
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMsg(translateError(error.message));
      } else if (data.session) {
        navigate("/schoice", { replace: true });
      } else {
        alert("註冊成功，請先到信箱完成驗證後再登入。");
        navigate("/login", { replace: true });
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
                background: "primary.main",
                color: "#202027",
                boxShadow: "4px 4px 0 #202027",
              }}
            >
              {t("Pages.Register.register")}
            </Button>

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
                  bgcolor: "divider",
                },
              }}
            >
              <Typography variant="caption" sx={{ px: 2, opacity: 0.7, fontWeight: 900 }}>
                OR
              </Typography>
            </Box>

            <GoogleOauthButton />

            <Typography
              color="error"
              variant="caption"
              align="center"
              display="block"
              mt={2}
              sx={{ fontWeight: 800 }}
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
