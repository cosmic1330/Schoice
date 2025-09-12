import { Typography } from "@mui/material";

interface SectionHeaderProps {
  title: string;
  emoji: string;
  color: 'primary' | 'info' | 'warning' | 'error' | 'success';
}

export default function SectionHeader({ title, emoji, color }: SectionHeaderProps) {
  return (
    <Typography
      variant="subtitle2"
      sx={{
        mb: 1.5,
        fontWeight: "bold",
        color: `${color}.main`,
        borderBottom: 1,
        borderColor: `${color}.light`,
        pb: 0.5,
      }}
    >
      {emoji} {title}
    </Typography>
  );
}