import { ShowChartRounded } from "@mui/icons-material";
import { Alert, Box, Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChipData } from "../../../api/marketApi";
import { primitiveTokens, semanticTokens } from "../../../theme";
import { compactChipMedia, createNumberFormatter, SectionCard, signedLots } from "./chipUi";

type TrendDay = ChipData["history"][number] & {
  label: string;
  institutionalLots: number;
  institutionalCumulativeLots: number;
};

export function buildTrendData(history: ChipData["history"]): TrendDay[] {
  let cumulativeInstitutionalTotal = 0;

  return history.map((day) => {
    cumulativeInstitutionalTotal += day.institutionalTotal;

    return {
      ...day,
      label: day.date.slice(5),
      institutionalLots: day.institutionalTotal / 1000,
      institutionalCumulativeLots: cumulativeInstitutionalTotal / 1000,
    };
  });
}

function TrendTooltip({
  active,
  payload,
  number,
}: {
  active?: boolean;
  payload?: Array<{ payload?: TrendDay }>;
  number: Intl.NumberFormat;
}) {
  const { t } = useTranslation();
  const day = payload?.[0]?.payload;
  if (!active || !day) return null;

  const rows = [
    {
      label: t("Pages.Detail.Chip.cumulativeInstitutional"),
      lots: day.institutionalCumulativeLots,
      neutral: true,
    },
    { label: t("Pages.Detail.Chip.foreign"), lots: day.foreign / 1000 },
    { label: t("Pages.Detail.Chip.trust"), lots: day.trust / 1000 },
    { label: t("Pages.Detail.Chip.dealer"), lots: day.dealer / 1000 },
    { label: t("Pages.Detail.Chip.total"), lots: day.institutionalTotal / 1000 },
  ];

  return (
    <Box
      sx={{
        minWidth: 172,
        p: 1.1,
        color: semanticTokens.analysis.text,
        bgcolor: semanticTokens.analysis.panel,
        border: "1px solid " + semanticTokens.analysis.divider,
        borderRadius: primitiveTokens.radius.sm + "px",
      }}
    >
      <Typography
        variant="caption"
        color={semanticTokens.analysis.textMuted}
        sx={{ display: "block", mb: 0.65 }}
      >
        {day.date}
      </Typography>
      <Stack spacing={0.4}>
        {rows.map((row) => {
          const color = row.neutral
            ? semanticTokens.analysis.text
            : row.lots > 0
              ? semanticTokens.market.gain
              : row.lots < 0
                ? semanticTokens.market.loss
                : semanticTokens.analysis.text;
          const displayValue =
            (row.lots > 0 ? "+" : "") +
            number.format(row.lots) +
            " " +
            t("Pages.Detail.Chip.light.lots");

          return (
            <Stack
              key={row.label}
              direction="row"
              justifyContent="space-between"
              spacing={2}
            >
              <Typography variant="caption" color={semanticTokens.analysis.textMuted}>
                {row.label}
              </Typography>
              <Typography
                variant="caption"
                color={color}
                fontWeight={700}
                sx={{
                  fontFamily: primitiveTokens.font.numeric,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {displayValue}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}

function TrendMetric({
  label,
  value,
  direction,
}: {
  label: string;
  value: string;
  direction: number;
}) {
  const color =
    direction > 0
      ? semanticTokens.market.gain
      : direction < 0
        ? semanticTokens.market.loss
        : semanticTokens.analysis.text;

  return (
    <Box
      sx={{
        minWidth: 0,
        px: { xs: 0.5, sm: 1 },
        borderRight: "1px solid " + semanticTokens.analysis.dividerSubtle,
        "&:first-of-type": { pl: 0 },
        "&:last-child": { pr: 0, borderRight: 0 },
      }}
    >
      <Typography
        variant="caption"
        color={semanticTokens.analysis.textMuted}
        noWrap
        sx={{ display: "block", fontSize: 10.5 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        color={color}
        fontWeight={750}
        noWrap
        sx={{
          mt: 0.25,
          fontSize: { xs: 11.5, sm: 13 },
          lineHeight: 1.25,
          fontFamily: primitiveTokens.font.numeric,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {(direction > 0 ? "↑ " : direction < 0 ? "↓ " : "— ") + value}
      </Typography>
    </Box>
  );
}

export default function TrendPanel({ data }: { data: ChipData }) {
  const { t, i18n } = useTranslation();
  const number = useMemo(
    () => createNumberFormatter(i18n.language),
    [i18n.language],
  );
  const chartData = useMemo(() => buildTrendData(data.history), [data.history]);

  if (chartData.length === 0) {
    return <Alert severity="info">{t("Pages.Detail.Chip.trendEmpty")}</Alert>;
  }

  const first = chartData[0];
  const last = chartData[chartData.length - 1];
  const priceChange =
    first.close !== 0 ? ((last.close - first.close) / first.close) * 100 : 0;
  const lots = t("Pages.Detail.Chip.light.lots");

  return (
    <SectionCard
      fill
      id="chip-trend-title"
      title={t("Pages.Detail.Chip.trend")}
      icon={<ShowChartRounded />}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          mb: 1.1,
          [compactChipMedia]: { mb: 0.45 },
        }}
      >
        <TrendMetric
          label={t("Pages.Detail.Chip.priceChange20d")}
          value={(priceChange > 0 ? "+" : "") + number.format(priceChange) + "%"}
          direction={priceChange}
        />
        <TrendMetric
          label={t("Pages.Detail.Chip.institutional5d")}
          value={signedLots(data.institutional.total5d, number) + " " + lots}
          direction={data.institutional.total5d}
        />
        <TrendMetric
          label={t("Pages.Detail.Chip.institutional20d")}
          value={signedLots(data.institutional.total20d, number) + " " + lots}
          direction={data.institutional.total20d}
        />
      </Box>

      <Stack
        direction="row"
        alignItems="center"
        flexWrap="wrap"
        gap={1.15}
        sx={{ mb: 0.55, [compactChipMedia]: { mb: 0.25, gap: 0.5 } }}
      >
        <LegendItem
          color={semanticTokens.market.gain}
          label={t("Pages.Detail.Chip.institutionalBuyingLegend")}
        />
        <LegendItem
          color={semanticTokens.market.loss}
          label={t("Pages.Detail.Chip.institutionalSellingLegend")}
        />
        <LegendItem
          color={semanticTokens.analysis.text}
          label={t("Pages.Detail.Chip.cumulativeInstitutionalLegend")}
          line
        />
      </Stack>

      <Box
        role="img"
        aria-label={
          t("Pages.Detail.Chip.dailyInstitutional") + "; " +
          t("Pages.Detail.Chip.institutionalLegend")
        }
        sx={{
          flex: 1,
          minHeight: 0,
          bgcolor: semanticTokens.analysis.panelMuted,
          borderTop: "1px solid " + semanticTokens.analysis.dividerSubtle,
          overflow: "hidden",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 16, right: 0, bottom: 4, left: 0 }}
          >
            <CartesianGrid
              stroke={semanticTokens.analysis.dividerSubtle}
              strokeDasharray="3 5"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: semanticTokens.analysis.textMuted, fontSize: 11 }}
              axisLine={{ stroke: semanticTokens.analysis.divider }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={20}
            />
            <YAxis
              yAxisId="flow"
              width={42}
              tick={{ fill: semanticTokens.analysis.textMuted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => number.format(value)}
            />
            <YAxis
              yAxisId="cumulative"
              orientation="right"
              width={42}
              tickCount={3}
              domain={[
                (dataMin: number) => Math.min(dataMin, 0),
                (dataMax: number) => Math.max(dataMax, 0),
              ]}
              padding={{ top: 12, bottom: 12 }}
              tick={{ fill: semanticTokens.analysis.textMuted, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => number.format(value)}
            />
            <Tooltip
              content={<TrendTooltip number={number} />}
              cursor={{ fill: semanticTokens.analysis.surfaceSubtle }}
              wrapperStyle={{
                zIndex: primitiveTokens.layer.raised,
                pointerEvents: "none",
              }}
            />
            <ReferenceLine
              yAxisId="flow"
              y={0}
              stroke={semanticTokens.analysis.textMuted}
              strokeWidth={1}
            />
            <Bar
              yAxisId="flow"
              dataKey="institutionalLots"
              name="institutionalLots"
              maxBarSize={16}
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            >
              {chartData.map((day) => (
                <Cell
                  key={day.date}
                  fill={
                    day.institutionalLots >= 0
                      ? semanticTokens.market.gain
                      : semanticTokens.market.loss
                  }
                  fillOpacity={0.82}
                />
              ))}
            </Bar>
            <Line
              yAxisId="cumulative"
              dataKey="institutionalCumulativeLots"
              stroke={semanticTokens.analysis.text}
              strokeWidth={1.75}
              dot={false}
              activeDot={{
                r: 3.5,
                fill: semanticTokens.analysis.text,
                stroke: semanticTokens.analysis.canvas,
                strokeWidth: 2,
              }}
              tooltipType="none"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </SectionCard>
  );
}

function LegendItem({
  color,
  label,
  line = false,
}: {
  color: string;
  label: string;
  line?: boolean;
}) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Box
        aria-hidden="true"
        sx={{
          width: line ? 14 : 8,
          height: line ? 2 : 8,
          borderRadius: line ? 1 : 0.5,
          bgcolor: color,
        }}
      />
      <Typography
        variant="caption"
        color={semanticTokens.analysis.textMuted}
        sx={{ fontSize: 10.5 }}
      >
        {label}
      </Typography>
    </Stack>
  );
}
