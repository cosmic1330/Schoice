import BorderColorIcon from "@mui/icons-material/BorderColor";
import {
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

export default function PromptName({
  name,
  setName,
}: {
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [edit, setEdit] = useState(false);
  const handleEditStart = () => {
    setEdit(true);
  };
  const handleEditEnd = () => {
    setEdit(false);
  };
  return edit ? (
    <Stack direction="row" alignItems="center" my={2} spacing={2}>
      <TextField
        label="策略名稱"
        onChange={(e) => setName(e.target.value)}
        defaultValue={name}
        size="small"
        fullWidth
      />
      <Button onClick={handleEditEnd} size="small">確定</Button>
    </Stack>
  ) : (
    <Stack direction="row" alignItems="center" my={2} spacing={2}>
      <Typography variant="h6">{name}</Typography>
      <IconButton onClick={handleEditStart} size="small">
        <BorderColorIcon />
      </IconButton>
    </Stack>
  );
}
