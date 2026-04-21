import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import BarChartIcon from "@mui/icons-material/BarChart";
import ChecklistIcon from "@mui/icons-material/Checklist";
import {
  Alert,
  Box,
  Button,
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
  padding: theme.spacing(2),
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
    "success",
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
    if (!user) return;
    setIsCreating(true);
    try {
      const id = await increase(
        name,
        prompts,
        promptType === "bull" ? PromptType.BULL : PromptType.BEAR,
        user.id,
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

  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

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
            <AddCircleOutlineIcon color="primary" sx={{ fontSize: 24 }} />
            <Typography variant="h6" fontWeight={900}>
              {t("Pages.Schoice.Prompt.addTitle")}
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ opacity: 0.6 }}>
            {promptType === "bull"
              ? t("Pages.Schoice.PromptList.tabs.bullish")
              : t("Pages.Schoice.PromptList.tabs.bearish")} 模型建構系統
          </Typography>
        </Box>

        <Box>
          <SectionHeader>
            <ChecklistIcon fontSize="inherit" />
            {t("Pages.Schoice.Prompt.strategyName")}
          </SectionHeader>
          <PromptName {...{ name, setName }} />
        </Box>

        <Box>
          <SectionHeader>
            <AutoFixHighIcon fontSize="inherit" />
            {t("Pages.Schoice.Prompt.newCondition")}
          </SectionHeader>
          <ExpressionGenerator
            {...{
              setHourlyPrompts: (updater: any) =>
                setPrompts((p) => ({
                  ...p,
                  hourly: typeof updater === "function" ? updater(p.hourly) : updater,
                })),
              setDailyPrompts: (updater: any) =>
                setPrompts((p) => ({
                  ...p,
                  daily: typeof updater === "function" ? updater(p.daily) : updater,
                })),
              setWeekPrompts: (updater: any) =>
                setPrompts((p) => ({
                  ...p,
                  weekly: typeof updater === "function" ? updater(p.weekly) : updater,
                })),
            }}
          />
        </Box>

        {/* 策略邏輯清單 (整合至側邊欄) */}
        <Stack spacing={2.5}>
          <Box>
            <SectionHeader>
              <ChecklistIcon fontSize="inherit" />
              已選條件清單
            </SectionHeader>
            <Stack spacing={1.5}>
              <PromptList
                title={t("Pages.Schoice.Prompt.hourlyConditions")}
                prompts={prompts.hourly}
                onRemove={(index) => handleRemove("hourly", index)}
              />
              <PromptList
                title={t("Pages.Schoice.Prompt.dailyConditions")}
                prompts={prompts.daily}
                onRemove={(index) => handleRemove("daily", index)}
              />
              <PromptList
                title={t("Pages.Schoice.Prompt.weeklyConditions")}
                prompts={prompts.weekly}
                onRemove={(index) => handleRemove("weekly", index)}
              />
            </Stack>
          </Box>
        </Stack>

        <Box sx={{ mt: 'auto', pt: 3, pb: 1, borderTop: (theme) => `1px solid ${alpha(theme.palette.divider, 0.05)}` }}>
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
            sx={{
              borderRadius: "12px",
              py: 2,
              fontWeight: 900,
              boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
              textTransform: "none",
              fontSize: "1rem"
            }}
          >
            {isCreating ? t("Pages.Schoice.Prompt.creating") : t("Pages.Schoice.Prompt.create")}
          </Button>
        </Box>
      </SidebarContainer>

      {/* 2. 右側滿版圖表視覺區 */}
      <ChartArea sx={{ p: 3 }}>
        <SectionHeader sx={{ mb: 1.5, opacity: 0.8 }}>
          <BarChartIcon fontSize="inherit" />
          效能預覽與回測模擬 (右鍵可進行更進階圖表操作)
        </SectionHeader>
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
           <PromptChart
              hourlyPrompts={prompts.hourly}
              dailyPrompts={prompts.daily}
              weeklyPrompts={prompts.weekly}
              hourlyData={hourlyData}
              dailyData={dailyData}
              weeklyData={weeklyData}
            />
        </Box>
      </ChartArea>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
