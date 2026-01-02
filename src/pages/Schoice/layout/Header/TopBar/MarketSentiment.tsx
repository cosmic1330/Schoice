import { dateFormat } from "@ch20026103/anysis";
import { Mode } from "@ch20026103/anysis/dist/esm/stockSkills/utils/dateFormat";
import {
  alpha,
  Box,
  Button,
  Chip,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
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
    tauriFetcher
  );

  const ta = useMemo(() => {
    if (!data || typeof data !== "string") return [];
    return analyzeIndicatorsData(data, IndicatorsDateTimeType.DateTime);
  }, [data]);

  const { trends, power, date, trendChangePoints } = useMarketAnalysis({
    ta,
    perd: UrlTaPerdOptions.Hour,
  });

  const lastTrend = trends[trends.length - 1]?.trend;
  const isBullish = lastTrend === "多頭";
  const trendColor = isBullish ? "error" : "success";
  const trendLabel = isBullish
    ? t("Pages.Schoice.Header.bullish")
    : t("Pages.Schoice.Header.bearish");

  return (
    <Stack direction="row" alignItems="center" spacing={3}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {t("Pages.Schoice.Header.marketSentiment")}
        </Typography>
        <Tooltip
          title={
            <Box sx={{ p: 0.5 }}>
              {trendChangePoints.map((point) => (
                <Typography
                  variant="caption"
                  display="block"
                  key={point.t}
                  sx={{ whiteSpace: "nowrap" }}
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
          <Chip
            label={`${date} ${trendLabel}`}
            size="small"
            color={trendColor}
            variant="filled"
            sx={{
              height: 20,
              fontSize: "0.75rem",
              fontWeight: 700,
              boxShadow: (theme) =>
                `0 0 10px ${alpha(theme.palette[trendColor].main, 0.4)}`,
            }}
          />
        </Tooltip>
        <Chip
          label={power}
          size="small"
          sx={{
            height: 20,
            fontSize: "0.75rem",
            fontWeight: 700,
            backgroundColor: (theme) => alpha(theme.palette.divider, 0.1),
            border: "1px solid",
            borderColor: "divider",
          }}
        />
      </Stack>

      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontWeight: 600,
          }}
        >
          {t("Pages.Schoice.Header.taidex")}(h):
        </Typography>
        <Button
          variant="text"
          onClick={openDetailWindow}
          size="small"
          sx={{
            minWidth: 0,
            p: 0,
            fontSize: "0.875rem",
            fontWeight: 800,
            "&:hover": {
              backgroundColor: "transparent",
              color: "primary.main",
            },
          }}
        >
          {ta[ta.length - 1]?.c}
        </Button>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color:
              ta[ta.length - 1]?.c > ta[ta.length - 2]?.c
                ? "error.main"
                : "success.main",
          }}
        >
          {ta[ta.length - 1]?.c > ta[ta.length - 2]?.c ? "▲" : "▼"}
          {Math.abs(ta[ta.length - 1]?.c - ta[ta.length - 2]?.c).toFixed(0)}(
          {Math.abs(
            ((ta[ta.length - 1]?.c - ta[ta.length - 2]?.c) /
              ta[ta.length - 2]?.c) *
              100
          ).toFixed(2)}
          %)
        </Typography>
      </Stack>
    </Stack>
  );
}
