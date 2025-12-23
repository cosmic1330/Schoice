import React from "react";
import { Stack } from "@mui/material";
import { UrlTaPerdOptions } from "../../../types";
import { GlassBarContainer } from "./StyledComponents";
import ChartMenu from "./ChartMenu";
import PeriodMenu from "./PeriodMenu";
import Navigation from "./Navigation";

interface GlassBarProps {
  perd: UrlTaPerdOptions;
  setPerd: (perd: UrlTaPerdOptions) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  current: number;
  goToSlide: (index: number) => void;
  pageRef: React.RefObject<any>;
}

const GlassBar: React.FC<GlassBarProps> = ({
  perd,
  setPerd,
  isCollapsed,
  setIsCollapsed,
  current,
  goToSlide,
  pageRef,
}) => {
  return (
    <GlassBarContainer
      drag
      dragMomentum={false}
      dragConstraints={pageRef}
      initial={{ x: 0, opacity: 0.9 }}
      whileHover={{ opacity: 1 }}
      animate={{
        width: isCollapsed ? "auto" : "auto",
        transition: { type: "spring", stiffness: 300, damping: 30 },
      }}
    >
      <Stack spacing={1} alignItems="center">
        <Navigation
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          current={current}
          goToSlide={goToSlide}
        />

        {isCollapsed && <ChartMenu current={current} goToSlide={goToSlide} />}

        <PeriodMenu perd={perd} setPerd={setPerd} isCollapsed={isCollapsed} />
      </Stack>
    </GlassBarContainer>
  );
};

export default GlassBar;
