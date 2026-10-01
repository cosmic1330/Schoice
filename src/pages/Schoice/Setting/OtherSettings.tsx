import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import {
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import useSchoiceStore from "../../../store/Schoice.store";

export default function OtherSettings() {
  const { theme, changeTheme } = useSchoiceStore();

  const onThemeChange = () => {
    if (theme === "light") changeTheme("dark");
    else changeTheme("light");
  };

  return (
    <Card className="setting-card">
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1.25} mb={0.75}>
          <SettingsRoundedIcon color="secondary" />
          <Typography variant="h6">介面與語言</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" mb={2.5}>
          外觀設定會儲存在這台裝置上。
        </Typography>

        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Box sx={{ color: "text.secondary", display: "flex" }}>
                <DarkModeRoundedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={900}>深色模式</Typography>
                <Typography variant="caption" color="text.secondary">
                  {theme === "dark" ? "目前使用深色外觀" : "目前使用淺色外觀"}
                </Typography>
              </Box>
            </Stack>
            <Switch checked={theme === "dark"} onChange={onThemeChange} color="secondary" />
          </Stack>

          <Divider />

          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Box sx={{ color: "text.secondary", display: "flex" }}>
                <LanguageRoundedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={900}>顯示語言</Typography>
                <Typography variant="caption" color="text.secondary">中文／English</Typography>
              </Box>
            </Stack>
            <LanguageSwitcher />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
