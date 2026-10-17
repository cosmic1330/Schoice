import RefreshRounded from "@mui/icons-material/RefreshRounded";
import {
  Alert,
  Box,
  Button,
  Container,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import useSWR from "swr";
import type { ChipData } from "../../../api/marketApi";
import { marketApi } from "../../../api/marketApi";
import { getTdccHolder } from "../../../api/tdccApi";
import { primitiveTokens, semanticTokens } from "../../../theme";
import AnalysisPanel from "./AnalysisPanel";
import OverviewPanel from "./OverviewPanel";
import TrendPanel from "./TrendPanel";
import { compactChipMedia } from "./chipUi";

type ChipView = "overview" | "trend" | "analysis";

const chipContentSx = {
  flex: 1,
  minHeight: 0,
  overflow: "hidden",
  pb: 0.25,
} as const;

function SummaryCard({ data }: { data: ChipData }) {
  const { t } = useTranslation();
  const verdict = t("Pages.Detail.Chip.verdict." + data.verdict);
  const explanation = t("Pages.Detail.Chip.explanation." + data.verdict);
  const score = Math.max(0, Math.min(100, data.score));
  const accent =
    data.verdict === "stable_buying"
      ? semanticTokens.market.gain
      : data.verdict === "distribution" || data.verdict === "retail_crowded"
        ? semanticTokens.market.warning
        : semanticTokens.market.neutral;

  return (
    <Box
      component="section"
      data-testid="chip-summary"
      aria-label={t("Pages.Detail.Chip.summary")}
      sx={{
        px: { xs: 1, sm: 1.25 },
        py: { xs: 0.65, sm: 0.8 },
        borderRadius: primitiveTokens.radius.md + "px",
        bgcolor: semanticTokens.analysis.panel,
        border: "1px solid " + semanticTokens.analysis.divider,
        [compactChipMedia]: { px: 0.8, py: 0.4 },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={0.65}
        sx={{ mb: 0.3, [compactChipMedia]: { mb: 0.1 } }}
      >
        <Typography
          component="h1"
          variant="caption"
          color={semanticTokens.analysis.textMuted}
          noWrap
          sx={{ minWidth: 0, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", [compactChipMedia]: { fontSize: 10 } }}
        >
          <Box
            component="span"
            sx={{
              color: semanticTokens.analysis.text,
              fontFamily: primitiveTokens.font.numeric,
              fontWeight: 800,
            }}
          >
            {data.symbol}
          </Box>
          {" / " + t("Pages.Detail.Chip.title")}
        </Typography>
        <Typography
          variant="caption"
          color={semanticTokens.analysis.textMuted}
          noWrap
          sx={{ minWidth: 0, textAlign: "right", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", [compactChipMedia]: { fontSize: 10 } }}
        >
          {data.asOf + " / " + data.source}
        </Typography>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={0.8}>
        <Typography
          component="h2"
          variant="h6"
          color={semanticTokens.analysis.text}
          fontWeight={800}
          sx={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}
        >
          {verdict}
        </Typography>
        <Stack direction="row" alignItems="baseline" spacing={0.45} flexShrink={0}>
          <Typography
            color={accent}
            fontWeight={800}
            sx={{
              fontSize: { xs: 23, sm: 26 },
              [compactChipMedia]: { fontSize: 21 },
              lineHeight: 1,
              fontFamily: primitiveTokens.font.numeric,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {score}
          </Typography>
          <Typography
            variant="caption"
            color={semanticTokens.analysis.textMuted}
            sx={{ fontSize: 10.5 }}
          >
            {t("Pages.Detail.Chip.score")}
          </Typography>
        </Stack>
      </Stack>

      <Typography
        variant="body2"
        color={semanticTokens.analysis.textMuted}
        sx={{ mt: 0.2, fontSize: { xs: 11.5, sm: 12.5 }, lineHeight: 1.3, [compactChipMedia]: { display: "none" } }}
      >
        {explanation}
      </Typography>

      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.45, [compactChipMedia]: { mt: 0.2 } }}>
        <Box
          role="meter"
          aria-label={t("Pages.Detail.Chip.score")}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={score}
          sx={{ position: "relative", flex: 1, height: 4 }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              borderRadius: primitiveTokens.radius.round + "px",
              bgcolor: semanticTokens.analysis.panelMuted,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              width: score + "%",
              borderRadius: primitiveTokens.radius.round + "px",
              bgcolor: accent,
            }}
          />
          <Box
            aria-hidden="true"
            sx={{
              position: "absolute",
              top: "50%",
              left: score + "%",
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: accent,
              border: "2px solid " + semanticTokens.analysis.panel,
              transform: "translate(-50%, -50%)",
            }}
          />
        </Box>
        <Typography
          variant="caption"
          color={semanticTokens.analysis.textMuted}
          noWrap
          sx={{ fontSize: 10.5 }}
        >
          {t("Pages.Detail.Chip.confidence.label") + " · "}
          <Box component="span" sx={{ color: semanticTokens.analysis.text, fontWeight: 700 }}>
            {t("Pages.Detail.Chip.confidence." + data.confidence)}
          </Box>
        </Typography>
      </Stack>
    </Box>
  );
}

function LoadingState() {
  const { t } = useTranslation();

  return (
    <Container
      component="main"
      maxWidth={false}
      aria-busy="true"
      aria-label={t("Pages.Detail.Chip.loading")}
      sx={{ height: "100%", px: 1.5, py: 1 }}
    >
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between">
          <Skeleton variant="text" width={128} height={30} />
          <Skeleton variant="text" width={118} height={22} />
        </Stack>
        <Skeleton variant="rounded" height={132} />
        <Skeleton variant="text" height={44} />
        <Skeleton variant="rounded" height={220} />
      </Stack>
    </Container>
  );
}

export default function ChipPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { data, error, isLoading, mutate } = useSWR(
    id ? "chip/" + id : null,
    () => marketApi.getChipData(id as string),
    { revalidateOnFocus: false, dedupingInterval: 30 * 60 * 1000 },
  );
  const {
    data: tdccHolder,
    error: tdccError,
    isLoading: tdccLoading,
  } = useSWR(
    id ? ["tdcc-holder", id] : null,
    () => getTdccHolder(id),
    { revalidateOnFocus: false, dedupingInterval: 30 * 60 * 1000 },
  );

  if (isLoading) return <LoadingState />;

  if (error || !data) {
    const twOnly = String(error).includes("CHIP_DATA_TW_ONLY");
    return (
      <Box height="100%" display="grid" sx={{ placeItems: "center", p: 2 }}>
        <Alert
          severity={twOnly ? "info" : "warning"}
          action={
            !twOnly && (
              <Button
                color="inherit"
                startIcon={<RefreshRounded />}
                onClick={() => mutate()}
              >
                {t("Pages.Detail.Chip.retry")}
              </Button>
            )
          }
        >
          {t(twOnly ? "Pages.Detail.Chip.twOnly" : "Pages.Detail.Chip.error")}
        </Alert>
      </Box>
    );
  }

  return (
    <ChipDashboard
      data={data}
      tdccHolder={tdccHolder}
      tdccError={tdccError}
      tdccLoading={tdccLoading}
    />
  );
}

export function ChipDashboard({
  data,
  tdccHolder,
  tdccError,
  tdccLoading = false,
}: {
  data: ChipData;
  tdccHolder?: import("../../../types").TdccHolderTableType | null;
  tdccError?: unknown;
  tdccLoading?: boolean;
}) {
  const { t } = useTranslation();
  const [view, setView] = useState<ChipView>("overview");

  return (
    <Container
      component="main"
      maxWidth={false}
      sx={{
        width: "100%",
        maxWidth: 1100,
        height: "100%",
        mx: "auto",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        px: { xs: 1.25, sm: 2 },
        pt: 0.6,
        pb: 0.75,
      }}
    >
      <Stack spacing={0.5} sx={{ height: "100%", minHeight: 0 }}>
        <SummaryCard data={data} />

        <Tabs
          value={view}
          onChange={(_, next: ChipView) => setView(next)}
          variant="fullWidth"
          aria-label={t("Pages.Detail.Chip.tabs.label")}
          sx={{
            minHeight: 38,
            flexShrink: 0,
            borderBottom: "1px solid " + semanticTokens.analysis.divider,
            "& .MuiTabs-indicator": {
              height: 2,
              bgcolor: semanticTokens.analysis.focus,
            },
            "& .MuiTab-root": {
              minHeight: 38,
              px: 0.5,
              color: semanticTokens.analysis.textMuted,
              fontSize: { xs: 12, sm: 13 },
              fontWeight: 650,
              textTransform: "none",
              transition: "color " + primitiveTokens.motion.duration.fast + "ms " + primitiveTokens.motion.easing.standard,
              "&.Mui-selected": {
                color: semanticTokens.analysis.text,
              },
              "&:focus-visible": {
                outline: "2px solid " + semanticTokens.analysis.focus,
                outlineOffset: -2,
              },
              "@media (prefers-reduced-motion: reduce)": {
                transition: "none",
              },
            },
            [compactChipMedia]: {
              minHeight: 32,
              "& .MuiTab-root": { minHeight: 32, fontSize: 11 },
            },
          }}
        >
          <Tab value="overview" label={t("Pages.Detail.Chip.tabs.overview")} />
          <Tab value="trend" label={t("Pages.Detail.Chip.tabs.trend")} />
          <Tab value="analysis" label={t("Pages.Detail.Chip.tabs.analysis")} />
        </Tabs>

        <Box
          aria-label={t("Pages.Detail.Chip.tabs." + view)}
          sx={chipContentSx}
        >
          {view === "overview" && (
            <OverviewPanel
              data={data}
              holder={tdccHolder}
              holderError={tdccError}
              holderLoading={tdccLoading}
            />
          )}
          {view === "trend" && <TrendPanel data={data} />}
          {view === "analysis" && <AnalysisPanel data={data} />}
        </Box>
      </Stack>
    </Container>
  );
}
