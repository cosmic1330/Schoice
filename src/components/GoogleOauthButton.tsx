import GoogleIcon from "@mui/icons-material/Google";
import { Button } from "@mui/material";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  loginWithGoogle,
  OAUTH_FLOW_FINISHED_EVENT,
} from "../lib/auth";

export default function GoogleOauthButton() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const finish = () => setLoading(false);
    window.addEventListener(OAUTH_FLOW_FINISHED_EVENT, finish);
    return () => window.removeEventListener(OAUTH_FLOW_FINISHED_EVENT, finish);
  }, []);

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);

    try {
      await loginWithGoogle();
      // Allow retry if the browser is closed before completing the flow.
      window.setTimeout(() => setLoading(false), 90_000);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Google 登入失敗：${message}`);
      setLoading(false);
    }
  };

  return (
    <Button
      fullWidth
      variant="contained"
      color="success"
      onClick={handleLogin}
      disabled={loading}
      startIcon={<GoogleIcon />}
    >
      {loading ? "Signing in..." : "Sign in with Google"}
    </Button>
  );
}
