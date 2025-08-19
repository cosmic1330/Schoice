import SyncIcon from "@mui/icons-material/Sync";
import { Button, Stack, Typography } from "@mui/material";
import { useCallback } from "react";
import useHighConcurrencyDeals, {
  Status,
} from "../../../../../../hooks/useHighConcurrencyDeals";
import useSchoiceStore from "../../../../../../store/Schoice.store";

export default function UpdateDeals() {
  const { updateProgress } = useSchoiceStore();
  const { run, status, stop } = useHighConcurrencyDeals();

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
        {status !== Status.Idle && updateProgress > 0 && (
          <Typography variant="caption" color="textSecondary">
            更新中: {updateProgress}
          </Typography>
        )}
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
