import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { Box, Stack, Typography, alpha } from "@mui/material";
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
      gap={0.8}
    >
      <CalendarMonthIcon sx={{ fontSize: 14, color: "text.secondary", opacity: 0.6 }} />
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
        <Typography
          variant="caption"
          noWrap
          sx={{
            color: "text.secondary",
            fontWeight: 800,
            fontSize: "0.65rem",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {t("Pages.Schoice.Header.lastUpdate")}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "primary.main",
            fontWeight: 900,
            fontSize: "0.8rem",
            fontVariantNumeric: "tabular-nums",
          }}
        >
           {dates[0] || "N/A"}
        </Typography>
      </Box>
    </Stack>
  );
}
