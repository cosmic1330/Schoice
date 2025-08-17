import { Typography } from "@mui/material";

export default function Process({ percent }: { percent: number }) {
  return (
    <Typography variant="body2" color="text.secondary" component="span">
      {`下載中 ${percent}%`}
    </Typography>
  );
}
