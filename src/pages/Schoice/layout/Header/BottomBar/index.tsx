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
      px={1.5}
    >
      <Breadcrumb />
      <Actions />
    </Stack>
  );
}
