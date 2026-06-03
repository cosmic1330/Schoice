import { ShowChart } from "@mui/icons-material";
import { IconButton, Menu, MenuItem, Typography } from "@mui/material";
import React, { useState } from "react";
import { CHART_CONFIG } from "../constants/chartConfig";

interface ChartMenuProps {
  current: number;
  goToSlide: (index: number) => void;
}

const charts = CHART_CONFIG.map((cfg, idx) => ({
  label: cfg.label,
  idx,
}));

const ChartMenu: React.FC<ChartMenuProps> = ({ current, goToSlide }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (idx: number) => {
    goToSlide(idx);
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{
          color: open ? "#fff" : "rgba(255,255,255,0.5)",
          bgcolor: open ? "rgba(255, 255, 255, 0.1)" : "transparent",
          "&:hover": { color: "#fff", bgcolor: "rgba(255, 255, 255, 0.05)" },
        }}
      >
        <ShowChart fontSize="small" />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "center",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "center",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            sx: {
              ml: 1.5,
              bgcolor: "rgba(30, 30, 40, 0.9)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.5)",
              p: 0.5,
              minWidth: 100,
            },
          },
        }}
      >
        {charts.map((opt) => (
          <MenuItem
            key={opt.idx}
            onClick={() => handleSelect(opt.idx)}
            selected={current === opt.idx}
            sx={{
              borderRadius: "6px",
              mx: 0.5,
              my: 0.2,
              py: 0.8,
              "&.Mui-selected": {
                bgcolor: "rgba(144, 202, 249, 0.15)",
                color: "primary.main",
                "&:hover": { bgcolor: "rgba(144, 202, 249, 0.25)" },
              },
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)" },
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontWeight: current === opt.idx ? 600 : 400 }}
            >
              {opt.label}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ChartMenu;
