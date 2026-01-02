import { Box, Container, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function UnSelect() {
  const { t } = useTranslation();
  return (
    <Container sx={{ height: "100%" }}>
      <Stack
        alignItems="center"
        justifyContent="center"
        height="100%"
        spacing={3}
      >
        <Box
          sx={{
            position: "relative",
            "&::after": {
              content: '""',
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 120,
              height: 120,
              filter: "blur(30px)",
              borderRadius: "50%",
              zIndex: -1,
            },
          }}
        >
          <img src="failure.svg" width={120} style={{ opacity: 0.8 }} />
        </Box>
        <Typography
          variant="h5"
          fontWeight={900}
          sx={{
            letterSpacing: "0.1em",
            fontFamily: "monospace",
            opacity: 0.8,
            textTransform: "uppercase",
          }}
        >
          {t("Pages.Schoice.PromptList.content.unSelect")}
        </Typography>
      </Stack>
    </Container>
  );
}
