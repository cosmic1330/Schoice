import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useUser } from "../../../context/UserContext";
import useCloudStore from "../../../store/Cloud.store";
import useSchoiceStore from "../../../store/Schoice.store";
import { supabase } from "../../../tools/supabase";

const CONFIRMATION_TEXT = "刪除帳號";

export default function DeleteAccount() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const closeDialog = () => {
    if (deleting) return;
    setOpen(false);
    setConfirmation("");
    setErrorMessage("");
  };

  const deleteAccount = async () => {
    if (confirmation !== CONFIRMATION_TEXT || deleting) return;

    setDeleting(true);
    setErrorMessage("");

    try {
      const { error } = await supabase.functions.invoke("delete-account", {
        method: "DELETE",
      });

      if (error) {
        let message = error.message;
        try {
          const body = await error.context?.json();
          if (body?.error) message = body.error;
        } catch {
          // The response may not contain JSON (for example a gateway error).
        }
        throw new Error(message);
      }

      // The Auth user no longer exists, so only clear the local session.
      await supabase.auth.signOut({ scope: "local" });
      localStorage.removeItem("slitenting-email");
      localStorage.removeItem("slitenting-password");

      useCloudStore.setState({
        bulls: {},
        bears: {},
        alarms: {},
        trash: [],
        fundamentalCondition: null,
        watchStocks: [],
      });
      useSchoiceStore.setState({ select: null, filterStocks: null });

      navigate("/login", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message);
      setDeleting(false);
    }
  };

  return (
    <Grid size={{ xs: 12 }}>
      <Card sx={{ borderColor: "error.main", bgcolor: "rgba(241,95,85,.08)" }}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <DeleteForeverRoundedIcon color="error" sx={{ mt: 0.25 }} />
              <Stack spacing={0.5}>
                <Typography variant="h6">刪除帳號</Typography>
                <Typography variant="body2" color="text.secondary">
                  永久刪除帳號、策略、自選股、警示與雲端設定。此操作無法復原。
                </Typography>
              </Stack>
            </Stack>
            <Button color="error" variant="contained" onClick={() => setOpen(true)}>
              刪除我的帳號
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>永久刪除帳號？</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="error">
              這會永久刪除 {user?.email || "目前帳號"} 的所有雲端資料，且無法復原。
            </Alert>
            <Typography variant="body2">
              請輸入「{CONFIRMATION_TEXT}」以確認：
            </Typography>
            <TextField
              autoFocus
              fullWidth
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder={CONFIRMATION_TEXT}
              disabled={deleting}
              error={Boolean(confirmation) && confirmation !== CONFIRMATION_TEXT}
            />
            {errorMessage && <Alert severity="error">刪除失敗：{errorMessage}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={closeDialog} disabled={deleting}>
            取消
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={deleteAccount}
            disabled={confirmation !== CONFIRMATION_TEXT || deleting}
          >
            {deleting ? "刪除中…" : "永久刪除"}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
