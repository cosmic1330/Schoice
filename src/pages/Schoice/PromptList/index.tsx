import { Stack } from "@mui/material";
import ListArea from "./parts/ListArea";
import PromptContent from "./parts/PromptContent";

export default function PromptList() {
  return (
    <Stack direction="row">
      <ListArea />
      <PromptContent />
    </Stack>
  );
}
