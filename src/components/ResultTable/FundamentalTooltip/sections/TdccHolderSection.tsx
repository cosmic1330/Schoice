import ArrowDownwardRounded from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRounded from "@mui/icons-material/ArrowUpwardRounded";
import RemoveRounded from "@mui/icons-material/RemoveRounded";
import { Box, Grid, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { semanticTokens } from "../../../../theme";
import type { TdccHolderTableType } from "../../../../types";
import SectionHeader from "../SectionHeader";

const formatDate = (value: string, locale: string) => {
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  const date = new Date(hasTimezone ? value : `${value}+08:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

function HolderCard({
  label,
  current,
  previous,
}: {
  label: string;
  current: number | null;
  previous: number | null;
}) {
  const { t, i18n } = useTranslation();
  const formatter = new Intl.NumberFormat(i18n.language, {
    maximumFractionDigits: 0,
  });
  const delta =
    current === null || previous === null ? null : current - previous;
  const color =
    delta === null || delta === 0
      ? semanticTokens.market.neutral
      : delta > 0
        ? semanticTokens.market.gain
        : semanticTokens.market.loss;
  const Icon =
    delta === null || delta === 0
      ? RemoveRounded
      : delta > 0
        ? ArrowUpwardRounded
        : ArrowDownwardRounded;
  const change =
    delta === null
      ? t("Pages.Detail.tooltip.tdcc.comparisonUnavailable")
      : delta === 0
        ? t("Pages.Detail.tooltip.tdcc.unchanged")
        : t(
            `Pages.Detail.tooltip.tdcc.${delta > 0 ? "increase" : "decrease"}`,
            { value: formatter.format(Math.abs(delta)) },
          );

  return (
    <Box
      sx={{
        minWidth: 0,
        p: 0.75,
        border: `1px solid ${semanticTokens.analysis.borderSubtle}`,
        borderRadius: 1,
        bgcolor: semanticTokens.analysis.inset,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          display: "block",
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {current === null
          ? t("Pages.Detail.tooltip.unavailable")
          : t("Pages.Detail.tooltip.tdcc.currentHolders", {
              value: formatter.format(current),
            })}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, color }}>
        <Icon sx={{ fontSize: "0.9rem" }} />
        <Typography variant="caption" color="inherit">
          {change}
        </Typography>
      </Box>
    </Box>
  );
}

export default function TdccHolderSection({
  holder,
}: {
  holder: TdccHolderTableType;
}) {
  const { t, i18n } = useTranslation();

  return (
    <Grid size={12}>
      <SectionHeader
        title={t("Pages.Detail.tooltip.tdcc.title")}
        emoji="👥"
        color="success"
      />
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mb: 0.75 }}
      >
        {holder.previous_date
          ? t("Pages.Detail.tooltip.tdcc.dataPeriod", {
              current: formatDate(holder.data_date, i18n.language),
              previous: formatDate(holder.previous_date, i18n.language),
            })
          : t("Pages.Detail.tooltip.tdcc.dataDate", {
              date: formatDate(holder.data_date, i18n.language),
            })}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 0.75,
        }}
      >
        <HolderCard
          label={t("Pages.Detail.tooltip.tdcc.holders400")}
          current={holder.holders_400}
          previous={holder.previous_holders_400}
        />
        <HolderCard
          label={t("Pages.Detail.tooltip.tdcc.holders1000")}
          current={holder.holders_1000}
          previous={holder.previous_holders_1000}
        />
      </Box>
    </Grid>
  );
}
