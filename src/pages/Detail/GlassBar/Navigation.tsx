import {
  DragIndicator,
  KeyboardArrowDown,
  KeyboardArrowUp,
  UnfoldLess,
  UnfoldMore,
} from "@mui/icons-material";
import { Box, IconButton } from "@mui/material";
import React from "react";
import { NavIconButton } from "./StyledComponents";

interface NavigationProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  current: number;
  goToSlide: (index: number) => void;
}

const Navigation: React.FC<NavigationProps> = ({
  isCollapsed,
  setIsCollapsed,
  current,
  goToSlide,
}) => {
  return (
    <>
      {/* Drag Handle */}
      <Box
        sx={{
          cursor: "grab",
          display: "flex",
          justifyContent: "center",
          width: "100%",
          py: 0.2,
        }}
      >
        <DragIndicator
          style={{ fontSize: 16, color: "rgba(255,255,255,0.3)" }}
        />
      </Box>

      {/* Collapse Toggle */}
      <IconButton
        onClick={() => setIsCollapsed(!isCollapsed)}
        size="small"
        sx={{
          p: 0.5,
          color: "rgba(255,255,255,0.5)",
          "&:hover": {
            color: "#fff",
            bgcolor: "rgba(255,255,255,0.1)",
          },
        }}
      >
        {isCollapsed ? (
          <UnfoldMore fontSize="small" />
        ) : (
          <UnfoldLess fontSize="small" />
        )}
      </IconButton>

      {!isCollapsed && (
        <>
          <Box
            sx={{
              width: "20px",
              height: "1px",
              backgroundColor: "rgba(255,255,255,0.1)",
              my: 0.5,
            }}
          />
          {/* Navigation Arrows */}
          <NavIconButton onClick={() => goToSlide(current - 1)} size="small">
            <KeyboardArrowUp fontSize="small" />
          </NavIconButton>
          <NavIconButton onClick={() => goToSlide(current + 1)} size="small">
            <KeyboardArrowDown fontSize="small" />
          </NavIconButton>
        </>
      )}
    </>
  );
};

export default Navigation;
