import { Stack, Typography } from "@mui/material";
import { getVersion } from "@tauri-apps/api/app";
import { error } from "@tauri-apps/plugin-log";
import { useEffect, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Version() {
  const [tauriVersion, setTauriVersion] = useState<string | null>(null);

  useEffect(() => {
    getVersion().then(setTauriVersion).catch(error);
  }, []);

  return (
    <Stack
      justifyContent="space-between"
      direction="row"
      alignItems="center"
      sx={{ position: "fixed", bottom: "5px", right: "10px", color: "white" }}
      spacing={1}
    >
      <LanguageSwitcher />
      <Typography variant="caption">v{tauriVersion}</Typography>
    </Stack>
  );
}
