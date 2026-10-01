import { Box, Stack, Typography, alpha } from "@mui/material";
import type { ReactNode } from "react";

type SettingSectionProps = {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  tone?: "primary" | "secondary" | "warning" | "error";
  children: ReactNode;
};

export default function SettingSection({
  icon,
  eyebrow,
  title,
  description,
  tone = "primary",
  children,
}: SettingSectionProps) {
  return (
    <Box component="section">
      <Stack direction="row" spacing={1.5} alignItems="flex-start" mb={2}>
        <Box
          sx={{
            width: 42,
            height: 42,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            border: "2px solid",
            borderColor: "text.primary",
            borderRadius: 3,
            color: `${tone}.contrastText`,
            bgcolor: `${tone}.main`,
            boxShadow: (theme) => `3px 3px 0 ${theme.palette.text.primary}`,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography
            variant="overline"
            sx={{ color: `${tone}.main`, fontWeight: 900, lineHeight: 1.2 }}
          >
            {eyebrow}
          </Typography>
          <Typography variant="h5" sx={{ lineHeight: 1.15 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {description}
          </Typography>
        </Box>
      </Stack>

      <Box
        sx={{
          "& .setting-card": {
            height: "100%",
            display: "flex",
            flexDirection: "column",
            bgcolor: "background.paper",
            transition: "transform .18s ease, box-shadow .18s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: (theme) =>
                `6px 7px 0 ${alpha(theme.palette.text.primary, 0.9)}`,
            },
            "& .MuiCardContent-root": { flex: 1, p: { xs: 2.25, sm: 3 } },
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
