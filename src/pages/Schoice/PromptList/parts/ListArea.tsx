import AddRoundedIcon from "@mui/icons-material/AddRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import { Box, Button, Paper, Stack, Tab, Tabs } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import useCloudStore from "../../../../store/Cloud.store";
import useSchoiceStore from "../../../../store/Schoice.store";
import { PromptType } from "../../../../types";
import ListItem from "./ListItem";

const GlassSidebar = styled(Paper)(({ theme }) => ({
  width: 320,
  height: "100%",
  backgroundColor: alpha(
    theme.palette.mode === "light" ? theme.palette.background.paper : "#0f172a",
    0.6,
  ),
  backdropFilter: "blur(20px)",
  borderRight: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  borderRadius: 0,
  display: "flex",
  flexDirection: "column",
  boxShadow: `10px 0 30px ${alpha(theme.palette.common.black, 0.1)}`,
  overflow: "hidden",
  position: "relative",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    right: 0,
    width: 2,
    height: "100%",
    background: `linear-gradient(to bottom, transparent, ${alpha(
      theme.palette.primary.main,
      0.3,
    )}, transparent)`,
  },
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  minHeight: 56,
  backgroundColor: alpha(theme.palette.divider, 0.03),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  "& .MuiTabs-indicator": {
    height: 4,
    borderRadius: "4px 4px 0 0",
    backgroundColor: theme.palette.primary.main,
    boxShadow: `0 0 15px ${theme.palette.primary.main}`,
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: "none",
  fontWeight: 700,
  fontSize: "0.875rem",
  color: theme.palette.text.secondary,
  "&.Mui-selected": {
    color: theme.palette.primary.main,
  },
  "& .MuiSvgIcon-root": {
    marginBottom: "0 !important",
    marginRight: theme.spacing(1),
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: "16px",
  padding: theme.spacing(1.5, 3),
  fontWeight: 800,
  textTransform: "none",
  letterSpacing: "0.1em",
  fontSize: "0.85rem",
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.4)}`,
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.5)}`,
    background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
  },
  "&:active": {
    transform: "translateY(0)",
  },
  "& .MuiButton-startIcon": {
    marginRight: theme.spacing(1.5),
  },
}));

export default function ListArea() {
  const { using, changeUsing } = useSchoiceStore();
  const { bulls, bears } = useCloudStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleChange = (_: React.SyntheticEvent, newValue: PromptType) => {
    changeUsing(newValue);
  };

  return (
    <GlassSidebar elevation={0}>
      <StyledTabs value={using} onChange={handleChange} variant="fullWidth">
        <StyledTab
          icon={<TrendingUpRoundedIcon />}
          iconPosition="start"
          label={t("Pages.Schoice.PromptList.tabs.bullish")}
          value={PromptType.BULL}
        />
        <StyledTab
          icon={<TrendingDownRoundedIcon />}
          iconPosition="start"
          label={t("Pages.Schoice.PromptList.tabs.bearish")}
          value={PromptType.BEAR}
        />
      </StyledTabs>

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
          "&::-webkit-scrollbar": { display: "none" },
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        <Stack spacing={1}>
          {using === PromptType.BULL
            ? Object.entries(bulls)
                .sort(([, a], [, b]) => (a.index || 0) - (b.index || 0))
                .map(([id, item], index) => (
                  <ListItem
                    key={id}
                    index={index + 1}
                    id={id}
                    name={item.name}
                    promptType={PromptType.BULL}
                  />
                ))
            : Object.entries(bears)
                .sort(([, a], [, b]) => (a.index || 0) - (b.index || 0))
                .map(([id, item], index) => (
                  <ListItem
                    key={id}
                    index={index + 1}
                    id={id}
                    name={item.name}
                    promptType={PromptType.BEAR}
                  />
                ))}
        </Stack>
      </Box>

      <Box p={2}>
        <ActionButton
          fullWidth
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => {
            navigate(
              "/schoice/add?promptType=" +
                (using === PromptType.BULL ? PromptType.BULL : PromptType.BEAR),
            );
          }}
        >
          {t("Pages.Schoice.PromptList.list.addNew")}
        </ActionButton>
      </Box>
    </GlassSidebar>
  );
}
