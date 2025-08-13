import SyncIcon from "@mui/icons-material/Sync";
import { Button, Stack, Typography } from "@mui/material";
import { useCallback } from "react";
import useHighConcurrencyDeals, {
  Status,
} from "../../../../../../hooks/useHighConcurrencyDeals";
import Process from "../../../../parts/Process";

export default function UpdateDeals() {
  const { run, status, persent, stop } = useHighConcurrencyDeals();

  const handleClick = useCallback(async () => {
    if (status === Status.Idle) {
      sessionStorage.removeItem("schoice:update:stop");
      run();
    } else {
      stop();
    }
  }, [status, run, stop]);

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Typography variant="body2" color="text.secondary">
        {status !== Status.Idle && <Process persent={persent} />}
      </Typography>
      <Button
        variant="contained"
        onClick={handleClick}
        size="large"
        startIcon={<SyncIcon />}
        color={status === Status.Idle ? "primary" : "error"}
        sx={{ color: "#fff" }}
      >
        {status === Status.Download ? ` 取消` : "更新資料"}
      </Button>
    </Stack>
  );
}
