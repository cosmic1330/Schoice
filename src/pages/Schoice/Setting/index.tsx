import { Box, Container, Grid, Typography } from "@mui/material";
import CheckUpdate from "./CheckUpdate";
import DatabaseSettings from "./DatabaseSettings";
import ExampleSelector from "./ExampleSelector";
import OtherSettings from "./OtherSettings";
import SystemStatus from "./SystemStatus";

export default function Setting() {
  return (
    <Box
      sx={{
        height: "100%",
        overflowY: "auto",
        "&::-webkit-scrollbar": { display: "none" },
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h5" fontWeight="bold" mb={3}>
          系統管理
        </Typography>
        <Grid container spacing={2}>
          <DatabaseSettings />
          {/* <DatabaseRepair />
        <DatabaseDeletion />
        <CacheManagement /> */}
          <OtherSettings />
          <ExampleSelector />
          <CheckUpdate />
        </Grid>
        <SystemStatus />
      </Container>
    </Box>
  );
}
