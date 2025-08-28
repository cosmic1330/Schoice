import {
  Box,
  Button,
  Checkbox,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { error } from "@tauri-apps/plugin-log";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import GoogleOauthButton from "../../components/GoogleOauthButton";
import { supabase } from "../../tools/supabase";
import translateError from "../../utils/translateError";

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

  const register = async () => {
    navigate("/register");
  };

  return (
    <Stack component="form" width={300}>
      <img src="schoice_icon.png" alt="logo" />

      <Box width="100%">
        <TextField
          fullWidth
          size="small"
          label={t("Pages.Login.email")}
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          size="small"
          label={t("Pages.Login.password")}
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          required
        />
        <Stack direction="row" alignItems={"center"}>
          <Checkbox
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <Typography variant="body2" color="textPrimary">
            {t("Pages.Login.rememberMe")}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={2}>
          <Button
            onClick={register}
            disabled={loading}
            fullWidth
            size="small"
            color="warning"
            variant="contained"
          >
            {t("Pages.Login.register")}
          </Button>
          <Button
            type="submit"
            onClick={signIn}
            disabled={loading || !email || !password}
            fullWidth
            size="small"
            variant="contained"
          >
            {t("Pages.Login.signIn")}
          </Button>
        </Stack>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          my={2}
        >
          <GoogleOauthButton onLogin={() => navigate("/schoice")} />
        </Stack>
        <Typography color="error" align="center">
          {errorMsg}
        </Typography>
      </Box>
    </Stack>
  );
};

export default Content;
