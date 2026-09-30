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

const ItemCard = styled(MuiStack, {
  shouldForwardProp: (prop) => prop !== "isSelected",
})<{ isSelected: boolean }>(({ theme, isSelected }) => ({
  flexDirection: "row",
  alignItems: "center",
  padding: theme.spacing(1.35, 1.5),
  cursor: "pointer",
  position: "relative",
  overflow: "hidden",
  borderRadius: 18,
  backgroundColor: isSelected
    ? theme.palette.primary.main
    : theme.palette.background.paper,
  border: "2px solid #202027",
  boxShadow: isSelected ? "4px 4px 0 #202027" : "2px 2px 0 rgba(32,32,39,.18)",
  transition: "all .15s ease-out",

  "&:hover": {
    backgroundColor: theme.palette.secondary.main,
    transform: "translate(2px, -1px) rotate(-.4deg)",
    boxShadow: "4px 4px 0 #202027",
    "& .action-btn": {
      opacity: 1,
      transform: "translateX(0)",
    },
  },

  "&::after": isSelected
    ? {
        content: '"★"',
        position: "absolute",
        top: -3,
        right: 7,
        color: theme.palette.warning.main,
        fontSize: 19,
        WebkitTextStroke: "1.5px #202027",
        transform: "rotate(12deg)",
      }
    : {},
}));

const IndexNumber = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "isSelected",
})<{ isSelected: boolean }>(({ theme, isSelected }) => ({
  fontFamily: "inherit",
  fontSize: "1.25rem",
  fontWeight: 900,
  color: isSelected
    ? "#202027"
    : alpha(theme.palette.text.primary, 0.22),
  lineHeight: 1,
  marginRight: theme.spacing(2),
  userSelect: "none",
  letterSpacing: "-0.04em",
  WebkitTextStroke: isSelected ? "0" : "1px rgba(32,32,39,.18)",
}));

const Chip = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "2px 6px",
  borderRadius: "999px",
  border: "1.5px solid #202027",
  backgroundColor: alpha(theme.palette.background.default, 0.7),
  fontFamily: "inherit",
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
  const { setSelect, select, clearSeleted } = useSchoiceStore();
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
      if (isActive) {
        clearSeleted();
      }
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
    <ItemCard isSelected={isActive} onClick={handleSelect} spacing={2}>
      <IndexNumber isSelected={isActive}>
        {index < 10 ? `0${index}` : index}
      </IndexNumber>

      <Box sx={{ flex: 1, minWidth: 0, zIndex: 1 }}>
        <Typography
          variant="body2"
          fontWeight={800}
          noWrap
          sx={{
            color: "text.primary",
            letterSpacing: "0.01em",
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
          opacity: isActive ? 0.65 : 0,
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
