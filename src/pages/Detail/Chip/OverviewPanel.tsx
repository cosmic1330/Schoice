import AccountBalanceRounded from "@mui/icons-material/AccountBalanceRounded";
import ArrowDownwardRounded from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRounded from "@mui/icons-material/ArrowUpwardRounded";
import GroupsRounded from "@mui/icons-material/GroupsRounded";
import RemoveRounded from "@mui/icons-material/RemoveRounded";
import { Box, Skeleton, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { ChipData } from "../../../api/marketApi";
import { primitiveTokens, semanticTokens } from "../../../theme";
import type { TdccHolderTableType } from "../../../types";
import {
  createNumberFormatter,
  MetricCard,
  compactChipMedia,
  compactWideChipMedia,
  SectionCard,
  signedLots,
  StatusCard,
} from "./chipUi";

export type HolderDirection = "increase" | "decrease" | "unchanged" | "unavailable";

export const getHolderChange = (
  current: number | null,
  previous: number | null,
): { direction: HolderDirection; delta: number | null } => {
  if (current === null || previous === null) {
    return { direction: "unavailable", delta: null };
  }
  const delta = current - previous;
  if (delta > 0) return { direction: "increase", delta };
  if (delta < 0) return { direction: "decrease", delta };
  return { direction: "unchanged", delta: 0 };
};

export const formatTdccDate = (
  value: string | null,
  locale: string,
  unavailable: string,
) => {
  if (!value) return unavailable;
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  const date = new Date(hasTimezone ? value : `${value}+08:00`);
  if (Number.isNaN(date.getTime())) return unavailable;

  return new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

function HolderBand({
  label,
  current,
  previous,
  number,
}: {
  label: string;
  current: number | null;
  previous: number | null;
  number: Intl.NumberFormat;
}) {
  const { t } = useTranslation();
  const { direction, delta } = getHolderChange(current, previous);
  const color =
    direction === "increase"
      ? semanticTokens.market.gain
      : direction === "decrease"
        ? semanticTokens.market.loss
        : semanticTokens.market.neutral;
  const Icon =
    direction === "increase"
      ? ArrowUpwardRounded
      : direction === "decrease"
        ? ArrowDownwardRounded
        : RemoveRounded;
  const change =
    direction === "unavailable" || delta === null
      ? t("Pages.Detail.Chip.holders.comparisonUnavailable")
      : direction === "unchanged"
        ? t("Pages.Detail.Chip.holders.unchanged")
        : t(`Pages.Detail.Chip.holders.${direction}`, {
            value: number.format(Math.abs(delta)),
          });

  return (
    <Box
      data-testid="holder-band"
      sx={{
        minWidth: 0,
        p: 0.75,
        borderRadius: "8px",
        border: "1px solid " + semanticTokens.analysis.dividerSubtle,
        bgcolor: semanticTokens.analysis.inset,
        [compactChipMedia]: { p: 0.45 },
      }}
    >
      <Typography variant="caption" color={semanticTokens.analysis.textMuted} sx={{ display: "block", fontSize: 12, lineHeight: 1.35, overflowWrap: "anywhere", [compactChipMedia]: { fontSize: 12, lineHeight: 1.35 } }}>
        {label}
      </Typography>
      <Typography
        data-testid="holder-current"
        color={semanticTokens.analysis.text}
        sx={{ mt: 0.3, fontSize: 14, lineHeight: 1.35, fontWeight: 750, fontFamily: primitiveTokens.font.numeric, fontVariantNumeric: "tabular-nums", overflowWrap: "anywhere", [compactChipMedia]: { mt: 0.15, fontSize: 13, lineHeight: 1.25 } }}
      >
        {current === null
          ? t("Pages.Detail.Chip.holders.unavailable")
          : t("Pages.Detail.Chip.holders.current", { value: number.format(current) })}
      </Typography>
      <Stack direction="row" alignItems="flex-start" spacing={0.3} sx={{ mt: 0.35, minWidth: 0, color, [compactChipMedia]: { mt: 0.15, spacing: 0.15 } }}>
        <Icon aria-hidden="true" sx={{ flexShrink: 0, fontSize: 15, mt: "1px" }} />
        <Typography component="span" variant="caption" color="inherit" sx={{ minWidth: 0, fontSize: 12, lineHeight: 1.35, fontVariantNumeric: "tabular-nums", overflowWrap: "anywhere", [compactChipMedia]: { fontSize: 12, lineHeight: 1.35 } }}>
          {change}
        </Typography>
      </Stack>
    </Box>
  );
}

export function HolderStructureCard({
  holder,
  isLoading,
  error,
}: {
  holder: TdccHolderTableType | null | undefined;
  isLoading: boolean;
  error?: unknown;
}) {
  const { t, i18n } = useTranslation();
  const number = createNumberFormatter(i18n.language);
  const unavailable = t("Pages.Detail.Chip.holders.unavailable");

  return (
    <SectionCard
      id="holder-structure-title"
      title={t("Pages.Detail.Chip.holders.title")}
      icon={<GroupsRounded />}
      typography="overview"
    >
      {isLoading ? (
        <Box data-testid="holder-loading" sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 0.65 }}>
          {[0, 1, 2].map((index) => <Skeleton key={index} variant="rounded" height={84} />)}
        </Box>
      ) : error ? (
        <Typography data-testid="holder-error" variant="body2" color={semanticTokens.analysis.textMuted} sx={{ fontSize: 12 }}>
          {t("Pages.Detail.Chip.holders.error")}
        </Typography>
      ) : !holder ? (
        <Typography data-testid="holder-empty" variant="body2" color={semanticTokens.analysis.textMuted} sx={{ fontSize: 12 }}>
          {t("Pages.Detail.Chip.holders.empty")}
        </Typography>
      ) : (
        <>
          <Typography variant="caption" color={semanticTokens.analysis.textMuted} sx={{ display: { xs: "none", sm: "block" }, mb: 0.3, fontSize: 12, lineHeight: 1.3, [compactChipMedia]: { display: "none" } }}>
            {t("Pages.Detail.Chip.holders.scoreNote")}
          </Typography>
          <Typography variant="caption" color={semanticTokens.analysis.textMuted} sx={{ display: "block", mb: 0.65, fontSize: 12, lineHeight: 1.35, overflowWrap: "anywhere", [compactChipMedia]: { mb: 0.35, fontSize: 12, lineHeight: 1.35 } }}>
            {holder.previous_date
              ? t("Pages.Detail.Chip.holders.period", {
                  current: formatTdccDate(holder.data_date, i18n.language, unavailable),
                  previous: formatTdccDate(holder.previous_date, i18n.language, unavailable),
                })
              : t("Pages.Detail.Chip.holders.dataDate", {
                  date: formatTdccDate(holder.data_date, i18n.language, unavailable),
                })}
          </Typography>
          <Box data-testid="holder-bands" sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 0.65, minWidth: 0, [compactChipMedia]: { gap: 0.4 } }}>
            <HolderBand label={t("Pages.Detail.Chip.holders.under100")} current={holder.holders_100} previous={holder.previous_holders_100} number={number} />
            <HolderBand label={t("Pages.Detail.Chip.holders.over400")} current={holder.holders_400} previous={holder.previous_holders_400} number={number} />
            <HolderBand label={t("Pages.Detail.Chip.holders.over1000")} current={holder.holders_1000} previous={holder.previous_holders_1000} number={number} />
          </Box>
        </>
      )}
    </SectionCard>
  );
}

export default function OverviewPanel({
  data,
  holder,
  holderLoading,
  holderError,
}: {
  data: ChipData;
  holder?: TdccHolderTableType | null;
  holderLoading?: boolean;
  holderError?: unknown;
}) {
  const { t, i18n } = useTranslation();
  const number = createNumberFormatter(i18n.language);
  const lots = t("Pages.Detail.Chip.light.lots");
  const unavailable = "--";

  return (
    <Box
      sx={{
        minHeight: 0,
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 0.75,
      }}
    >
      <Box data-testid="overview-lights" sx={{ gridColumn: "1 / -1", minWidth: 0, [compactWideChipMedia]: { gridColumn: "auto" } }}>
        <SectionCard
          id="chip-lights-title"
          title={t("Pages.Detail.Chip.light.title")}
          typography="overview"
        >
        <Typography
          variant="body2"
          color={semanticTokens.analysis.textMuted}
          sx={{ display: { xs: "none", sm: "block" }, mb: 0.75, lineHeight: 1.4, fontSize: 12, [compactChipMedia]: { display: "none" } }}
        >
          {t("Pages.Detail.Chip.light.summary." + data.lights.summary)}
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            borderTop: "1px solid " + semanticTokens.analysis.dividerSubtle,
          }}
        >
          <StatusCard
            label={t("Pages.Detail.Chip.light.institutional")}
            status={data.lights.institutional}
            detail={signedLots(data.institutional.total5d, number) + " " + lots}
            typography="overview"
          />
          <StatusCard
            label={t("Pages.Detail.Chip.light.foreignHolding")}
            status={data.lights.foreignHolding}
            detail={
              data.lights.foreignRatio === null
                ? unavailable
                : number.format(data.lights.foreignRatio) + "%"
            }
            typography="overview"
          />
          <StatusCard
            label={t("Pages.Detail.Chip.light.lendingPressure")}
            status={data.lights.lendingPressure}
            detail={
              data.lights.lendingChangePercent === null
                ? unavailable
                : (data.lights.lendingChangePercent > 0 ? "+" : "") +
                  number.format(data.lights.lendingChangePercent) +
                  "%"
            }
            typography="overview"
          />
        </Box>
        </SectionCard>
      </Box>

      <Box data-testid="overview-holders" sx={{ gridColumn: "1 / -1", minWidth: 0, [compactWideChipMedia]: { gridColumn: "auto" } }}>
        <HolderStructureCard holder={holder} isLoading={Boolean(holderLoading)} error={holderError} />
      </Box>

      <Box
        sx={{
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <SectionCard
          id="institution-title"
          title={t("Pages.Detail.Chip.institutional")}
          icon={<AccountBalanceRounded />}
          hideMetaAtXs
          typography="overview"
        >
          <MetricCard
            label={t("Pages.Detail.Chip.foreign")}
            value={signedLots(data.institutional.foreign5d, number) + " " + lots}
            direction={data.institutional.foreign5d}
            typography="overview"
          />
          <MetricCard
            label={t("Pages.Detail.Chip.trust")}
            value={signedLots(data.institutional.trust5d, number) + " " + lots}
            direction={data.institutional.trust5d}
            typography="overview"
          />
          <MetricCard
            label={t("Pages.Detail.Chip.dealer")}
            value={signedLots(data.institutional.dealer5d, number) + " " + lots}
            direction={data.institutional.dealer5d}
            typography="overview"
          />
          <MetricCard
            label={t("Pages.Detail.Chip.total")}
            value={signedLots(data.institutional.total5d, number) + " " + lots}
            direction={data.institutional.total5d}
            emphasized
            typography="overview"
          />
        </SectionCard>
      </Box>

      <Box sx={{ minWidth: 0, minHeight: 0 }}>
        <SectionCard
          id="margin-title"
          title={t("Pages.Detail.Chip.margin")}
          icon={<GroupsRounded />}
          typography="overview"
        >
          <MetricCard
            label={t("Pages.Detail.Chip.marginBalance")}
            value={number.format(data.margin.marginBalance) + " " + lots}
            typography="overview"
          />
          <MetricCard
            label={t("Pages.Detail.Chip.marginChange")}
            value={
              (data.margin.marginChangePercent5d > 0 ? "+" : "") +
              number.format(data.margin.marginChangePercent5d) +
              "%"
            }
            direction={data.margin.marginChange5d}
            typography="overview"
          />
          <MetricCard
            label={t("Pages.Detail.Chip.shortRatio")}
            value={number.format(data.margin.shortMarginRatio) + "%"}
            typography="overview"
          />
        </SectionCard>
      </Box>
    </Box>
  );
}
