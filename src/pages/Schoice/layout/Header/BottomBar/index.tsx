import { Stack } from "@mui/material";
import useInitFilterStock from "../../../../../hooks/useInitFilterStock";
import Actions from "./Actions";
import Breadcrumb from "./Breadcrumb";

export default function BottomBar() {
  useInitFilterStock();
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      px={2.5}
      py={1}
      sx={{ minHeight: 56 }}
    >
      <Breadcrumb />
      <Actions />
    </Stack>
  );
}
