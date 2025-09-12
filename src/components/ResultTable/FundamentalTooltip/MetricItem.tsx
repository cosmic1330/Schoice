import { Box, Typography } from "@mui/material";
import { formatValue, getValueColor } from "./formatters";

interface MetricItemProps {
  label: string;
  value: any | [any, any] | [any, any, any];
  suffix?: string;
  decimals?: number;
  colorRule?: 'positive_green' | 'negative_red' | 'both_red_when_negative';
  flex?: boolean;
  multiColor?: boolean; // 新增：是否需要多色顯示
}

export default function MetricItem({
  label,
  value,
  suffix = "",
  decimals = 2,
  colorRule = 'positive_green',
  flex = true,
  multiColor = false,
}: MetricItemProps) {
  // 如果需要多色顯示且是陣列
  if (multiColor && Array.isArray(value)) {
    const coloredValues = value.map((v) => ({
      text: formatValue(v, suffix, decimals),
      color: getValueColor(v, colorRule),
    }));

    return (
      <Box
        sx={{
          display: flex ? "flex" : "block",
          justifyContent: flex ? "space-between" : "flex-start",
          mb: 0.3,
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: "0.7rem" }}
        >
          {label}:
        </Typography>
        <Box sx={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 0.5,
          ...(flex ? {} : { mt: 0.2 }) 
        }}>
          {coloredValues.map((item, index) => (
            <Box key={index} sx={{ display: "flex", alignItems: "center" }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: "medium",
                  color: item.color,
                  fontSize: "0.7rem",
                }}
              >
                {item.text}
              </Typography>
              {index < coloredValues.length - 1 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.7rem", mx: 0.3 }}
                >
                  /
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  // 原本的單色顯示
  return (
    <Box
      sx={{
        display: flex ? "flex" : "block",
        justifyContent: flex ? "space-between" : "flex-start",
        mb: 0.3,
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontSize: "0.7rem" }}
      >
        {label}:
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontWeight: "medium",
          color: getValueColor(value, colorRule),
          fontSize: "0.7rem",
          ...(flex ? {} : { display: "block", mt: 0.2 }),
        }}
      >
        {formatValue(value, suffix, decimals)}
      </Typography>
    </Box>
  );
}