import GoogleIcon from "@mui/icons-material/Google";
import { Button } from "@mui/material";
import { useState } from "react";
import { supabase } from "../tools/supabase";

export default function GoogleOauthButton({
  onLogin,
}: {
  onLogin?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error("登入失敗：", error.message);
      setLoading(false);
    } else {
      // 如果你想在登入完成後做什麼可以放在 onLogin
      if (onLogin) onLogin();
    }
  };

  return (
    <Button
      fullWidth
      variant="contained"
      color="success"
      onClick={handleLogin}
      disabled={loading}
    >
      <GoogleIcon style={{ marginRight: 8 }} />
      {loading ? "登入中..." : "使用 Google 登入"}
    </Button>
  );
}
