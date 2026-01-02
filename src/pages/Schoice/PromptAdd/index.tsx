import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import ListAltIcon from "@mui/icons-material/ListAlt";
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { nanoid } from "nanoid";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import ExpressionGenerator from "../../../components/Prompt/ExpressionGenerator";
import PromptChart from "../../../components/Prompt/PromptChart";
import { PromptList } from "../../../components/Prompt/PromptList";
import PromptName from "../../../components/Prompt/PromptName";
import { useUser } from "../../../context/UserContext";
import useExampleData from "../../../hooks/useExampleData";
import useCloudStore from "../../../store/Cloud.store";
import useSchoiceStore from "../../../store/Schoice.store";
import { PromptType, PromptValue } from "../../../types";

const GlassCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: alpha(theme.palette.background.paper, 0.4),
  backdropFilter: "blur(12px)",
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: "16px",
  boxShadow: "none",
  position: "relative",
  overflow: "hidden",
}));

const ConfigHeader = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 800,
  fontSize: "0.875rem",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

export default function PromptAdd() {
  const { setSelect } = useSchoiceStore();
  const { increase } = useCloudStore();
  const { user } = useUser();
  const { t } = useTranslation();
  const [prompts, setPrompts] = useState<PromptValue>({
    hourly: [],
    daily: [],
    weekly: [],
  });

  const [name, setName] = useState(nanoid());
  const [isCreating, setIsCreating] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const promptType = searchParams.get("promptType");
  const navigate = useNavigate();
  const {
    hour: hourlyData,
    day: dailyData,
    week: weeklyData,
  } = useExampleData();

  const handleCreate = async () => {
    if (!user) {
      return;
    }
    setIsCreating(true);
    try {
      const id = await increase(
        name,
        prompts,
        promptType === "bull" ? PromptType.BULL : PromptType.BEAR,
        user.id
      );
      if (id)
        setSelect({
          prompt_id: id,
          type: promptType === "bull" ? PromptType.BULL : PromptType.BEAR,
        });
      navigate("/schoice");
    } catch (error) {
      console.error(error);
      setSnackbarMessage(t("Common.error"));
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRemove = (type: keyof PromptValue, index: number) => {
    setPrompts((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const handleCloseSnackbar = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  const promptCategories: { type: keyof PromptValue; title: string }[] = [
    { type: "hourly", title: t("Pages.Schoice.Prompt.hourlyConditions") },
    { type: "daily", title: t("Pages.Schoice.Prompt.dailyConditions") },
    { type: "weekly", title: t("Pages.Schoice.Prompt.weeklyConditions") },
  ];

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
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box mb={4}>
          <Stack direction="row" alignItems="center" spacing={2} mb={1}>
            <AddCircleOutlineIcon color="primary" sx={{ fontSize: 36 }} />
            <Typography
              variant="h4"
              fontWeight={900}
              sx={{ letterSpacing: "-0.02em" }}
            >
              {t("Pages.Schoice.Prompt.addTitle")}
            </Typography>
          </Stack>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ opacity: 0.8 }}
          >
            {promptType === "bull"
              ? t("Pages.Schoice.PromptList.tabs.bullish")
              : t("Pages.Schoice.PromptList.tabs.bearish")}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <GlassCard elevation={0}>
              <ConfigHeader>
                <AutoFixHighIcon fontSize="small" />
                {t("Pages.Schoice.Prompt.strategyName")}
              </ConfigHeader>
              <Box mb={3}>
                <PromptName {...{ name, setName }} />
              </Box>

              <ConfigHeader>
                <AutoFixHighIcon fontSize="small" />
                {t("Pages.Schoice.Prompt.newCondition")}
              </ConfigHeader>
              <ExpressionGenerator
                {...{
                  promptType,
                  setHourlyPrompts: (updater: any) =>
                    setPrompts((p) => ({
                      ...p,
                      hourly:
                        typeof updater === "function"
                          ? updater(p.hourly)
                          : updater,
                    })),
                  setDailyPrompts: (updater: any) =>
                    setPrompts((p) => ({
                      ...p,
                      daily:
                        typeof updater === "function"
                          ? updater(p.daily)
                          : updater,
                    })),
                  setWeekPrompts: (updater: any) =>
                    setPrompts((p) => ({
                      ...p,
                      weekly:
                        typeof updater === "function"
                          ? updater(p.weekly)
                          : updater,
                    })),
                }}
              />
            </GlassCard>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <GlassCard
              elevation={0}
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              <ConfigHeader>
                <ListAltIcon fontSize="small" />
                交易策略清單
              </ConfigHeader>
              <Box sx={{ flex: 1, overflowY: "auto", mb: 2 }}>
                {promptCategories.map(({ type, title }) => (
                  <PromptList
                    key={type}
                    title={title}
                    prompts={prompts[type]}
                    onRemove={(index) => handleRemove(type, index)}
                  />
                ))}
              </Box>

              <Button
                onClick={handleCreate}
                fullWidth
                variant="contained"
                size="large"
                disabled={
                  (prompts.hourly.length === 0 &&
                    prompts.daily.length === 0 &&
                    prompts.weekly.length === 0) ||
                  name === "" ||
                  isCreating
                }
                color="success"
                sx={{
                  borderRadius: "12px",
                  py: 1.5,
                  fontWeight: 700,
                  boxShadow: (theme) =>
                    `0 8px 16px ${alpha(theme.palette.success.main, 0.2)}`,
                }}
              >
                {isCreating
                  ? t("Pages.Schoice.Prompt.creating")
                  : t("Pages.Schoice.Prompt.create")}
              </Button>
            </GlassCard>
          </Grid>

          <Grid size={12}>
            <GlassCard elevation={0}>
              <ConfigHeader>
                <AutoFixHighIcon fontSize="small" />
                策略預覽 (示例數據)
              </ConfigHeader>
              <PromptChart
                hourlyPrompts={prompts.hourly}
                dailyPrompts={prompts.daily}
                weeklyPrompts={prompts.weekly}
                hourlyData={hourlyData}
                dailyData={dailyData}
                weeklyData={weeklyData}
              />
            </GlassCard>
          </Grid>
        </Grid>
      </Container>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
