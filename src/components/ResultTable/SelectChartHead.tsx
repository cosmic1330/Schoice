import { Box, Menu, MenuItem, Typography } from "@mui/material";
import useSchoiceStore, { ChartType } from "../../store/Schoice.store";
import { useState } from "react";

export default function SelectChartHead() {
  const { chartType, changeChartType } = useSchoiceStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlehandleMenuItemClick = (value: ChartType) => {
    handleClose();
    changeChartType(value);
  };
  return (
    <Box>
      <Typography component="span" variant="button" onClick={handleClick} sx={{ cursor: "pointer" }}>
        {chartType}{" "}🔽
      </Typography>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        {Object.entries(ChartType).map(([key, value]) => (
          <MenuItem
            key={key}
            disabled={chartType === value}
            selected={chartType === value}
            onClick={() => handlehandleMenuItemClick(value)}
          >
            {value}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
