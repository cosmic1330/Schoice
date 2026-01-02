import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { Stack, Typography, alpha } from "@mui/material";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { DatabaseContext } from "../../../../../context/DatabaseContext";

export default function LatestDate() {
  const { t } = useTranslation();
  const { dates } = useContext(DatabaseContext);
  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1}
      sx={{
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
        px: 1.5,
        py: 0.5,
        borderRadius: "20px",
        border: "1px solid",
        borderColor: (theme) => alpha(theme.palette.primary.main, 0.1),
      }}
    >
      <CalendarMonthIcon sx={{ fontSize: 16, color: "primary.main" }} />
      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {t("Pages.Schoice.Header.lastUpdate")}: {dates[0] || "N/A"}
      </Typography>
    </Stack>
  );
}
