import { Container, Stack, Typography } from "@mui/material";

export default function Null() {
  return (
    <Container>
      <Stack
        alignItems="center"
        justifyContent="center"
        height="100%"
        spacing={2}
      >
        <img src="click_update.svg" width={100} />
        <Typography variant="h6">缺少交易資料</Typography>
        <Typography variant="subtitle1" color="textSecondary">
          請先點選右上角Update按鈕，下載最新交易資料
        </Typography>
      </Stack>
    </Container>
  );
}
