import { Box, createTheme, styled, ThemeProvider } from "@mui/material";
import { listen } from "@tauri-apps/api/event";
import { AnimatePresence, motion, Variants } from "framer-motion";
import React, {
  lazy,
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
import { DealsContext } from "../../context/DealsContext";
import { FutureIds, UrlTaPerdOptions, UrlType } from "../../types";
import {
  analyzeIndicatorsData,
  analyzeNasdaqIndicatorsData,
  IndicatorsDateTimeType,
} from "../../utils/analyzeIndicatorsData";
import generateDealDataDownloadUrl from "../../utils/generateDealDataDownloadUrl";
import Bollean from "./Bollean/Bollean";
import AvgMaKbar from "./Ema/EmaKbar";
import GlassBar from "./GlassBar";

// lazy load components
const MaKbar = lazy(() => import("./Ma/MaKbar"));
const Obv = lazy(() => import("./Obv/Obv"));
const IchimokuCloud = lazy(() => import("./IchimokuCloud/IchimokuCloud"));
const MJ = lazy(() => import("./Mj/MJ"));
const MR = lazy(() => import("./Mr/MR"));
const Kd = lazy(() => import("./Kd/Kd"));
const Mfi = lazy(() => import("./Mfi/Mfi"));

const PageContainer = styled(Box)`
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background-color: #0f1214;
  background-image: radial-gradient(
      at 0% 0%,
      hsla(253, 16%, 7%, 1) 0,
      transparent 50%
    ),
    radial-gradient(at 50% 0%, hsla(225, 39%, 25%, 1) 0, transparent 50%),
    radial-gradient(at 100% 0%, hsla(339, 49%, 25%, 1) 0, transparent 50%),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E");
  background-size: 100% 100%, 100% 100%, 100% 100%, 200px 200px;
  background-repeat: no-repeat, no-repeat, no-repeat, repeat;
`;

// --- Styled Components ---

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
      UrlTaPerdOptions.Hour
  );
  const { id } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const pageRef = useRef(null);

  // Shared zoom and pan state
  const [visibleCount, setVisibleCount] = useState(180);
  const [rightOffset, setRightOffset] = useState(0);

  const handleSetPerd = useCallback((newPerd: UrlTaPerdOptions) => {
    localStorage.setItem("detail:perd:type", newPerd);
    setPerd(newPerd);
  }, []);

  // slides 需依賴 perd，移到 useMemo 內
  const slides = useMemo(
    () => [
      {
        id: "bollean",
        content: (
          <Bollean
            visibleCount={visibleCount}
            setVisibleCount={setVisibleCount}
            rightOffset={rightOffset}
            setRightOffset={setRightOffset}
          />
        ),
      },
      {
        id: "ma_k",
        content: (
          <MaKbar
            perd={perd}
            visibleCount={visibleCount}
            setVisibleCount={setVisibleCount}
            rightOffset={rightOffset}
            setRightOffset={setRightOffset}
          />
        ),
      },
      {
        id: "ema",
        content: (
          <AvgMaKbar
            visibleCount={visibleCount}
            setVisibleCount={setVisibleCount}
            rightOffset={rightOffset}
            setRightOffset={setRightOffset}
          />
        ),
      },
      {
        id: "obv",
        content: (
          <Obv
            visibleCount={visibleCount}
            setVisibleCount={setVisibleCount}
            rightOffset={rightOffset}
            setRightOffset={setRightOffset}
          />
        ),
      },
      {
        id: "mj",
        content: (
          <MJ
            visibleCount={visibleCount}
            setVisibleCount={setVisibleCount}
            rightOffset={rightOffset}
            setRightOffset={setRightOffset}
          />
        ),
      },
      {
        id: "mr",
        content: (
          <MR
            visibleCount={visibleCount}
            setVisibleCount={setVisibleCount}
            rightOffset={rightOffset}
            setRightOffset={setRightOffset}
          />
        ),
      },
      {
        id: "kd",
        content: (
          <Kd
            visibleCount={visibleCount}
            setVisibleCount={setVisibleCount}
            rightOffset={rightOffset}
            setRightOffset={setRightOffset}
          />
        ),
      },
      {
        id: "mfi",
        content: (
          <Mfi
            visibleCount={visibleCount}
            setVisibleCount={setVisibleCount}
            rightOffset={rightOffset}
            setRightOffset={setRightOffset}
          />
        ),
      },
      {
        id: "ichimoku_cloud",
        content: <IchimokuCloud perd={perd} />,
      },
    ],
    [perd, visibleCount, rightOffset]
  );

  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < slides.length) {
      setCurrent(index);
    } else if (index < 0) {
      setCurrent(slides.length - 1);
    } else if (index >= slides.length) {
      setCurrent(0);
    }
  }, []);

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

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (scrolling) return;

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
      } else if (e.key === " ") {
        e.preventDefault(); // Prevent page scroll
        window.dispatchEvent(new CustomEvent("detail-switch-step"));
      }
    },
    [current, scrolling, goToSlide, perd, handleSetPerd]
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
    // 监听股票添加事件
    const unlisten = listen("detail", (event: any) => {
      const { url } = event.payload;
      navigate(url);
    });

    return () => {
      unlisten.then((fn: any) => fn()); // 清理监听器
    };
  }, []);

  const { data } = useSWR(
    id === FutureIds.NASDAQ
      ? `https://query1.finance.yahoo.com/v8/finance/chart/${
          FutureIds.NASDAQ
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
    tauriFetcher
  );

  const deals = useMemo(() => {
    if (!data || !id || typeof data !== "string") return [];
    return id === FutureIds.NASDAQ
      ? analyzeNasdaqIndicatorsData(
          data,
          perd === UrlTaPerdOptions.Hour
            ? IndicatorsDateTimeType.DateTime
            : IndicatorsDateTimeType.Date
        )
      : analyzeIndicatorsData(
          data,
          perd === UrlTaPerdOptions.Hour
            ? IndicatorsDateTimeType.DateTime
            : IndicatorsDateTimeType.Date
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
          />
        </DealsContext.Provider>
      </PageContainer>
    </ThemeProvider>
  );
};

export default FullscreenVerticalCarousel;
