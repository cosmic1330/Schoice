import { Box, Button, TextField, Typography } from "@mui/material";
import { error } from "@tauri-apps/plugin-log";
import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../tools/supabase";
import translateError from "../../utils/translateError";
import { t } from "i18next";

function Content() {
  const [errorMsg, setErrorMsg] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  let navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
    <Box component="form" width={400}>
      <Typography variant="h3" align="center" color="textPrimary" gutterBottom>
        {t("Pages.Register.register")}
      </Typography>
      <Box component="form" onSubmit={handleSubmit} width="100%">
        <TextField
          fullWidth
          label={t("Pages.Register.email")}
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="normal"
          required
          size="small"
        />
        <TextField
          fullWidth
          label={t("Pages.Register.password")}
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          required
          size="small"
        />
        <TextField
          fullWidth
          label={t("Pages.Register.confirmPassword")}
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          margin="normal"
          required
          size="small"
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 2 }}
          size="small"
          disabled={loading || !email || !password || !confirmPassword}
          onClick={signUp}
        >
          {t("Pages.Register.register")}
        </Button>
        <Typography color="error" align="center">
          {errorMsg}
        </Typography>
      </Box>
      <Typography
        textAlign="center"
        variant="body2"
        color="primary"
        mt={3}
        sx={{ cursor: "pointer", textDecoration: "underline" }}
        onClick={() => navigate("/")}
      >
        {t("Pages.Register.haveAccount")}
      </Typography>
    </Box>
  );
}

export default Content;
