import { Stack } from "@mui/material";
import ListArea from "./parts/ListArea";
import PromptContent from "./parts/PromptContent";

export default function PromptList() {
  return (
    <Stack direction="row" sx={{ height: "100%", overflow: "hidden" }}>
      <ListArea />
      <PromptContent />
    </Stack>
  );
}
