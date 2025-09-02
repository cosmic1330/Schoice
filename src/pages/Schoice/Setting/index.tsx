import { Container, Grid, Typography } from "@mui/material";
import CheckUpdate from "./CheckUpdate";
import ExampleSelector from "./ExampleSelector";
import SystemStatus from "./SystemStatus";

export default function Setting() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        系統管理
      </Typography>
      <Grid container spacing={2}>
        {/* <DatabaseRepair />
        <DatabaseDeletion />
        <CacheManagement /> */}
        {/* <OtherSettings /> */}
        <CheckUpdate />
        <ExampleSelector />
      </Grid>
      <SystemStatus />
    </Container>
  );
}
