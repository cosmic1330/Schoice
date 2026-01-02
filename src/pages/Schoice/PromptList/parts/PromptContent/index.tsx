import { Box, Container, Grid } from "@mui/material";
import useSchoiceStore from "../../../../../store/Schoice.store";
import RuleContent from "../RuleContent";
import Null from "./Null";
import Result from "./Result";
import UnSelect from "./UnSelect";

export default function PromptContent() {
  const { select, data_count } = useSchoiceStore();
  return (
    <Box
      sx={{
        flex: 1,
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {data_count === 0 && false ? (
        <Null />
      ) : select ? (
        <Container sx={{ py: 3 }}>
          <Grid container spacing={2}>
            <RuleContent {...{ select }} />
            <Result {...{ select }} />
          </Grid>
        </Container>
      ) : (
        <UnSelect />
      )}
    </Box>
  );
}
