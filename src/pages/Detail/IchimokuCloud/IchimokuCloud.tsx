import { Box, CircularProgress, Container, Stack } from "@mui/material";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { DealsContext } from "../../../context/DealsContext";
import { UrlTaPerdOptions } from "../../../types";
import IchimokuChart from "./components/IchimokuChart";
import { useIchimokuData } from "./useIchimokuData";
import useIndicatorSettings from "../../../hooks/useIndicatorSettings";
import IchimokuHeader from "./components/IchimokuHeader";

export default function Ichimoku({ perd }: { perd: UrlTaPerdOptions }) {
  const deals = useContext(DealsContext);
  const { settings } = useIndicatorSettings();

  // --- Zoom & Pan Logic ---
  const [visibleCount, setVisibleCount] = useState(120);
  const [rightOffset, setRightOffset] = useState(0);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const startOffset = useRef(0);

  const [activeStep, setActiveStep] = useState(0);

  // Hook for Data Processing
  const { chartData, signals } = useIchimokuData(
    deals,
    perd,
    visibleCount,
    rightOffset,
    settings,
    null // Disable hover analysis
  );

  // Handle Zoom & Pan Interactions
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = Math.sign(e.deltaY);
      const step = 5;

      setVisibleCount((prev) => {
        const next = prev + delta * step;
        const minBars = 52;
        const maxBars = deals.length > 0 ? deals.length + 26 : 1000;
        if (next < minBars) return minBars;
        if (next > maxBars) return maxBars;
        return next;
      });
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastX.current = e.clientX;
      startOffset.current = rightOffset;
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const deltaX = e.clientX - lastX.current;
      const sensitivity = visibleCount / (container.clientWidth || 500);
      const barDelta = Math.round(deltaX * sensitivity * 1.5);
      if (barDelta === 0) return;

      setRightOffset((prev) => {
        let next = prev + barDelta;
        if (next < 0) next = 0;
        const maxOffset = Math.max(0, deals.length + 26 - visibleCount);
        if (next > maxOffset) next = maxOffset;
        return next;
      });
      lastX.current = e.clientX;
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [deals.length, visibleCount, rightOffset]);

  // Safety Clamp for rightOffset
  useEffect(() => {
    const maxOffset = Math.max(0, deals.length + 26 - visibleCount);
    if (rightOffset > maxOffset) {
      setRightOffset(maxOffset);
    }
  }, [deals.length, visibleCount, rightOffset]);

  const timeframeLabel = useMemo(() => {
    switch (perd) {
      case UrlTaPerdOptions.Day: return "未來一月";
      case UrlTaPerdOptions.Hour: return "下週趨勢";
      case UrlTaPerdOptions.Week: return "未來半年";
      default: return "未來26期";
    }
  }, [perd]);

  if (chartData.length === 0) {
    return (
      <Box height="100vh" display="flex" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container
      component="main"
      maxWidth={false}
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        pt: 1,
        px: 2,
        pb: 1,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <IchimokuHeader
          activeStep={activeStep}
          steps={[]}
          onStepChange={setActiveStep}
        />
      </Stack>

      <IchimokuChart
        ref={chartContainerRef}
        data={chartData}
        signals={signals}
        cmfEmaPeriod={settings.cmfEma}
        timeframeLabel={timeframeLabel}
      />
    </Container>
  );
}
