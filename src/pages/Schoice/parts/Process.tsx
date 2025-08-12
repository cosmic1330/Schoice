import { Typography } from "@mui/material";

export default function Process({ persent }: { persent: number }) {
  return (
    <Typography variant="body2" color="text.secondary">
      {`下載中 ${persent}%`}
    </Typography>
  );
}
