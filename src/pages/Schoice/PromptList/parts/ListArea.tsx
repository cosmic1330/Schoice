import AddRoundedIcon from "@mui/icons-material/AddRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import { Box, Button, Paper, Stack, Tab, Tabs } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import useCloudStore from "../../../../store/Cloud.store";
import useSchoiceStore from "../../../../store/Schoice.store";
import { PromptType } from "../../../../types";
import ListItem from "./ListItem";

const GlassSidebar = styled(Paper)(({ theme }) => ({
  width: 330,
  height: "100%",
  backgroundColor: theme.palette.mode === "light" ? "#FFF9E8" : theme.palette.background.paper,
  borderRight: "3px solid #202027",
  borderRadius: 0,
  display: "flex",
  flexDirection: "column",
  boxShadow: "5px 0 0 rgba(32,32,39,.08)",
  overflow: "hidden",
  position: "relative",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    right: 0,
    width: 18,
    height: "100%",
    background: "repeating-linear-gradient(180deg, transparent 0 24px, rgba(255,159,197,.35) 25px 30px, transparent 31px 48px)",
    pointerEvents: "none",
  },
  "@media (max-width: 800px)": { width: 280 },
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  minHeight: 62,
  backgroundColor: theme.palette.mode === "light" ? "#FFF1F6" : theme.palette.background.paper,
  borderBottom: "3px solid #202027",
  "& .MuiTabs-indicator": {
    height: 7,
    borderRadius: "999px 999px 0 0",
    backgroundColor: theme.palette.primary.main,
    boxShadow: "none",
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: "none",
  fontWeight: 700,
  fontSize: "0.875rem",
  color: theme.palette.text.secondary,
  "&.Mui-selected": {
    color: theme.palette.text.primary,
    transform: "rotate(-1deg)",
  },
  "& .MuiSvgIcon-root": {
    marginBottom: "0 !important",
    marginRight: theme.spacing(1),
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: "999px",
  padding: theme.spacing(1.5, 3),
  fontWeight: 800,
  textTransform: "none",
  letterSpacing: "0.04em",
  fontSize: "0.85rem",
  color: "#202027",
  background: theme.palette.primary.main,
  boxShadow: "4px 4px 0 #202027",
  border: "2px solid #202027",
  transition: "all .15s ease",
  "&:hover": {
    transform: "translate(2px, 2px) rotate(-1deg)",
    boxShadow: "2px 2px 0 #202027",
    background: theme.palette.secondary.main,
  },
  "&:active": {
    transform: "translate(4px, 4px)",
    boxShadow: "none",
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
