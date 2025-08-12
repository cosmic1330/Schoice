import { Container, Stack, Typography } from "@mui/material";

export default function UnSelect() {
  return (
    <Container>
      <Stack alignItems="center" justifyContent="center" height="100%" spacing={2}>
        <img src="failure.svg" width={100} />
        <Typography variant="h6">請選擇一個策略</Typography>
      </Stack>
    </Container>
  );
}
