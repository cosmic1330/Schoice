import { Stack } from "@mui/material";
import Actions from "./Actions";
import Breadcrumb from "./Breadcrumb";

export default function BottomBar() {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      px={1.5}
    >
      <Breadcrumb />
      <Actions />
    </Stack>
  );
}
