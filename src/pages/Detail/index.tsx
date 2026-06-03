import { Box, createTheme, styled, ThemeProvider } from "@mui/material";
import { listen } from "@tauri-apps/api/event";
import { AnimatePresence, motion, Variants } from "framer-motion";
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router";
import useSWR from "swr";
import { tauriFetcher } from "../../tools/http";
import DocModal from "../../components/DocModal";
import { DealsContext } from "../../context/DealsContext";
import { FutureIds, UrlTaPerdOptions, UrlType } from "../../types";
import {
  analyzeIndicatorsData,
  analyzeNasdaqIndicatorsData,
  IndicatorsDateTimeType,
} from "../../utils/analyzeIndicatorsData";
import generateDealDataDownloadUrl from "../../utils/generateDealDataDownloadUrl";
import GlassBar from "./GlassBar";
import { CHART_CONFIG } from "./constants/chartConfig";

const PageContainer = styled(Box)`
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background-color: #0f1214;
  background-image:
    radial-gradient(at 0% 0%, hsla(253, 16%, 7%, 1) 0, transparent 50%),
    radial-gradient(at 50% 0%, hsla(225, 39%, 25%, 1) 0, transparent 50%),
    radial-gradient(at 100% 0%, hsla(339, 49%, 25%, 1) 0, transparent 50%),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E");
  background-size:
    100% 100%,
    100% 100%,
    100% 100%,
    200px 200px;
  background-repeat: no-repeat, no-repeat, no-repeat, repeat;
`;

// Create a dark theme instance
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#90caf9",
    },
    background: {
      default: "transparent",
      paper: "rgba(30, 30, 40, 0.6)",
    },
    text: {
      primary: "#ffffff",
      secondary: "rgba(255, 255, 255, 0.7)",
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(30, 30, 40, 0.6)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        },
      },
    },
  },
});

const FullscreenVerticalCarousel: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [scrolling, setScrolling] = useState(false);
  const [perd, setPerd] = useState<UrlTaPerdOptions>(
    (localStorage.getItem("detail:perd:type") as UrlTaPerdOptions) ||
      UrlTaPerdOptions.Hour,
  );
  const { id } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const pageRef = useRef(null);

  // Shared zoom and pan state
  const [visibleCount, setVisibleCount] = useState(120);
  const [rightOffset, setRightOffset] = useState(0);

  // Documentation modal state
  const [isDocOpen, setIsDocOpen] = useState(false);

  const docMap = useMemo(() => {
    const map: Record<string, { title: string; content: string }> = {};
    CHART_CONFIG.forEach((cfg) => {
      map[cfg.id] = { title: cfg.title, content: cfg.docContent };
    });
    return map;
  }, []);

  const handleSetPerd = useCallback((newPerd: UrlTaPerdOptions) => {
    localStorage.setItem("detail:perd:type", newPerd);
    setPerd(newPerd);
  }, []);

  const slides = useMemo(
    () =>
      CHART_CONFIG.map((cfg) => ({
        id: cfg.id,
        content: cfg.component({
          perd,
          visibleCount,
          setVisibleCount,
          rightOffset,
          setRightOffset,
        }),
      })),
    [perd, visibleCount, rightOffset],
  );

  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < slides.length) {
      setCurrent(index);
    } else if (index < 0) {
      setCurrent(slides.length - 1);
    } else if (index >= slides.length) {
      setCurrent(0);
    }
  }, [slides.length]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (scrolling || isDocOpen) return;
      setScrolling(true);

      if (e.deltaY > 0) {
        goToSlide(current + 1);
      } else if (e.deltaY < 0) {
        goToSlide(current - 1);
      }

      setTimeout(() => setScrolling(false), 800);
    },
    [current, scrolling, goToSlide, isDocOpen],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (scrolling || isDocOpen) return;

      if (e.key === "ArrowUp") {
        goToSlide(current - 1);
      } else if (e.key === "ArrowDown") {
        goToSlide(current + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const options = [
          UrlTaPerdOptions.Hour,
          UrlTaPerdOptions.Day,
          UrlTaPerdOptions.Week,
        ];
        const idx = options.indexOf(perd);
        if (e.key === "ArrowLeft") {
          if (idx > 0) {
            handleSetPerd(options[idx - 1]);
          }
        } else if (e.key === "ArrowRight") {
          if (idx < options.length - 1) {
            handleSetPerd(options[idx + 1]);
          }
        }
      }
    },
    [current, scrolling, goToSlide, perd, handleSetPerd, isDocOpen],
  );

  useEffect(() => {
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleWheel, handleKeyDown]);

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
    let unlisten: (() => void) | null = null;
    const setup = async () => {
      unlisten = await listen("detail", (event: any) => {
        const { url } = event.payload;
        navigate(url);
      });
    };
    setup();
    return () => {
      if (unlisten) unlisten();
    };
  }, [navigate]);

  const { data } = useSWR(
    id === FutureIds.NASDAQ_FUTURE
      ? `https://query1.finance.yahoo.com/v8/finance/chart/${
          FutureIds.NASDAQ_FUTURE
        }?interval=${
          perd === UrlTaPerdOptions.Hour
            ? "1h"
            : perd === UrlTaPerdOptions.Week
              ? "1wk"
              : "1d"
        }&range=${
          perd === UrlTaPerdOptions.Hour
            ? "730d"
            : perd === UrlTaPerdOptions.Week
              ? "5y"
              : "10y"
        }`
      : generateDealDataDownloadUrl({
          type: UrlType.Indicators,
          id: encodeURIComponent(id as string),
          perd,
        }),
    tauriFetcher,
  );

  const deals = useMemo(() => {
    if (!data || !id || typeof data !== "string") return [];
    return id === FutureIds.NASDAQ_FUTURE
      ? analyzeNasdaqIndicatorsData(
          data,
          perd === UrlTaPerdOptions.Hour
            ? IndicatorsDateTimeType.DateTime
            : IndicatorsDateTimeType.Date,
        )
      : analyzeIndicatorsData(
          data,
          perd === UrlTaPerdOptions.Hour
            ? IndicatorsDateTimeType.DateTime
            : IndicatorsDateTimeType.Date,
        );
  }, [data, id, perd]);

  return (
    <ThemeProvider theme={darkTheme}>
      <PageContainer ref={pageRef}>
        <DealsContext.Provider value={deals}>
          <AnimatePresence custom={direction(current)} mode="wait">
            <motion.div
              key={slides[current].id}
              custom={direction(current)}
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

          <GlassBar
            perd={perd}
            setPerd={setPerd}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            current={current}
            goToSlide={goToSlide}
            pageRef={pageRef}
            onOpenDoc={() => setIsDocOpen(true)}
            currentId={slides[current]?.id || ""}
          />

          <DocModal
            open={isDocOpen}
            onClose={() => setIsDocOpen(false)}
            title={
              docMap[slides[current]?.id as keyof typeof docMap]?.title || "文件"
            }
            markdown={
              docMap[slides[current]?.id as keyof typeof docMap]?.content || ""
            }
          />
        </DealsContext.Provider>
      </PageContainer>
    </ThemeProvider>
  );
};

export default FullscreenVerticalCarousel;
