import ContentPasteGoRoundedIcon from "@mui/icons-material/ContentPasteGoRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import NotificationAddIcon from "@mui/icons-material/NotificationAdd";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import { IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { error } from "@tauri-apps/plugin-log";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import useSchoiceStore from "../../../../../store/Schoice.store";
import { PromptType, PromptValue } from "../../../../../types";
import Summary from "./Summary";

export default function RuleContent({
  select,
}: {
  select: {
    id: string;
    name: string;
    value: PromptValue;
    type: PromptType;
  };
}) {
  const { remove, reload, clearSeleted, addAlarm, alarms, removeAlarm } = useSchoiceStore();
  const navigate = useNavigate();

  const handleCopy = async () => {
    try {
      await writeText(JSON.stringify(select));
      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === "granted";
      }
      if (permissionGranted) {
        sendNotification({ title: "ClipBoard", body: "Copy Success!" });
      }
    } catch (err) {
      error(`複製失敗:${err}`);
    }
  };

  const handleDelete = () => {
    clearSeleted();
    remove(select.id, select.type);
    reload();
  };

  const handleAddNotification = async () => {
    try {
      await addAlarm({ name: select.name, value: select.value }, select.id);
      toast.success("加入告警偵測成功");
    } catch (error) {
      console.error(error);
      toast.error("加入告警偵測失敗");
    }
  };

  const handleRemoveNotification = async () => {
    try {
      await removeAlarm(select.id);
      toast.success("移除告警偵測成功");
    } catch (error) {
      console.error(error);
      toast.error("移除告警偵測失敗");
    }
  };


  return (
    <Stack spacing={2} alignItems="flex-start" width={"100%"}>
      <Typography variant="h4">{select && select.name}</Typography>
      <Stack direction="row" spacing={2}>
        <Tooltip title="修改策略條件">
          <IconButton onClick={() => navigate("/schoice/edit/" + select?.id)}>
            <EditRoundedIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="複製策略條件">
          <IconButton onClick={handleCopy}>
            <ContentPasteGoRoundedIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="刪除策略條件">
          <IconButton onClick={handleDelete}>
            <DeleteRoundedIcon fontSize="medium" />
          </IconButton>
        </Tooltip>
        {select.type === PromptType.BEAR && !alarms[select.id] && (
          <Tooltip title="加入告警偵測">
            <IconButton onClick={handleAddNotification}>
              <NotificationAddIcon fontSize="medium" />
            </IconButton>
          </Tooltip>
        )}
        {select.type === PromptType.BEAR && alarms[select.id] && (
          <Tooltip title="移除告警偵測">
            <IconButton onClick={handleRemoveNotification}>
              <NotificationsOffIcon fontSize="medium" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      <Summary select={select} />
    </Stack>
  );
}
