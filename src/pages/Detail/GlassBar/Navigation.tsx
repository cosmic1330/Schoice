import {
  DragIndicator,
  HelpOutline,
  KeyboardArrowDown,
  KeyboardArrowUp,
  UnfoldLess,
  UnfoldMore,
} from "@mui/icons-material";
import { Box, IconButton, Tooltip } from "@mui/material";
import React from "react";
import { NavIconButton } from "./StyledComponents";

import { CHART_CONFIG } from "../constants/chartConfig";

interface NavigationProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  current: number;
  goToSlide: (index: number) => void;
  onOpenDoc: () => void;
  currentId: string;
}

const TIMEZONE_ALIGNMENT_MAP: Record<string, string> = CHART_CONFIG.reduce(
  (acc, cfg) => ({ ...acc, [cfg.id]: cfg.timezoneAdvice }),
  {},
);

const Navigation: React.FC<NavigationProps> = ({
  isCollapsed,
  setIsCollapsed,
  current,
  goToSlide,
  onOpenDoc,
  currentId,
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

      {/* Info/Help Button with Tooltip */}
      <Tooltip
        title={
          <Box sx={{ p: 0.5 }}>
            <Box
              sx={{
                fontWeight: "bold",
                mb: 0.5,
                borderBottom: "1px solid rgba(255,255,255,0.2)",
                pb: 0.5,
              }}
            >
              時區對齊建議
            </Box>
            <Box sx={{ fontSize: "0.75rem", lineHeight: 1.4 }}>
              {TIMEZONE_ALIGNMENT_MAP[currentId] || "點擊查看文件"}
            </Box>
          </Box>
        }
        placement="right"
        arrow
        componentsProps={{
          tooltip: {
            sx: {
              bgcolor: "rgba(20, 25, 35, 0.95)",
              color: "#fff",
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)",
              maxWidth: 250,
            },
          },
          arrow: {
            sx: {
              color: "rgba(20, 25, 35, 0.95)",
            },
          },
        }}
      >
        <IconButton
          onClick={onOpenDoc}
          size="small"
          sx={{
            p: 0.5,
            color: "primary.main",
            "&:hover": {
              color: "#fff",
              bgcolor: "rgba(144, 202, 249, 0.1)",
            },
          }}
        >
          <HelpOutline fontSize="small" />
        </IconButton>
      </Tooltip>

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
