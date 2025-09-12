import { Box, Chip, Divider, Typography } from "@mui/material";
import { StockTableType } from "../../../types";

interface StockHeaderProps {
  stock: StockTableType;
}

export default function StockHeader({ stock }: StockHeaderProps) {
  return (
    <>
      <Box sx={{ mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0.5 }}>
          {stock.stock_name}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            label={stock.stock_id}
            size="small"
            variant="outlined"
            color="primary"
          />
          <Chip
            label={stock.market_type}
            size="small"
            color={stock.market_type === "上市" ? "success" : "info"}
          />
        </Box>
      </Box>
      <Divider sx={{ mb: 1 }} />
    </>
  );
}