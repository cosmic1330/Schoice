import ContentPasteGoRoundedIcon from "@mui/icons-material/ContentPasteGoRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import NotificationAddIcon from "@mui/icons-material/NotificationAdd";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { error } from "@tauri-apps/plugin-log";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { useUser } from "../../../../../context/UserContext";
import useCloudStore from "../../../../../store/Cloud.store";
import useSchoiceStore from "../../../../../store/Schoice.store";
import { PromptType, PromptValue, SelectType } from "../../../../../types";
import Summary from "./Summary";

const ActionGroup = styled(Box)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.4),
  backdropFilter: "blur(20px)",
  borderRadius: "20px",
  padding: theme.spacing(1, 1.5),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  display: "flex",
  gap: theme.spacing(0.5),
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
}));

const TitleLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 900,
  fontSize: "2.5rem",
  letterSpacing: "-0.03em",
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  textShadow: `0 0 30px ${alpha(theme.palette.primary.main, 0.1)}`,
}));

export default function RuleContent({ select }: { select: SelectType | null }) {
  const { remove, addAlarm, alarms, removeAlarm, bulls, bears } =
    useCloudStore();
  const { clearSeleted } = useSchoiceStore();
  const { user } = useUser();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleCopy = async () => {
    try {
      const data = select?.type === PromptType.BULL ? bulls : bears;
      if (!data || !select) {
        toast.error(t("Pages.Schoice.PromptList.messages.copyError"));
        return;
      }
      const prompt = data[select.prompt_id];
      if (!prompt) {
        toast.error(t("Pages.Schoice.PromptList.messages.copyError"));
        return;
      }
      await writeText(
        JSON.stringify({ ...prompt, type: select.type }, null, 2)
      );
      let permissionGranted = await isPermissionGranted();
      console.log("Permission granted:", permissionGranted);
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === "granted";
      }
      if (permissionGranted) {
        sendNotification({
          title: "ClipBoard",
          body: t("Pages.Schoice.PromptList.messages.copySuccess"),
        });
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
        toast.error(t("Pages.Schoice.PromptList.messages.addAlarmError"));
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
      toast.success(t("Pages.Schoice.PromptList.messages.addAlarmSuccess"));
    } catch (error) {
      console.error(error);
      toast.error(t("Pages.Schoice.PromptList.messages.addAlarmError"));
    }
  };

  const handleRemoveNotification = async () => {
    if (!user) {
      return;
    }
    if (!select || !alarms[select.prompt_id]) {
      toast.error(t("Pages.Schoice.PromptList.messages.noAlarmFound"));
      return;
    }
    try {
      await removeAlarm(select.prompt_id, user.id);
      toast.success(t("Pages.Schoice.PromptList.messages.removeAlarmSuccess"));
    } catch (error) {
      console.error(error);
      toast.error(t("Pages.Schoice.PromptList.messages.removeAlarmError"));
    }
  };

  return (
    <Stack spacing={3} alignItems="flex-start" width={"100%"} sx={{ py: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        width="100%"
      >
        <Box>
          <Typography
            variant="overline"
            color="text.secondary"
            fontWeight={800}
            sx={{
              letterSpacing: "0.2em",
              fontFamily: "monospace",
              opacity: 0.6,
            }}
          >
            {t("Pages.Schoice.PromptList.content.strategyConfiguration")}
          </Typography>
          <TitleLabel variant="h3">
            {select && select.type === PromptType.BULL
              ? bulls[select.prompt_id]?.name
              : select && select.type === PromptType.BEAR
              ? bears[select.prompt_id]?.name
              : t("Pages.Schoice.PromptList.content.noStrategySelected")}
          </TitleLabel>
        </Box>

        <ActionGroup>
          <Tooltip title={t("Pages.Schoice.PromptList.content.editStrategy")}>
            <IconButton
              onClick={() => navigate("/schoice/edit/" + select?.prompt_id)}
              color="primary"
            >
              <EditRoundedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("Pages.Schoice.PromptList.content.exportJson")}>
            <IconButton onClick={handleCopy}>
              <ContentPasteGoRoundedIcon />
            </IconButton>
          </Tooltip>
          {select && select.type === PromptType.BEAR && (
            <Tooltip
              title={
                alarms[select.prompt_id]
                  ? t("Pages.Schoice.PromptList.content.removeAlarm")
                  : t("Pages.Schoice.PromptList.content.addAlarm")
              }
            >
              <IconButton
                onClick={
                  alarms[select.prompt_id]
                    ? handleRemoveNotification
                    : handleAddNotification
                }
                color={alarms[select.prompt_id] ? "warning" : "default"}
              >
                {alarms[select.prompt_id] ? (
                  <NotificationsOffIcon />
                ) : (
                  <NotificationAddIcon />
                )}
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={t("Pages.Schoice.PromptList.content.deleteStrategy")}>
            <IconButton onClick={handleDelete} color="error">
              <DeleteRoundedIcon />
            </IconButton>
          </Tooltip>
        </ActionGroup>
      </Stack>

      <Summary select={select} />
    </Stack>
  );
}
