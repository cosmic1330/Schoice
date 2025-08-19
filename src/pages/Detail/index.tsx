import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { Box, Button, IconButton } from "@mui/material";
import { listen } from "@tauri-apps/api/event";
import { AnimatePresence, motion, Variants } from "framer-motion";
import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router";
import useSWR from "swr";
import { DealsContext } from "../../context/DealsContext";
import { tauriFetcher } from "../../tools/http";
import { UrlTaPerdOptions, UrlType } from "../../types";
import analyzeIndicatorsData, {
  IndicatorsDateTimeType,
} from "../../utils/analyzeIndicatorsData";
import generateDealDataDownloadUrl from "../../utils/generateDealDataDownloadUrl";

// lazy load components
const MaKbar = lazy(() => import("./MaKbar"));
const AvgMaKbar = lazy(() => import("./AvgMaKbar"));
const Obv = lazy(() => import("./Obv"));
const Ma = lazy(() => import("./Ma"));
const MJ = lazy(() => import("./MJ"));
const MR = lazy(() => import("./MR"));
const Kd = lazy(() => import("./Kd"));

const FullscreenVerticalCarousel: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [scrolling, setScrolling] = useState(false);
  const [perd, setPerd] = useState<UrlTaPerdOptions>(
    (localStorage.getItem("detail:perd:type") as UrlTaPerdOptions) ||
      UrlTaPerdOptions.Hour
  );

  // slides 需依賴 perd，移到 useMemo 內
  const slides = useMemo(
    () => [
      { id: "ma", content: <Ma /> },
      { id: "ma_k", content: <MaKbar perd={perd} /> },
      { id: "avg_k", content: <AvgMaKbar /> },
      { id: "mj", content: <MJ /> },
      { id: "mr", content: <MR /> },
      { id: "kd", content: <Kd /> },
      { id: "obv", content: <Obv perd={perd} /> },
    ],
    [perd]
  );

  const goToSlide = useCallback(
    (index: number) => {
      if (index >= 0 && index < slides.length) {
        setCurrent(index);
      } else if (index < 0) {
        setCurrent(slides.length - 1);
      } else if (index >= slides.length) {
        setCurrent(0);
      }
    },
    [slides.length]
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (scrolling) return;
      setScrolling(true);

      if (e.deltaY > 0) {
        goToSlide(current + 1);
      } else if (e.deltaY < 0) {
        goToSlide(current - 1);
      }

      setTimeout(() => setScrolling(false), 800);
    },
    [current, scrolling, goToSlide]
  );

  useEffect(() => {
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const slideVariants: Variants = {
    initial: (direction: number) => ({
      y: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    animate: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: "easeInOut" }, 
    },
    exit: (direction: number) => ({
      y: direction > 0 ? "-100%" : "100%",
      opacity: 0,
      transition: { duration: 0.3, ease: "easeInOut" }, 
    }),
  };

  const direction = (next: number) => next - current;

  // data
  const navigate = useNavigate();

  useEffect(() => {
    const unlisten = listen("detail", (event: any) => {
      const { url } = event.payload;
      navigate(url);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [navigate]);

  const { id } = useParams();

  const { data } = useSWR(
    generateDealDataDownloadUrl({
      type: UrlType.Indicators,
      id: encodeURIComponent(id as string),
      perd,
    }),
    tauriFetcher
  );

  const deals = useMemo(() => {
    if (!data || !id || typeof data !== "string") return [];
    return analyzeIndicatorsData(
      data,
      perd === UrlTaPerdOptions.Hour
        ? IndicatorsDateTimeType.DateTime
        : IndicatorsDateTimeType.Date
    );
  }, [data, id, perd]);

  return (
    <Box position="relative" width="100vw" height="100vh" overflow="hidden">
      <DealsContext.Provider value={deals}>
        <AnimatePresence custom={direction(current)} mode="wait">
          <motion.div
            key={slides[current].id}
            custom={direction(current)} // ✅ 把 direction 傳進去
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Suspense fallback={<div>Loading...</div>}>
              {slides[current].content}
            </Suspense>
          </motion.div>
        </AnimatePresence>

        <Box position="absolute" right="0%">
          <Button
            color="primary"
            sx={{
              backgroundColor: "rgba(255,255,255,0.3)",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.5)" },
            }}
            variant={perd === UrlTaPerdOptions.Hour ? "contained" : "text"}
            disabled={perd === UrlTaPerdOptions.Hour}
            onClick={() => {
              localStorage.setItem("detail:perd:type", UrlTaPerdOptions.Hour);
              setPerd(UrlTaPerdOptions.Hour);
            }}
          >
            小時圖
          </Button>
          <Button
            color="primary"
            sx={{
              backgroundColor: "rgba(255,255,255,0.3)",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.5)" },
            }}
            variant={perd === UrlTaPerdOptions.Day ? "contained" : "text"}
            disabled={perd === UrlTaPerdOptions.Day}
            onClick={() => {
              localStorage.setItem("detail:perd:type", UrlTaPerdOptions.Day);
              setPerd(UrlTaPerdOptions.Day);
            }}
          >
            日線圖
          </Button>
          <IconButton
            onClick={() => goToSlide(current - 1)}
            color="primary"
            sx={{
              backgroundColor: "rgba(255,255,255,0.3)",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.5)" },
            }}
          >
            <KeyboardArrowUp />
          </IconButton>
          <IconButton
            onClick={() => goToSlide(current + 1)}
            color="primary"
            sx={{
              backgroundColor: "rgba(255,255,255,0.3)",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.5)" },
            }}
          >
            <KeyboardArrowDown />
          </IconButton>
        </Box>
      </DealsContext.Provider>
    </Box>
  );
};

export default FullscreenVerticalCarousel;
