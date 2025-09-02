import { Settings } from "@mui/icons-material";
import {
  Card,
  CardContent,
  Grid,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import useSchoiceStore from "../../../store/Schoice.store";
import LanguageSwitcher from "../../../components/LanguageSwitcher";

export default function OtherSettings() {
  const { theme, changeTheme } = useSchoiceStore();

  const onThemeChange = () => {
    if (theme === "light") changeTheme("dark");
    else changeTheme("light");
  };
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Card sx={{ height: "100%" }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <Settings color="success" />
            <Typography variant="h6" fontWeight="bold">
              其他設定
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" mb={2}>
            系統選項
          </Typography>
          <Stack spacing={1} mt={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch
                checked={theme === "light" ? true : false}
                onChange={onThemeChange}
                color="success"
              />
              <Typography variant="body2">切換主題</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <LanguageSwitcher />
              <Typography variant="body2">語言切換</Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
}
