import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { Box, IconButton, Stack, Typography, alpha } from "@mui/material";
import { useTranslation } from "react-i18next";
import useSchoiceStore from "../../../../../store/Schoice.store";
import useSyncWeekDate from "../../../../../hooks/useSyncWeekDate";

export default function RollBack() {
  const { t } = useTranslation();
  const { dateIndex, changedateIndex } = useSchoiceStore();
  useSyncWeekDate();

  const handleBackward = () => {
    if (dateIndex <= 0) return;
    changedateIndex(dateIndex - 1);
  };
  const handleForward = () => {
    changedateIndex(dateIndex + 1);
  };

  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Typography
        variant="caption"
        noWrap
        sx={{
          color: "text.secondary",
          fontWeight: 800,
          fontSize: "0.65rem",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          mr: 1,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {t("Pages.Schoice.Header.backtestDay")}
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          bgcolor: (theme) => alpha(theme.palette.divider, 0.05),
          borderRadius: "6px",
          p: 0.3,
        }}
      >
        <IconButton
          onClick={handleBackward}
          size="small"
          sx={{
            width: 22,
            height: 22,
            "&:hover": {
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
            },
          }}
          disabled={dateIndex <= 0}
        >
          <ArrowBackIosNewIcon sx={{ fontSize: 10 }} />
        </IconButton>

        <Typography
          variant="body2"
          sx={{
            fontWeight: 900,
            minWidth: 28,
            textAlign: "center",
            color: "primary.main",
            fontSize: "0.85rem",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {dateIndex}
        </Typography>

        <IconButton
          onClick={handleForward}
          size="small"
          sx={{
            width: 22,
            height: 22,
            "&:hover": {
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          <ArrowForwardIosIcon sx={{ fontSize: 10 }} />
        </IconButton>
      </Box>
    </Stack>
  );
}
