import { Box, Stack, Typography, alpha } from "@mui/material";
import { default as DataCount } from "./DataCount";
import FilterSelect from "./FilterSelect";
import UpdateDeals from "./UpdateDeals";

export default function Actions() {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
    >
      <FilterSelect />
      
      {/* 整合式狀態主群組 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          bgcolor: (theme) => alpha(theme.palette.divider, 0.04),
          px: 0.5,
          py: 0.5,
          borderRadius: "100px",
          border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        }}
      >
        <DataCount />
        <UpdateDeals />
      </Box>
    </Stack>
  );
}
