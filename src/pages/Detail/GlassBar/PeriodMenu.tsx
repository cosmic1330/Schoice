import { Box } from "@mui/material";
import React from "react";
import { UrlTaPerdOptions } from "../../../types";
import { ControlButton, MenuContent, MenuPopup } from "./StyledComponents";

interface PeriodMenuProps {
  perd: UrlTaPerdOptions;
  setPerd: (perd: UrlTaPerdOptions) => void;
  isCollapsed: boolean;
}

const PeriodMenu: React.FC<PeriodMenuProps> = ({
  perd,
  setPerd,
  isCollapsed,
}) => {
  const handleSetPerd = (newPerd: UrlTaPerdOptions) => {
    localStorage.setItem("detail:perd:type", newPerd);
    setPerd(newPerd);
  };

  const options = [
    { label: "小時", value: UrlTaPerdOptions.Hour },
    { label: "日線", value: UrlTaPerdOptions.Day },
    { label: "週線", value: UrlTaPerdOptions.Week },
  ];

  if (isCollapsed) {
    return (
      <Box
        sx={{
          position: "relative",
          cursor: "pointer",
          "&:hover .period-list": {
            display: "flex",
            opacity: 1,
            transform: "translateX(0)",
          },
        }}
      >
        <Box
          sx={{
            fontSize: "10px",
            color: "#90caf9",
            fontWeight: "bold",
            writingMode: "vertical-rl",
            textOrientation: "upright",
            letterSpacing: "2px",
            py: 1,
          }}
        >
          {perd === UrlTaPerdOptions.Hour
            ? "小時"
            : perd === UrlTaPerdOptions.Week
            ? "週線"
            : "日線"}
        </Box>
        <MenuPopup className="period-list">
          <MenuContent>
            {options.map((opt) => (
              <ControlButton
                key={opt.value}
                active={perd === opt.value}
                onClick={() => handleSetPerd(opt.value)}
                sx={{
                  justifyContent: "flex-start",
                  width: "100%",
                  fontSize: "10px",
                  px: 1,
                  py: 0.5,
                }}
              >
                {opt.label}
              </ControlButton>
            ))}
          </MenuContent>
        </MenuPopup>
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          width: "20px",
          height: "1px",
          backgroundColor: "rgba(255,255,255,0.1)",
          my: 0.5,
        }}
      />
      {options.map((opt) => (
        <ControlButton
          key={opt.value}
          active={perd === opt.value}
          onClick={() => handleSetPerd(opt.value)}
        >
          {opt.label}
        </ControlButton>
      ))}
    </>
  );
};

export default PeriodMenu;
