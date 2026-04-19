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

const SidebarContainer = styled(Box)(({ theme }) => ({
  width: "400px",
  height: "100%",
  backgroundColor: alpha(theme.palette.background.paper, 0.4),
  backdropFilter: "blur(12px)",
  borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(3),
  overflowY: "auto",
  gap: theme.spacing(3),
  "&::-webkit-scrollbar": { width: "4px" },
}));

const ChartArea = styled(Box)(({ theme }) => ({
  flex: 1,
  height: "100%",
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(3),
  backgroundColor: theme.palette.mode === "dark" 
    ? alpha(theme.palette.background.default, 0.05) 
    : alpha(theme.palette.background.default, 0.2),
}));

const SectionHeader = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 800,
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.15em",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1.5),
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
    "success",
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
        user.id,
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
    reason?: string,
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
    <Box sx={{ 
      height: "100%", 
      display: "flex", 
      overflow: "hidden",
      bgcolor: "background.default"
    }}>
      {/* 1. 側邊全功能控制台 */}
      <SidebarContainer>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
            <EditIcon color="primary" sx={{ fontSize: 24 }} />
            <Typography variant="h6" fontWeight={900}>
              {t("Pages.Schoice.Prompt.editTitle")}
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ opacity: 0.6 }}>
            正在編輯策略 ID: {id}
          </Typography>
        </Box>

        <Box>
          <SectionHeader>
            <AutoFixHighIcon fontSize="inherit" />
            {t("Pages.Schoice.Prompt.strategyName")}
          </SectionHeader>
          <PromptName {...{ name, setName }} />
        </Box>

        <Box>
          <SectionHeader>
            <AutoFixHighIcon fontSize="inherit" />
            修改條件配置
          </SectionHeader>
          <ExpressionGenerator
            {...{
              setHourlyPrompts: (updater: any) =>
                setHourlyPrompts((p) => typeof updater === "function" ? updater(p) : updater),
              setDailyPrompts: (updater: any) =>
                setDailyPrompts((p) => typeof updater === "function" ? updater(p) : updater),
              setWeekPrompts: (updater: any) =>
                setWeekPrompts((p) => typeof updater === "function" ? updater(p) : updater),
            }}
          />
        </Box>

        {/* 策略邏輯清單 */}
        <Stack spacing={2.5}>
          <Box>
            <SectionHeader>
              <AutoFixHighIcon fontSize="inherit" />
              當前設定清單
            </SectionHeader>
            <Stack spacing={1.5}>
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
            </Stack>
          </Box>
        </Stack>

        <Box sx={{ mt: 'auto', pt: 3, pb: 1, borderTop: (theme) => `1px solid ${alpha(theme.palette.divider, 0.05)}` }}>
          <Stack direction="row" spacing={2}>
            <Button
              onClick={handleCancel}
              fullWidth
              variant="outlined"
              color="inherit"
              sx={{ borderRadius: "12px", py: 1.5, fontWeight: 700, textTransform: "none" }}
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
              sx={{
                borderRadius: "12px",
                py: 1.5,
                fontWeight: 900,
                boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                textTransform: "none"
              }}
            >
              {isEditing ? t("Pages.Schoice.Prompt.editing") : t("Pages.Schoice.Prompt.edit")}
            </Button>
          </Stack>
        </Box>
      </SidebarContainer>

      {/* 2. 右側滿版圖表無視覺裁切 */}
      <ChartArea>
        <SectionHeader sx={{ mb: 1.5, opacity: 0.8 }}>
          <AutoFixHighIcon fontSize="inherit" />
          策略預覽與回測模擬 (右鍵可進行更進階圖表操作)
        </SectionHeader>
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <PromptChart
            hourlyPrompts={hourlyPrompts}
            dailyPrompts={dailyPrompts}
            weeklyPrompts={weekPrompts}
            hourlyData={hourlyData}
            dailyData={dailyData}
            weeklyData={weeklyData}
          />
        </Box>
      </ChartArea>

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
