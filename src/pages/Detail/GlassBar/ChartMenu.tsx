import React from "react";
import { Box, IconButton, Stack, Button } from "@mui/material";
import { ShowChart } from "@mui/icons-material";
import { MenuPopup, MenuContent } from "./StyledComponents";

interface ChartMenuProps {
  current: number;
  goToSlide: (index: number) => void;
}

const charts = [
  { label: "布林", idx: 0 },
  { label: "MA", idx: 1 },
  { label: "EMA", idx: 2 },
  { label: "OBV", idx: 3 },
  { label: "MJ", idx: 4 },
  { label: "MR", idx: 5 },
  { label: "KD", idx: 6 },
  { label: "MFI", idx: 7 },
  { label: "一目", idx: 8 },
];

const ChartMenu: React.FC<ChartMenuProps> = ({ current, goToSlide }) => {
  return (
    <Box
      sx={{
        position: "relative",
        "&:hover .chart-list": {
          display: "flex",
          opacity: 1,
          transform: "translateX(0)",
        },
      }}
    >
      <IconButton
        size="small"
        sx={{
          color: "rgba(255,255,255,0.5)",
          "&:hover": { color: "#fff" },
        }}
      >
        <ShowChart fontSize="small" />
      </IconButton>
      <MenuPopup className="chart-list">
        <MenuContent>
          <Stack spacing={0.5}>
            {charts.map((opt) => (
              <Button
                key={opt.idx}
                size="small"
                onClick={() => goToSlide(opt.idx)}
                sx={{
                  minWidth: "80px",
                  justifyContent: "flex-start",
                  color:
                    current === opt.idx ? "#fff" : "rgba(255, 255, 255, 0.6)",
                  bgcolor:
                    current === opt.idx
                      ? "rgba(255, 255, 255, 0.1)"
                      : "transparent",
                  fontSize: "10px",
                  px: 1,
                  py: 0.5,
                  borderRadius: "4px",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.15)",
                    color: "#fff",
                  },
                }}
              >
                {opt.label}
              </Button>
            ))}
          </Stack>
        </MenuContent>
      </MenuPopup>
    </Box>
  );
};

export default ChartMenu;
