import DangerousRoundedIcon from "@mui/icons-material/DangerousRounded";
import DatasetRoundedIcon from "@mui/icons-material/DatasetRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import SystemUpdateAltRoundedIcon from "@mui/icons-material/SystemUpdateAltRounded";
import { Box, Chip, Container, Grid, Stack, Typography, alpha } from "@mui/material";
import CheckUpdate from "./CheckUpdate";
import DeleteAccount from "./DeleteAccount";
import DatabaseInitialization from "./DatabaseInitialization";
import ExampleSelector from "./ExampleSelector";
import OtherSettings from "./OtherSettings";
import SettingSection from "./SettingSection";
import StockMenuSettings from "./StockMenuSettings";
import SystemStatus from "./SystemStatus";

export default function Setting() {
  return (
    <Box
      sx={{
        height: "100%",
        overflowY: "auto",
        "&::-webkit-scrollbar": { display: "none" },
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 2.5, md: 5 }, pb: 8 }}>
        <Stack spacing={{ xs: 4, md: 5 }}>
          <Box
            sx={{
              position: "relative",
              overflow: "hidden",
              p: { xs: 2.5, md: 4 },
              border: "2px solid",
              borderColor: "text.primary",
              borderRadius: 5,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.18),
              boxShadow: (theme) =>
                `7px 7px 0 ${theme.palette.text.primary}`,
              "&::after": {
                content: '""',
                position: "absolute",
                width: 180,
                height: 180,
                right: -55,
                top: -80,
                borderRadius: "50%",
                bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.45),
                border: "2px solid",
                borderColor: "text.primary",
              },
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              gap={2}
              mb={3}
              sx={{ position: "relative", zIndex: 1 }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 58,
                    height: 58,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "warning.main",
                    border: "2px solid",
                    borderColor: "text.primary",
                    borderRadius: 4,
                    transform: "rotate(-3deg)",
                  }}
                >
                  <SettingsRoundedIcon fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h4">設定</Typography>
                  <Typography color="text.secondary" mt={0.5}>
                    管理使用偏好、本機資料與應用程式狀態
                  </Typography>
                </Box>
              </Stack>
              <Chip label="本機 SQLite 模式" color="success" />
            </Stack>
            <SystemStatus />
          </Box>

          <SettingSection
            icon={<PaletteRoundedIcon />}
            eyebrow="PERSONALIZATION"
            title="偏好設定"
            description="調整介面外觀與範例圖表，讓工作區符合你的使用習慣。"
            tone="secondary"
          >
            <Grid container spacing={2.5} alignItems="stretch">
              <Grid size={{ xs: 12, md: 5 }}>
                <OtherSettings />
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <ExampleSelector />
              </Grid>
            </Grid>
          </SettingSection>

          <SettingSection
            icon={<DatasetRoundedIcon />}
            eyebrow="LOCAL DATA"
            title="資料管理"
            description="更新應用程式需要的股票基本資料；所有下載內容都儲存在本機。"
          >
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12 }}>
                <StockMenuSettings />
              </Grid>
            </Grid>
          </SettingSection>

          <SettingSection
            icon={<SystemUpdateAltRoundedIcon />}
            eyebrow="APPLICATION"
            title="應用程式"
            description="查看目前版本、檢查更新，並決定是否啟用自動更新。"
            tone="warning"
          >
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12 }}>
                <CheckUpdate />
              </Grid>
            </Grid>
          </SettingSection>

          <SettingSection
            icon={<DangerousRoundedIcon />}
            eyebrow="DANGER ZONE"
            title="危險操作"
            description="以下操作會清除資料或帳號，執行前請再次確認目標與影響範圍。"
            tone="error"
          >
            <Grid container spacing={2.5} alignItems="stretch">
              <Grid size={{ xs: 12, md: 5 }}>
                <DatabaseInitialization />
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <DeleteAccount />
              </Grid>
            </Grid>
          </SettingSection>
        </Stack>
      </Container>
    </Box>
  );
}
