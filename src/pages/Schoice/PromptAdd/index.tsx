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
  width: "360px",
  height: "100%",
  backgroundColor: alpha(theme.palette.background.paper, 0.4),
  backdropFilter: "blur(12px)",
  borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(3),
  overflowY: "auto",
  "&::-webkit-scrollbar": { width: "4px" },
}));

const MainContent = styled(Box)(({ theme }) => ({
  flex: 1,
  height: "100%",
  display: "flex",
  flexDirection: "column",
  backgroundColor: theme.palette.mode === "dark" 
    ? alpha(theme.palette.background.default, 0.2) 
    : alpha(theme.palette.background.default, 0.5),
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
      height: "calc(100vh - 64px)", 
      display: "flex", 
      overflow: "hidden",
      bgcolor: "background.default"
    }}>
      {/* 側邊構建欄 */}
      <SidebarContainer>
        <Stack spacing={4} sx={{ flex: 1 }}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
              <AddCircleOutlineIcon color="primary" sx={{ fontSize: 24 }} />
              <Typography variant="h6" fontWeight={900}>
                {t("Pages.Schoice.Prompt.addTitle")}
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ opacity: 0.6 }}>
              {promptType === "bull"
                ? t("Pages.Schoice.PromptList.tabs.bullish")
                : t("Pages.Schoice.PromptList.tabs.bearish")} 模型建構中
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
        </Stack>

        <Box sx={{ mt: 4, pt: 2, borderTop: (theme) => `1px solid ${alpha(theme.palette.divider, 0.05)}` }}>
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

      {/* 主儀表板區域 */}
      <MainContent>
        {/* 上半部：條件清單 (三欄式排列) */}
        <Box sx={{ 
          flex: "0 1 auto", 
          p: 3, 
          display: "grid", 
          gridTemplateColumns: "repeat(3, 1fr)", 
          gap: 2,
          minHeight: "40%",
          maxHeight: "50%",
          overflow: "hidden"
        }}>
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
        </Box>

        {/* 下半部：回測圖表 */}
        <Box sx={{ 
          flex: 1, 
          m: 3, 
          mt: 0,
          p: 2.5,
          borderRadius: "20px",
          bgcolor: alpha("#000", 0.02),
          border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.05)}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          <SectionHeader sx={{ mb: 1 }}>
            <BarChartIcon fontSize="inherit" />
            策略預覽 (示例數據與回測模擬)
          </SectionHeader>
          <Box sx={{ flex: 1, overflow: "hidden" }}>
             <PromptChart
                hourlyPrompts={prompts.hourly}
                dailyPrompts={prompts.daily}
                weeklyPrompts={prompts.weekly}
                hourlyData={hourlyData}
                dailyData={dailyData}
                weeklyData={weeklyData}
              />
          </Box>
        </Box>
      </MainContent>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
