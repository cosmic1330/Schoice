import BorderColorIcon from "@mui/icons-material/BorderColor";
import {
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: alpha(theme.palette.background.paper, 0.2),
  },
}));

export default function PromptName({
  name,
  setName,
}: {
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
}) {
  const { t } = useTranslation();
  const [edit, setEdit] = useState(false);
  const handleEditStart = () => {
    setEdit(true);
  };
  const handleEditEnd = () => {
    setEdit(false);
  };
  return edit ? (
    <Stack direction="row" alignItems="center" my={2} spacing={2}>
      <StyledTextField
        label={t("Pages.Schoice.Prompt.strategyName")}
        onChange={(e) => setName(e.target.value)}
        defaultValue={name}
        size="small"
        fullWidth
        autoFocus
      />
      <Button
        onClick={handleEditEnd}
        variant="contained"
        size="small"
        sx={{ borderRadius: "8px", height: "40px", px: 3 }}
      >
        {t("Pages.Schoice.Fundamental.confirm")}
      </Button>
    </Stack>
  ) : (
    <Stack direction="row" alignItems="center" my={2} spacing={2}>
      <Typography
        variant="h5"
        fontWeight={700}
        sx={{
          background: (theme) =>
            `linear-gradient(45deg, ${theme.palette.text.primary}, ${alpha(
              theme.palette.text.primary,
              0.7
            )})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {name}
      </Typography>
      <IconButton
        onClick={handleEditStart}
        size="small"
        sx={{
          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05),
          "&:hover": {
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
          },
        }}
      >
        <BorderColorIcon fontSize="small" color="primary" />
      </IconButton>
    </Stack>
  );
}
