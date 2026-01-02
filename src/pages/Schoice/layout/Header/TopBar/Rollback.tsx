import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { IconButton, Stack, Typography, alpha } from "@mui/material";
import { useTranslation } from "react-i18next";
import useSchoiceStore from "../../../../../store/Schoice.store";

export default function RollBack() {
  const { t } = useTranslation();
  const { todayDate, changeTodayDate } = useSchoiceStore();

  const handleBackward = () => {
    if (todayDate <= 0) return;
    changeTodayDate(todayDate - 1);
  };
  const handleForward = () => {
    changeTodayDate(todayDate + 1);
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        bgcolor: (theme) =>
          theme.palette.mode === "dark"
            ? alpha("#fff", 0.05)
            : alpha("#000", 0.05),
        borderRadius: "20px",
        px: 1,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
          fontWeight: 600,
          ml: 1,
          mr: 1,
        }}
      >
        {t("Pages.Schoice.Header.backtestDay")}:
      </Typography>
      <IconButton
        onClick={handleBackward}
        size="small"
        sx={{ p: 0.5 }}
        disabled={todayDate <= 0}
      >
        <ArrowBackIosNewIcon sx={{ fontSize: 12 }} />
      </IconButton>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 800,
          minWidth: 24,
          textAlign: "center",
          color: "primary.main",
        }}
      >
        {todayDate}
      </Typography>
      <IconButton onClick={handleForward} size="small" sx={{ p: 0.5 }}>
        <ArrowForwardIosIcon sx={{ fontSize: 12 }} />
      </IconButton>
    </Stack>
  );
}
