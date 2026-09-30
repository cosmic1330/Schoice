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
        spacing={2}
        sx={{ position: "relative" }}
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
              width: 230,
              height: 80,
              filter: "blur(25px)",
              borderRadius: "50%",
              zIndex: -1,
              bgcolor: "secondary.main",
              opacity: 0.32,
            },
          }}
        >
          <Box
            component="img"
            src="/schoice-mascot-v2.png"
            alt="Schoice mascot"
            sx={{
              width: { xs: 170, md: 220 },
              maxHeight: 270,
              objectFit: "contain",
              filter: "drop-shadow(6px 7px 0 rgba(32,32,39,.22))",
              transform: "rotate(-2deg)",
            }}
          />
        </Box>
        <Box
          sx={{
            bgcolor: "background.paper",
            border: "3px solid #202027",
            borderRadius: "24px",
            px: 3,
            py: 1.5,
            boxShadow: "5px 5px 0 #202027",
            transform: "rotate(1deg)",
            position: "relative",
            "&::after": {
              content: '""',
              position: "absolute",
              width: 16,
              height: 16,
              left: 28,
              top: -11,
              bgcolor: "background.paper",
              borderLeft: "3px solid #202027",
              borderTop: "3px solid #202027",
              transform: "rotate(45deg)",
            },
          }}
        >
          <Typography variant="h6" fontWeight={900} textAlign="center">
            {t("Pages.Schoice.PromptList.content.unSelect")}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 0.5 }}>
            從左邊挑一個策略，開始今天的選股冒險！
          </Typography>
        </Box>
      </Stack>
    </Container>
  );
}
