import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { Stack, Typography } from "@mui/material";
import { useContext } from "react";
import { DatabaseContext } from "../../../../../context/DatabaseContext";

export default function LatestDate() {
  const { dates } = useContext(DatabaseContext);
  return (
    <Stack direction="row" alignItems="center" gap={.5}>
      <CalendarMonthIcon fontSize="small" />
      <Typography variant="body2">最後更新: {dates[0] || "N/A"}</Typography>
    </Stack>
  );
}
