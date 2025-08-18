import PostAddIcon from "@mui/icons-material/PostAdd";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useUser } from "../../../../context/UserContext";
import useCloudStore from "../../../../store/Cloud.store";
import { PromptType, PromptValue } from "../../../../types";

export default function InsertRuleButton() {
  const [open, setOpen] = useState(false);
  const [json, setJson] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>("");
  const [value, setValue] = useState<PromptValue>();
  const [type, setType] = useState<PromptType>();
  const [loading, setLoading] = useState(false);
  const { increase } = useCloudStore();
  const { user } = useUser();

  useEffect(() => {
    if (!json) {
      setValue(undefined);
      setType(undefined);
      setLoading(false);
      setName("");
      return;
    }

    setLoading(true);
    setError("");
    const timer = setTimeout(() => {
      try {
        const data = JSON.parse(json);
        if (data.name && data.conditions && data.type) {
          setName(data.name);
          setValue(data.conditions);
          setType(data.type);
        } else {
          throw new Error(
            "缺少必要欄位，請檢查是否包含 name, type, conditions.hourly ,conditions.daily, conditions.weekly"
          );
        }
      } catch (err: any) {
        setError(err instanceof SyntaxError ? "不符合 JSON 格式" : err.message);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [json]);

  const handleInsert = useCallback(() => {
    if (!name || !value || !type) {
      toast.error("請先填寫完整的 rule 資料");
      return;
    }

    try {
      if (name && value && type && user?.id) {
        increase(name, value, type, user.id);
        toast.success("Insert success");
        handleCancel();
      } else {
        toast.error(`缺少必要欄位，請檢查是否包含 name, type, value, user`);
      }
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        toast.error(`不符合JSON格式`);
      } else {
        toast.error(error.message);
      }
    }
  }, [name, value, type, increase]);

  const handleCancel = () => {
    setOpen(false);
    setName("");
    setValue(undefined);
    setType(undefined);
    setLoading(false);
    setJson("");
  };

  return (
    <Box>
      <Tooltip title="加入複製的策略" placement="right" arrow>
        <IconButton
          onClick={() => {
            setOpen(true);
          }}
        >
          <PostAddIcon />
        </IconButton>
      </Tooltip>
      <Dialog open={open} onClose={handleCancel}>
        <DialogTitle width={500}>
          <Typography variant="h6">Insert Rule</Typography>
        </DialogTitle>
        <DialogContent>
          {!name && !value && !type && (
            <TextField
              multiline
              minRows={4}
              fullWidth
              value={json}
              onChange={(e) => setJson(e.target.value)}
              placeholder="請貼上 JSON 格式的 rule 資料"
              error={!!error}
            />
          )}

          {loading && (
            <Box display="flex" justifyContent="center" mt={2}>
              <CircularProgress size={24} />
            </Box>
          )}

          {/* ✅ 顯示已成功解析後的欄位 */}
          {(name || type || value) && !loading && (
            <Box mt={2}>
              <TextField
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                margin="dense"
              />
            </Box>
          )}
          {error && (
            <Box mt={2}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button size="small" color="inherit" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="small" onClick={handleInsert}>
            Insert
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
