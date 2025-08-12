import { Container, Grid, Typography } from "@mui/material";
import CacheManagement from "./CacheManagement";
import CloudSync from "./CloudSync";
import DatabaseDeletion from "./DatabaseDeletion";
import DatabaseRepair from "./DatabaseRepair";
import OtherSettings from "./OtherSettings";
import SystemStatus from "./SystemStatus";

export default function Setting() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        系統管理
      </Typography>
      <Grid container spacing={2}>
        <DatabaseRepair />
        <DatabaseDeletion />
        <CacheManagement />
        <OtherSettings />
        <CloudSync />
      </Grid>
      <SystemStatus />
    </Container>
  );
}
