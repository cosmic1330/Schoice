import { Box, Container, Grid, Typography } from "@mui/material";
import CheckUpdate from "./CheckUpdate";
import DatabaseInitialization from "./DatabaseInitialization";
import DatabaseSettings from "./DatabaseSettings";
import ExampleSelector from "./ExampleSelector";
import OtherSettings from "./OtherSettings";
import StockMenuSettings from "./StockMenuSettings";
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
          <DatabaseInitialization />
          <Grid size={{ xs: 12, md: 6 }}>
            <StockMenuSettings />
          </Grid>
          <OtherSettings />
          <ExampleSelector />
          <CheckUpdate />
        </Grid>
        <SystemStatus />
      </Container>
    </Box>
  );
}
