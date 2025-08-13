import { IconButton, Stack, Typography } from "@mui/material";
import useSchoiceStore from "../../../../../store/Schoice.store";

export default function RollBack() {
  const { todayDate, changeTodayDate } = useSchoiceStore();
  const handleBackward = () => {
    if (todayDate <= 0) return; // Prevent going back before day 0
    changeTodayDate(todayDate - 1);
  };
  const handleForward = () => {
    changeTodayDate(todayDate + 1);
  };

  return (
    <Stack direction="row" alignItems="center">
      <Typography variant="body2">回測 (日):</Typography>
      <IconButton onClick={handleBackward} size="small">
        ◀️
      </IconButton>
      <Typography variant="body2" component="span" sx={{ color: "#fff" }}>
        {todayDate}
      </Typography>
      <IconButton onClick={handleForward} size="small">
        ▶️
      </IconButton>
    </Stack>
  );
}
