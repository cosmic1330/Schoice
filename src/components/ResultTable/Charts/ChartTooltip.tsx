import { Box, Stack, Typography } from "@mui/material";
import { IndicatorColorType } from "../types";

export default function ChartTooltip({
  value,
}: {
  value: IndicatorColorType[];
}) {
  return (
    <Box>
      {value.map((v) => (
        <Stack key={v.key} direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: v.color,
            }}
          />
          <Typography variant="body2" component="span">
            {v.key}
          </Typography>
        </Stack>
      ))}
    </Box>
  );
}
