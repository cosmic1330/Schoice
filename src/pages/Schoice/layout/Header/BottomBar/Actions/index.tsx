import { Stack } from "@mui/material";
import { default as DataCount } from "./DataCount";
import UpdateDeals from "./UpdateDeals";
import FilterSelect from "./FilterSelect";

export default function Actions() {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <FilterSelect />
      <DataCount />
      <UpdateDeals />
    </Stack>
  );
}
