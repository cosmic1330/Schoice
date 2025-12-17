import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  DragIndicator,
  UnfoldLess,
  UnfoldMore,
} from "@mui/icons-material";
import {
  Box,
  Button,
  IconButton,
  styled,
  Stack,
  createTheme,
  ThemeProvider,
} from "@mui/material";
import { listen } from "@tauri-apps/api/event";
import { AnimatePresence, motion, Variants } from "framer-motion";
import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
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
import AvgMaKbar from "./Kbar/EmaAvgKbar";
import Bollean from "./Bollean/Bollean";

// lazy load components
const MaKbar = lazy(() => import("./Ma/MaKbar"));
const Obv = lazy(() => import("./Obv/Obv"));
const IchimokuCloud = lazy(() => import("./IchimokuCloud/IchimokuCloud"));
const MJ = lazy(() => import("./MJ"));
const MR = lazy(() => import("./MR"));
const Kd = lazy(() => import("./Kd"));
const Mfi = lazy(() => import("./Mfi/Mfi"));

// --- Styled Components ---

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

const GlassBar = styled(motion.div)(({ theme }) => ({
  position: "absolute",
  left: theme.spacing(0),
  top: "20%",
  transform: "translateY(-50%)",
  background: "rgba(30, 30, 40, 0.6)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  borderRadius: "16px",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
  padding: theme.spacing(1.5),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  zIndex: 10,
}));

const ControlButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "active",
})<{ active?: boolean }>(({ active }) => ({
  minWidth: "auto",
  padding: "6px 12px",
  borderRadius: "8px",
  color: active ? "#fff" : "rgba(255, 255, 255, 0.6)",
  backgroundColor: active ? "rgba(255, 255, 255, 0.15)" : "transparent",
  border: active
    ? "1px solid rgba(255, 255, 255, 0.1)"
    : "1px solid transparent",
  fontSize: "0.75rem",
  fontWeight: 600,
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#fff",
  },
}));

const NavIconButton = styled(IconButton)(() => ({
  color: "rgba(255, 255, 255, 0.7)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "8px",
  padding: "6px",
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#fff",
  },
}));

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

  // slides 需依賴 perd，移到 useMemo 內
  const slides = useMemo(
    () => [
      {
        id: "bollean",
        content: <Bollean />,
      },
      {
        id: "ma_k",
        content: <MaKbar perd={perd} />,
      },
      { id: "avg_k", content: <AvgMaKbar /> },
      {
        id: "mj",
        content: <MJ />,
      },
      {
        id: "mr",
        content: <MR />,
      },
      {
        id: "kd",
        content: <Kd />,
      },
      {
        id: "obv",
        content: <Obv />,
      },
      {
        id: "mfi",
        content: <Mfi />,
      },
      {
        id: "ichimoku_cloud",
        content: <IchimokuCloud perd={perd} />,
      },
    ],
    [perd]
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
    // 监听股票添加事件
    const unlisten = listen("detail", (event: any) => {
      const { url } = event.payload;
      navigate(url);
    });

    return () => {
      unlisten.then((fn) => fn()); // 清理监听器
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
              {isCollapsed && (<Box 
                sx={{ 
                  fontSize: '10px', 
                  color: '#90caf9', 
                  fontWeight: 'bold',
                  writingMode: 'vertical-rl',
                  textOrientation: 'upright',
                  letterSpacing: '2px'
                }}
              >
                {perd === UrlTaPerdOptions.Hour ? "小時" : perd === UrlTaPerdOptions.Week ? "週線" : "日線"}
              </Box>)}

              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: "20px",
                      height: "1px",
                      backgroundColor: "rgba(255,255,255,0.1)",
                      my: 0.5,
                    }}
                  />

                  {/* Navigation Arrows */}
                  <NavIconButton
                    onClick={() => goToSlide(current - 1)}
                    size="small"
                  >
                    <KeyboardArrowUp fontSize="small" />
                  </NavIconButton>
                  <NavIconButton
                    onClick={() => goToSlide(current + 1)}
                    size="small"
                  >
                    <KeyboardArrowDown fontSize="small" />
                  </NavIconButton>

                  <Box
                    sx={{
                      width: "20px",
                      height: "1px",
                      backgroundColor: "rgba(255,255,255,0.1)",
                      my: 0.5,
                    }}
                  />

                  {/* Time Period Controls */}
                  <ControlButton
                    active={perd === UrlTaPerdOptions.Hour}
                    onClick={() => {
                      localStorage.setItem(
                        "detail:perd:type",
                        UrlTaPerdOptions.Hour
                      );
                      setPerd(UrlTaPerdOptions.Hour);
                    }}
                  >
                    小時
                  </ControlButton>
                  <ControlButton
                    active={perd === UrlTaPerdOptions.Day}
                    onClick={() => {
                      localStorage.setItem(
                        "detail:perd:type",
                        UrlTaPerdOptions.Day
                      );
                      setPerd(UrlTaPerdOptions.Day);
                    }}
                  >
                    日線
                  </ControlButton>
                  <ControlButton
                    active={perd === UrlTaPerdOptions.Week}
                    onClick={() => {
                      localStorage.setItem(
                        "detail:perd:type",
                        UrlTaPerdOptions.Week
                      );
                      setPerd(UrlTaPerdOptions.Week);
                    }}
                  >
                    週線
                  </ControlButton>
                </motion.div>
              )}
            </Stack>
          </GlassBar>
        </DealsContext.Provider>
      </PageContainer>
    </ThemeProvider>
  );
};

export default FullscreenVerticalCarousel;
