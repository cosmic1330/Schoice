import { semanticTokens } from "../../../theme";
import ArrowBackIosNew from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIos from "@mui/icons-material/ArrowForwardIos";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import Settings from "@mui/icons-material/Settings";
import {
  Box,
  Divider,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { UrlTaPerdOptions } from "../../../types";
import Fundamental from "../Tooltip/Fundamental";
import { CHART_CONFIG, getChartAdvice, getChartTitle } from "../constants/chartConfig";
import ChartMenu from "./ChartMenu";
import { TOOLBAR_SETTINGS_EVENT } from "./useToolbarSettings";

export const chartDetailsTooltipSx = {
  width: "min(520px, calc(100vw - 16px))",
  maxWidth: "min(520px, calc(100vw - 16px))",
  overflow: "visible",
  p: 0,
  bgcolor: semanticTokens.analysis.surface,
  border: `1px solid ${semanticTokens.analysis.border}`,
} as const;

interface GlassBarProps {
  perd: UrlTaPerdOptions;
  setPerd: (perd: UrlTaPerdOptions) => void;
  current: number;
  goToSlide: (index: number) => void;
  onOpenDoc: () => void;
  currentId: string;
}

const GlassBar: React.FC<GlassBarProps> = ({
  perd,
  setPerd,
  current,
  goToSlide,
  onOpenDoc,
  currentId,
}) => {
  const { t } = useTranslation();
  const { id } = useParams();
  const currentChart = CHART_CONFIG[current];
  const hasSettings = [
    "ma",
    "ema",
    "atr",
    "bollean",
    "Donchian",
    "volume_profile",
  ].includes(currentId);
  const setPeriod = (next: UrlTaPerdOptions | null) => {
    if (!next) return;
    localStorage.setItem("detail:perd:type", next);
    setPerd(next);
  };

  return (
    <Box
      component="nav"
      aria-label={t("Pages.Detail.GlassBar.navigation")}
      sx={{
        position: "relative",
        zIndex: 20,
        flexShrink: 0,
        minHeight: 56,
        px: 0.75,
        py: 0.65,
        bgcolor: "rgba(15,18,20,0.96)",
        borderTop: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 -8px 24px rgba(0,0,0,0.2)",
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
        <Tooltip title={t("Pages.Detail.GlassBar.previous")}>
          <IconButton
            onClick={() => goToSlide(current - 1)}
            aria-label={t("Pages.Detail.GlassBar.previous")}
            sx={{ width: 40, height: 40, color: "rgba(255,255,255,0.76)" }}
          >
            <ArrowBackIosNew sx={{ fontSize: 17 }} />
          </IconButton>
        </Tooltip>

        <ChartMenu current={current} goToSlide={goToSlide} />

        <Tooltip title={t("Pages.Detail.GlassBar.next")}>
          <IconButton
            onClick={() => goToSlide(current + 1)}
            aria-label={t("Pages.Detail.GlassBar.next")}
            sx={{ width: 40, height: 40, color: "rgba(255,255,255,0.76)" }}
          >
            <ArrowForwardIos sx={{ fontSize: 17 }} />
          </IconButton>
        </Tooltip>

        <Divider
          orientation="vertical"
          flexItem
          sx={{ mx: 0.25, borderColor: "rgba(255,255,255,0.12)" }}
        />

        <ToggleButtonGroup
          exclusive
          size="small"
          value={perd}
          onChange={(_, next) => setPeriod(next)}
          aria-label={t("Pages.Detail.GlassBar.period")}
          sx={{
            "& .MuiToggleButton-root": {
              minWidth: 36,
              height: 40,
              px: 0.75,
              color: "rgba(255,255,255,0.62)",
              borderColor: "rgba(255,255,255,0.12)",
              fontSize: 12,
              fontWeight: 750,
              "&.Mui-selected": {
                color: "#fff",
                bgcolor: "rgba(144,202,249,0.16)",
              },
            },
          }}
        >
          <ToggleButton value={UrlTaPerdOptions.Hour}>
            {t("Pages.Detail.GlassBar.hourShort")}
          </ToggleButton>
          <ToggleButton value={UrlTaPerdOptions.Day}>
            {t("Pages.Detail.GlassBar.dayShort")}
          </ToggleButton>
          <ToggleButton value={UrlTaPerdOptions.Week}>
            {t("Pages.Detail.GlassBar.weekShort")}
          </ToggleButton>
        </ToggleButtonGroup>

        {hasSettings && (
          <Tooltip title={t("Pages.Detail.GlassBar.settings")}>
            <IconButton
              onClick={(event) =>
                window.dispatchEvent(
                  new CustomEvent(TOOLBAR_SETTINGS_EVENT, {
                    detail: { anchor: event.currentTarget },
                  }),
                )
              }
              aria-label={t("Pages.Detail.GlassBar.settings")}
              sx={{ width: 40, height: 40, color: semanticTokens.analysis.focus }}
            >
              <Settings sx={{ fontSize: 19 }} />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip
          arrow
          placement="top"
          slotProps={{
            popper: {
              modifiers: [
                { name: "preventOverflow", options: { padding: 8 } },
                { name: "flip", options: { padding: 8 } },
              ],
            },
            tooltip: {
              sx: chartDetailsTooltipSx,
            },
          }}
          title={
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ px: 1.25, pt: 1, pb: 0.75 }}>
                <Box sx={{ fontWeight: 750, fontSize: 13, lineHeight: 1.35 }}>
                  {getChartTitle(currentChart, t)}
                </Box>
                <Box sx={{ mt: 0.35, fontSize: 12, lineHeight: 1.45, color: semanticTokens.analysis.textMuted }}>
                  {getChartAdvice(currentChart, t)}
                </Box>
              </Box>
              {id && <>
                <Divider sx={{ borderColor: semanticTokens.analysis.divider }} />
                <Fundamental id={id} />
              </>}
            </Box>
          }
        >
          <IconButton
            onClick={onOpenDoc}
            aria-label={t("Pages.Detail.GlassBar.details")}
            sx={{ width: 40, height: 40, color: semanticTokens.analysis.focus }}
          >
            <InfoOutlined sx={{ fontSize: 19 }} />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
};

export default GlassBar;
