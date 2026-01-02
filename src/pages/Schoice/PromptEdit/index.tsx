import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import EditIcon from "@mui/icons-material/Edit";
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
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import ExpressionGenerator from "../../../components/Prompt/ExpressionGenerator";
import PromptChart from "../../../components/Prompt/PromptChart";
import { PromptList } from "../../../components/Prompt/PromptList";
import PromptName from "../../../components/Prompt/PromptName";
import { useUser } from "../../../context/UserContext";
import useExampleData from "../../../hooks/useExampleData";
import useCloudStore from "../../../store/Cloud.store";
import useSchoiceStore from "../../../store/Schoice.store";
import { Prompts } from "../../../types";

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

export default function PromptEdit() {
  const { id } = useParams();
  const { select, setSelect } = useSchoiceStore();
  const { edit, bears, bulls } = useCloudStore();
  const { user } = useUser();
  const { t } = useTranslation();
  const [dailyPrompts, setDailyPrompts] = useState<Prompts>([]);
  const [weekPrompts, setWeekPrompts] = useState<Prompts>([]);
  const [hourlyPrompts, setHourlyPrompts] = useState<Prompts>([]);
  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );
  const navigate = useNavigate();
  const {
    hour: hourlyData,
    day: dailyData,
    week: weeklyData,
  } = useExampleData();

  const handleEdit = async () => {
    if (!(id && select && user)) return;
    setIsEditing(true);
    try {
      await edit(
        id,
        name,
        {
          daily: dailyPrompts,
          weekly: weekPrompts,
          hourly: hourlyPrompts,
        },
        select.type,
        user.id
      );
      setSelect({ prompt_id: id, type: select.type });
      navigate("/schoice");
    } catch (error) {
      console.error(error);
      setSnackbarMessage(t("Common.error"));
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsEditing(false);
    }
  };

  const handleRemove = (type: "hourly" | "daily" | "weekly", index: number) => {
    switch (type) {
      case "hourly":
        setHourlyPrompts(hourlyPrompts.filter((_, i) => i !== index));
        break;
      case "daily":
        setDailyPrompts(dailyPrompts.filter((_, i) => i !== index));
        break;
      case "weekly":
        setWeekPrompts(weekPrompts.filter((_, i) => i !== index));
        break;
    }
  };

  const handleCancel = () => {
    navigate("/schoice");
  };

  const handleCloseSnackbar = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  useEffect(() => {
    if (select) {
      if (select.type === "bull") {
        setName(bulls[select.prompt_id]?.name || "");
        setDailyPrompts(bulls[select.prompt_id]?.conditions.daily || []);
        setWeekPrompts(bulls[select.prompt_id]?.conditions.weekly || []);
        setHourlyPrompts(bulls[select.prompt_id]?.conditions.hourly || []);
      } else if (select.type === "bear") {
        setName(bears[select.prompt_id]?.name || "");
        setDailyPrompts(bears[select.prompt_id]?.conditions.daily || []);
        setWeekPrompts(bears[select.prompt_id]?.conditions.weekly || []);
        setHourlyPrompts(bears[select.prompt_id]?.conditions.hourly || []);
      }
    }
  }, [select, bulls, bears]);

  if (!select) {
    return <Typography variant="h6">No prompt selected</Typography>;
  }

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
            <EditIcon color="primary" sx={{ fontSize: 36 }} />
            <Typography
              variant="h4"
              fontWeight={900}
              sx={{ letterSpacing: "-0.02em" }}
            >
              {t("Pages.Schoice.Prompt.editTitle")}
            </Typography>
          </Stack>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ opacity: 0.8 }}
          >
            {id}
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
                修改條件配置
              </ConfigHeader>
              <ExpressionGenerator
                {...{
                  setHourlyPrompts,
                  setDailyPrompts,
                  setWeekPrompts,
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
                當前設定清單
              </ConfigHeader>
              <Box sx={{ flex: 1, overflowY: "auto", mb: 2 }}>
                <PromptList
                  title={t("Pages.Schoice.Prompt.hourlyConditions")}
                  prompts={hourlyPrompts}
                  onRemove={(index) => handleRemove("hourly", index)}
                />
                <PromptList
                  title={t("Pages.Schoice.Prompt.dailyConditions")}
                  prompts={dailyPrompts}
                  onRemove={(index) => handleRemove("daily", index)}
                />
                <PromptList
                  title={t("Pages.Schoice.Prompt.weeklyConditions")}
                  prompts={weekPrompts}
                  onRemove={(index) => handleRemove("weekly", index)}
                />
              </Box>

              <Stack direction="row" spacing={2}>
                <Button
                  onClick={handleCancel}
                  fullWidth
                  variant="outlined"
                  color="error"
                  sx={{ borderRadius: "12px", py: 1.5, fontWeight: 700 }}
                >
                  {t("Pages.Schoice.Prompt.cancel")}
                </Button>
                <Button
                  onClick={handleEdit}
                  fullWidth
                  variant="contained"
                  disabled={
                    (hourlyPrompts.length === 0 &&
                      dailyPrompts.length === 0 &&
                      weekPrompts.length === 0) ||
                    name === "" ||
                    isEditing
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
                  {isEditing
                    ? t("Pages.Schoice.Prompt.editing")
                    : t("Pages.Schoice.Prompt.edit")}
                </Button>
              </Stack>
            </GlassCard>
          </Grid>

          <Grid size={12}>
            <GlassCard elevation={0}>
              <ConfigHeader>
                <AutoFixHighIcon fontSize="small" />
                策略預覽 (示例數據)
              </ConfigHeader>
              <PromptChart
                hourlyPrompts={hourlyPrompts}
                dailyPrompts={dailyPrompts}
                weeklyPrompts={weekPrompts}
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
