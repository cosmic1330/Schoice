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
        p: { xs: 1, md: 2 },
      }}
    >
      {data_count === 0 && false ? (
        <Null />
      ) : select ? (
        <Container
          sx={{
            py: 2,
            bgcolor: "background.paper",
            border: "2px solid #202027",
            borderRadius: "26px",
            boxShadow: "6px 6px 0 rgba(32,32,39,.16)",
            minHeight: "calc(100% - 16px)",
          }}
        >
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
