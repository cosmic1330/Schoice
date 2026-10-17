import { Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle, styled, ThemeProvider } from "@mui/material";
import { listen } from "@tauri-apps/api/event";
import { AnimatePresence, motion, useReducedMotion, Variants } from "framer-motion";
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import { DealsContext } from "../../context/DealsContext";
import { FutureIds, UrlTaPerdOptions, UrlType } from "../../types";
import {
  analyzeIndicatorsData,
  analyzeNasdaqIndicatorsData,
  IndicatorsDateTimeType,
} from "../../utils/analyzeIndicatorsData";
import { analysisTheme, semanticTokens } from "../../theme";
import MarketDataStatus from "../../components/MarketDataStatus";
import { deriveMarketResourceState } from "../../utils/marketResourceState";
import { useFreshnessNow, useMarketSession } from "../../hooks/useMarketSession";
import { tauriFetcher } from "../../tools/http";
import generateDealDataDownloadUrl from "../../utils/generateDealDataDownloadUrl";
import GlassBar from "./GlassBar";
const DocModal = React.lazy(() => import("../../components/DocModal"));

function DocModalLoading({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();

  return (
    <Dialog
      open
      onClose={onClose}
      aria-labelledby="documentation-loading-title"
      PaperProps={{
        sx: {
          bgcolor: "background.paper",
          backgroundImage: "none",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          width: "min(100% - 32px, 420px)",
        },
      }}
    >
      <DialogTitle id="documentation-loading-title">{t("Pages.Detail.documentation.loading")}</DialogTitle>
      <DialogContent sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 3 }}>
        <CircularProgress size={22} aria-hidden="true" />
        <Box sx={{ minWidth: 0, flex: 1 }} role="status" aria-live="polite">
          {t("Pages.Detail.documentation.loading")}
        </Box>
        <Button onClick={onClose} variant="text">{t("Pages.Detail.documentation.cancel")}</Button>
      </DialogContent>
    </Dialog>
  );
}
const PageContainer = styled(Box)`
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: ${semanticTokens.analysis.canvas};
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

const ChartViewport = styled(Box)`
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

import { CHART_CONFIG } from "./constants/chartConfig";
import { getChartTitle } from "./constants/chartConfig";
import { carouselOwnsEvent, cycleDetailPeriod, shouldHandleDetailShortcut } from "./interaction";
import { shouldShowDetailFreshness } from "./detailFreshness";

const FullscreenVerticalCarousel: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const reduceMotion = useReducedMotion();
  const [scrolling, setScrolling] = useState(false);
  const [perd, setPerd] = useState<UrlTaPerdOptions>(
    (localStorage.getItem("detail:perd:type") as UrlTaPerdOptions) ||
      UrlTaPerdOptions.Hour,
  );
  const { id } = useParams();
  const marketSession = useMarketSession(id ?? "");
  const [historySuccess, setHistorySuccess] = useState<{ key: string; updatedAt: number } | null>(null);
  // Shared zoom and pan state
  const [visibleCount, setVisibleCount] = useState(120);
  const [rightOffset, setRightOffset] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);

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
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (scrolling || isDocOpen || !carouselOwnsEvent(e)) return;
      e.preventDefault();
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (scrolling || isDocOpen || !shouldHandleDetailShortcut(event)) return;

      event.preventDefault();

      if (event.key === "ArrowUp") {
        goToSlide(current - 1);
      } else if (event.key === "ArrowDown") {
        goToSlide(current + 1);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        handleSetPerd(cycleDetailPeriod(perd, event.key));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [current, scrolling, goToSlide, perd, handleSetPerd, isDocOpen]);

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

  const historyKey = id
    ? id === FutureIds.NASDAQ_FUTURE
      ? `https://query1.finance.yahoo.com/v8/finance/chart/${FutureIds.NASDAQ_FUTURE}?interval=${
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
          id: encodeURIComponent(id),
          perd,
        })
    : null;
  const { data: historyData, error, isLoading, isValidating, mutate } = useSWR(
    historyKey,
    tauriFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      onSuccess: () => {
        if (historyKey) setHistorySuccess({ key: historyKey, updatedAt: Date.now() });
      },
    },
  );

  const deals = useMemo(() => {
    if (!historyData || !id || typeof historyData !== "string") return [];
    const timeType = perd === UrlTaPerdOptions.Hour
      ? IndicatorsDateTimeType.DateTime
      : IndicatorsDateTimeType.Date;
    return id === FutureIds.NASDAQ_FUTURE
      ? analyzeNasdaqIndicatorsData(historyData, timeType)
      : analyzeIndicatorsData(historyData, timeType);
  }, [historyData, id, perd]);
  const historyUpdatedAt = historySuccess?.key === historyKey ? historySuccess.updatedAt : undefined;
  const now = useFreshnessNow(historyUpdatedAt, 30_000, marketSession);
  const historyState = useMemo(() => deriveMarketResourceState({ enabled: Boolean(id && perd), hasData: deals.length > 0, resolved: historyData !== undefined, isLoading, isValidating, error, updatedAt: historyUpdatedAt, marketSession, staleAfterMs: 30_000, now }), [id, perd, deals.length, historyData, isLoading, isValidating, error, historyUpdatedAt, marketSession, now]);
  const { t } = useTranslation();
  const latest = deals.at(-1);
  const periodLabel = t(`Pages.Detail.summary.${perd === UrlTaPerdOptions.Hour ? "hour" : perd === UrlTaPerdOptions.Day ? "day" : "week"}`);
  const chartSummary = t("a11y.chartSummary", {
    title: getChartTitle(CHART_CONFIG[current], t),
    period: periodLabel,
    count: deals.length,
    latest: latest
      ? t("Pages.Detail.summary.latest", { open: latest.o, high: latest.h, low: latest.l, close: latest.c })
      : t("Pages.Detail.summary.noLatest"),
  });

  return (
    <ThemeProvider theme={analysisTheme}>
      <PageContainer>
          <DealsContext.Provider value={deals}>
          <ChartViewport ref={viewportRef} tabIndex={0} aria-label={t("Pages.Detail.GlassBar.navigation")} aria-describedby="detail-chart-summary" onWheel={handleWheel}>
            <Box id="detail-chart-summary" aria-live="polite" aria-atomic="true" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>
              {chartSummary}
            </Box>
            {historyState.phase !== "ready" ? <Box sx={{ position: "absolute", inset: 0, zIndex: 2, display: "grid", placeItems: "center", px: 2 }}><MarketDataStatus state={historyState} retry={mutate} /></Box> : null}
            <AnimatePresence custom={direction(current)} mode="wait">
              <motion.div
                key={slides[current].id}
                custom={direction(current)}
                variants={reduceMotion ? undefined : slideVariants}
                initial={reduceMotion ? false : "initial"}
                animate="animate"
                exit="exit"
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Suspense fallback={<Box role="status">{t("app.loading")}</Box>}>
                  {slides[current].content}
                </Suspense>
              </motion.div>
            </AnimatePresence>
            {shouldShowDetailFreshness(slides[current].id, historyState.phase) ? <Box sx={{ position: "absolute", top: 4, right: 8, zIndex: 3 }}><MarketDataStatus state={historyState} retry={mutate} compact /></Box> : null}
          </ChartViewport>

          <GlassBar
            perd={perd}
            setPerd={setPerd}
            current={current}
            goToSlide={goToSlide}
            onOpenDoc={() => setIsDocOpen(true)}
            currentId={slides[current].id}
          />

          {isDocOpen ? (
            <Suspense fallback={<DocModalLoading onClose={() => setIsDocOpen(false)} />}>
              <DocModal
                open
                onClose={() => setIsDocOpen(false)}
                title={getChartTitle(CHART_CONFIG[current], t)}
                markdown={docMap[slides[current].id as keyof typeof docMap]?.content || ""}
              />
            </Suspense>
          ) : null}
        </DealsContext.Provider>
      </PageContainer>
    </ThemeProvider>
  );
};

export default FullscreenVerticalCarousel;
