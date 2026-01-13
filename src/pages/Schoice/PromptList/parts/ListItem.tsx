import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack as MuiStack,
  Typography,
  styled,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUser } from "../../../../context/UserContext";
import useCloudStore from "../../../../store/Cloud.store";
import useSchoiceStore from "../../../../store/Schoice.store";
import { PromptType } from "../../../../types";

const ItemCard = styled(MuiStack)<{ active: boolean }>(({ theme, active }) => ({
  flexDirection: "row",
  alignItems: "center",
  padding: theme.spacing(1.5, 2),
  cursor: "pointer",
  position: "relative",
  overflow: "hidden",
  // Chamfered corners for sci-fi HUD look
  clipPath:
    "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
  backgroundColor: active
    ? alpha(theme.palette.primary.main, 0.1)
    : alpha(theme.palette.background.paper, 0.05),
  borderLeft: active
    ? `4px solid ${theme.palette.primary.main}`
    : `4px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: "all 0.1s ease-out", // Sharp, mechanical transition

  // Scanline/Grid texture overlay
  backgroundImage: active
    ? `linear-gradient(90deg, ${alpha(
        theme.palette.primary.main,
        0.05
      )} 1px, transparent 1px),
       linear-gradient(${alpha(
         theme.palette.primary.main,
         0.05
       )} 1px, transparent 1px)`
    : "none",
  backgroundSize: "20px 20px",

  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    transform: "translateX(4px)",
    "& .action-btn": {
      opacity: 1,
      transform: "translateX(0)",
    },
  },

  // Corner markers for active state
  "&::after": active
    ? {
        content: '""',
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 10,
        height: 10,
        borderBottom: `2px solid ${theme.palette.primary.main}`,
        borderRight: `2px solid ${theme.palette.primary.main}`,
      }
    : {},
}));

const IndexNumber = styled(Typography)<{ active: boolean }>(
  ({ theme, active }) => ({
    fontFamily: "monospace",
    fontSize: "1.5rem",
    fontWeight: 900,
    color: active
      ? alpha(theme.palette.primary.main, 0.2)
      : alpha(theme.palette.text.disabled, 0.1),
    lineHeight: 1,
    marginRight: theme.spacing(2),
    userSelect: "none",
    letterSpacing: "-0.05em",
  })
);

const Chip = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "2px 6px",
  borderRadius: "4px",
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
  backgroundColor: alpha(theme.palette.background.default, 0.5),
  fontFamily: "monospace",
  fontSize: "0.65rem",
  color: theme.palette.text.secondary,
  letterSpacing: "0.05em",
}));

export default function ListItem({
  index,
  id,
  name,
  promptType,
}: {
  index: number;
  id: string;
  name: string;
  promptType: PromptType;
}) {
  const { remove } = useCloudStore();
  const { setSelect, select } = useSchoiceStore();
  const { user } = useUser();
  const { t } = useTranslation();

  const isActive = select?.prompt_id === id;
  const [openConfirm, setOpenConfirm] = useState(false);

  const handleDeleteClick = (event: React.SyntheticEvent) => {
    event.stopPropagation();
    setOpenConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (user) {
      remove(id, promptType, user.id);
    }
    setOpenConfirm(false);
  };

  const handleCancelDelete = () => {
    setOpenConfirm(false);
  };

  const handleSelect = () => {
    setSelect({ prompt_id: id, type: promptType });
  };

  return (
    <ItemCard active={isActive} onClick={handleSelect} spacing={2}>
      <IndexNumber active={isActive}>
        {index < 10 ? `0${index}` : index}
      </IndexNumber>

      <Box sx={{ flex: 1, minWidth: 0, zIndex: 1 }}>
        <Typography
          variant="body2"
          fontWeight={800}
          noWrap
          sx={{
            color: isActive ? "primary.main" : "text.primary",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            mb: 0.5,
          }}
        >
          {name}
        </Typography>
        <Chip>ID: {id.substring(0, 8)}</Chip>
      </Box>

      <IconButton
        size="small"
        onClick={handleDeleteClick}
        className="action-btn"
        sx={{
          opacity: 0,
          transform: "translateX(10px)",
          transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          color: "text.secondary",
          "&:hover": {
            color: "error.main",
          },
        }}
      >
        <DeleteRoundedIcon fontSize="small" />
      </IconButton>

      <Dialog
        open={openConfirm}
        onClose={handleCancelDelete}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogTitle>
          {t("Pages.Schoice.PromptList.messages.moveToTrashConfirmTitle")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("Pages.Schoice.PromptList.messages.moveToTrashConfirmContent", {
              name,
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="inherit">
            {t("Pages.Schoice.Header.cancel")}
          </Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            {t("Pages.Schoice.PromptList.messages.moveToTrashConfirmButton")}
          </Button>
        </DialogActions>
      </Dialog>
    </ItemCard>
  );
}
