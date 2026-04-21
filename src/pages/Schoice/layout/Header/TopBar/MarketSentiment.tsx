import { dateFormat } from "@ch20026103/anysis";
import { Mode } from "@ch20026103/anysis/dist/esm/stockSkills/utils/dateFormat";
import { alpha, Box, Stack, Tooltip, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import useDetailWebviewWindow from "../../../../../hooks/useDetailWebviewWindow";
import useMarketAnalysis from "../../../../../hooks/useMarketAnalysis";
import { tauriFetcher } from "../../../../../tools/http";
import { FutureIds, UrlTaPerdOptions, UrlType } from "../../../../../types";
import {
  analyzeIndicatorsData,
  IndicatorsDateTimeType,
} from "../../../../../utils/analyzeIndicatorsData";
import generateDealDataDownloadUrl from "../../../../../utils/generateDealDataDownloadUrl";

const StatusOrb = ({ color }: { color: string }) => (
  <Box
    sx={{
      width: 8,
      height: 8,
      borderRadius: "50%",
      backgroundColor: color,
      position: "relative",
      boxShadow: `0 0 12px ${color}`,
      "&::after": {
        content: '""',
        position: "absolute",
        top: -4,
        left: -4,
        right: -4,
        bottom: -4,
        borderRadius: "50%",
        border: `2px solid ${color}`,
        animation: "pulse 2.5s infinite",
      },
      "@keyframes pulse": {
        "0%": { transform: "scale(1)", opacity: 0.8 },
        "70%": { transform: "scale(2.5)", opacity: 0 },
        "100%": { transform: "scale(2.5)", opacity: 0 },
      },
    }}
  />
);

export default function MarketSentiment() {
  const { t } = useTranslation();
  const { openDetailWindow } = useDetailWebviewWindow({
    id: FutureIds.WTX,
    name: t("Pages.Schoice.Header.taidex"),
    group: "期貨",
  });
  const { data } = useSWR(
    generateDealDataDownloadUrl({
      type: UrlType.Indicators,
      id: FutureIds.WTX,
      perd: UrlTaPerdOptions.Hour,
    }),
    tauriFetcher,
  );

  const ta = useMemo(() => {
    if (!data || typeof data !== "string") return [];
    return analyzeIndicatorsData(data, IndicatorsDateTimeType.DateTime);
  }, [data]);

  const { trends, power, trendChangePoints } = useMarketAnalysis({
    ta,
    perd: UrlTaPerdOptions.Hour,
  });

  const lastTrend = trends[trends.length - 1]?.trend;
  const isBullish = lastTrend === "多頭";
  const statusColor = isBullish ? "#ef4444" : "#10b981"; // 精緻的紅綠色調
  const trendLabel = isBullish
    ? t("Pages.Schoice.Header.bullish")
    : t("Pages.Schoice.Header.bearish");

  const latestPrice = ta[ta.length - 1]?.c;
  const prevPrice = ta[ta.length - 2]?.c;
  const diff = latestPrice && prevPrice ? latestPrice - prevPrice : 0;
  const percent = prevPrice ? ((diff / prevPrice) * 100).toFixed(2) : "0.00";

  return (
    <Stack direction="row" alignItems="center" spacing={2.5}>
      {/* 市場情緒導向區 */}
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Tooltip
          arrow
          title={
            <Box sx={{ p: 1 }}>
              <Typography
                variant="caption"
                fontWeight={800}
                display="block"
                mb={0.5}
              >
                {t("Pages.Schoice.Header.marketSentiment")} 歷史
              </Typography>
              {trendChangePoints.slice(-5).map((point) => (
                <Typography
                  variant="caption"
                  display="block"
                  key={point.t}
                  sx={{
                    whiteSpace: "nowrap",
                    color:
                      point.trend === "多頭" ? "error.light" : "success.light",
                  }}
                >
                  {dateFormat(point.t, Mode.NumberToString)}{" "}
                  {point.trend === "多頭"
                    ? t("Pages.Schoice.Header.bullish")
                    : t("Pages.Schoice.Header.bearish")}
                </Typography>
              ))}
            </Box>
          }
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.2,
              py: 0.3,
              borderRadius: "100px",
              bgcolor: alpha(statusColor, 0.08),
              border: `1px solid ${alpha(statusColor, 0.15)}`,
              cursor: "default",
              transition: "all 0.3s ease",
              "&:hover": {
                bgcolor: alpha(statusColor, 0.12),
                borderColor: alpha(statusColor, 0.3),
              },
            }}
          >
            <StatusOrb color={statusColor} />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 900,
                color: statusColor,
                letterSpacing: 0.5,
                fontSize: "0.75rem",
              }}
            >
              {trendLabel}
            </Typography>
            <Box
              sx={{
                width: "1px",
                height: 10,
                bgcolor: alpha(statusColor, 0.15),
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: statusColor,
                opacity: 0.7,
                fontSize: "0.7rem",
              }}
            >
              P: {power}
            </Typography>
          </Box>
        </Tooltip>
      </Stack>

      <Box
        sx={{
          width: "1px",
          height: 16,
          bgcolor: (theme) => alpha(theme.palette.divider, 0.05),
        }}
      />

      {/* 指數價格顯示區 */}
      <Stack direction="row" alignItems="center" spacing={1.2}>
        <Box
          onClick={openDetailWindow}
          sx={{
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            transition: "all 0.2s ease",
            "&:hover": { opacity: 0.8 },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontWeight: 800,
              fontSize: "0.6rem",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              lineHeight: 1,
              mb: 0.2,
            }}
          >
            {t("Pages.Schoice.Header.taidex")}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 900,
              fontSize: "1rem",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {latestPrice}
          </Typography>
        </Box>

        <AnimatePresence mode="wait">
          <motion.div
            key={latestPrice}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
          >
            <Box
              sx={{
                px: 0.8,
                py: 0.3,
                borderRadius: "4px",
                bgcolor: alpha(diff >= 0 ? "#ef4444" : "#10b981", 0.08),
                display: "flex",
                alignItems: "center",
                gap: 0.3,
              }}
            >
              <Typography
                variant="caption"
                noWrap
                sx={{
                  fontWeight: 900,
                  color: diff >= 0 ? "#ef4444" : "#10b981",
                  fontSize: "0.7rem",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.3,
                }}
              >
                <span>{diff >= 0 ? "▲" : "▼"}</span>
                <span>{Math.abs(diff).toFixed(0)}</span>
                <span style={{ opacity: 0.6, fontSize: "0.65rem" }}>
                  ({Math.abs(Number(percent))}%)
                </span>
              </Typography>
            </Box>
          </motion.div>
        </AnimatePresence>
      </Stack>
    </Stack>
  );
}
