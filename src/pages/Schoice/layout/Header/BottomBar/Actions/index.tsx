import { Stack } from "@mui/material";
import { default as DataCount } from "./DataCount";
import FilterSelect from "./FilterSelect";
import UpdateDeals from "./UpdateDeals";

export default function Actions() {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <FilterSelect />
      <DataCount />
      <UpdateDeals />
    </Stack>
  );
}
