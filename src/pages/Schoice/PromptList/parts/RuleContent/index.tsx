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
import { useUser } from "../../../../../context/UserContext";
import useCloudStore from "../../../../../store/Cloud.store";
import useSchoiceStore from "../../../../../store/Schoice.store";
import { PromptType, PromptValue, SelectType } from "../../../../../types";
import Summary from "./Summary";

export default function RuleContent({ select }: { select: SelectType | null }) {
  const { remove, addAlarm, alarms, removeAlarm, bulls, bears } =
    useCloudStore();
  const { clearSeleted } = useSchoiceStore();
  const { user } = useUser();
  const navigate = useNavigate();

  const handleCopy = async () => {
    try {
      const data = select?.type === PromptType.BULL ? bulls : bears;
      if (!data || !select) {
        toast.error("無法複製，請選擇一個策略條件");
        return;
      }
      const prompt = data[select.prompt_id];
      if (!prompt) {
        toast.error("無法複製，找不到對應的策略條件");
        return;
      }
      await writeText(
        JSON.stringify(
          { ...prompt, type: select.type },
          null,
          2
        )
      );
      let permissionGranted = await isPermissionGranted();
      console.log("Permission granted:", permissionGranted);
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
    if (user) {
      if (select?.type === PromptType.BULL) {
        remove(select.prompt_id, PromptType.BULL, user.id);
      } else if (select?.type === PromptType.BEAR) {
        remove(select.prompt_id, PromptType.BEAR, user.id);
      }
    }
  };

  const handleAddNotification = async () => {
    if (!user || !select) {
      return;
    }
    try {
      let name: string;
      let conditions: PromptValue;
      let index: number;
      if (select?.type === PromptType.BULL) {
        name = bulls[select.prompt_id]?.name || "";
        conditions = bulls[select.prompt_id]?.conditions;
        index = bulls[select.prompt_id]?.index || 0;
      } else {
        name = bears[select.prompt_id]?.name || "";
        conditions = bears[select.prompt_id]?.conditions;
        index = bears[select.prompt_id]?.index || 0;
      }
      if (!conditions || !index || !name) {
        toast.error("無法找到對應的條件或索引");
        return;
      }

      await addAlarm(
        {
          name,
          conditions,
          index,
        },
        select.prompt_id,
        user.id
      );
      toast.success("加入告警偵測成功");
    } catch (error) {
      console.error(error);
      toast.error("加入告警偵測失敗");
    }
  };

  const handleRemoveNotification = async () => {
    if (!user) {
      return;
    }
    if (!select || !alarms[select.prompt_id]) {
      toast.error("沒有找到對應的告警偵測");
      return;
    }
    try {
      await removeAlarm(select.prompt_id, user.id);
      toast.success("移除告警偵測成功");
    } catch (error) {
      console.error(error);
      toast.error("移除告警偵測失敗");
    }
  };

  return (
    <Stack spacing={2} alignItems="flex-start" width={"100%"}>
      <Typography variant="h4">
        {select && select.type === PromptType.BULL
          ? bulls[select.prompt_id]?.name
          : select && select.type === PromptType.BEAR
          ? bears[select.prompt_id]?.name
          : "無選擇的策略條件"}
      </Typography>
      <Stack direction="row" spacing={2}>
        <Tooltip title="修改策略條件">
          <IconButton
            onClick={() => navigate("/schoice/edit/" + select?.prompt_id)}
          >
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
        {select &&
          select.type === PromptType.BEAR &&
          !alarms[select.prompt_id] && (
            <Tooltip title="加入告警偵測">
              <IconButton onClick={handleAddNotification}>
                <NotificationAddIcon fontSize="medium" />
              </IconButton>
            </Tooltip>
          )}
        {select &&
          select.type === PromptType.BEAR &&
          alarms[select.prompt_id] && (
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
