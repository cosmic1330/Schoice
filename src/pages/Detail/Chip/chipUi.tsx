import ArrowDownwardRounded from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRounded from "@mui/icons-material/ArrowUpwardRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import RemoveRounded from "@mui/icons-material/RemoveRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { ChipData } from "../../../api/marketApi";
import { primitiveTokens, semanticTokens } from "../../../theme";

export type LightStatus =
  | ChipData["lights"]["institutional"]
  | ChipData["lights"]["foreignHolding"]
  | ChipData["lights"]["lendingPressure"];

type Tone = "positive" | "negative" | "warning" | "neutral";

export type ChipTypographyMode = "default" | "overview";

// The detail webview opens at a short desktop height. Apply density reductions
// at every width, while reserving the two-by-two overview grid for wider panes.
export const compactChipMedia = "@media (max-height: 620px)";
export const compactWideChipMedia =
  "@media (min-width: 600px) and (max-height: 620px)";

const toneColor: Record<Tone, string> = {
  positive: semanticTokens.market.gain,
  negative: semanticTokens.market.loss,
  warning: semanticTokens.market.warning,
  neutral: semanticTokens.market.neutral,
};

const toneForStatus = (status: LightStatus): Tone => {
  if (["buying", "increasing", "easing"].includes(status)) return "positive";
  if (["selling", "decreasing"].includes(status)) return "negative";
  if (status === "high") return "warning";
  return "neutral";
};

function StatusIcon({ tone }: { tone: Tone }) {
  const sx = { fontSize: 15 };
  if (tone === "positive") return <CheckRounded aria-hidden="true" sx={sx} />;
  if (tone === "negative")
    return <ArrowDownwardRounded aria-hidden="true" sx={sx} />;
  if (tone === "warning")
    return <WarningAmberRounded aria-hidden="true" sx={sx} />;
  return <RemoveRounded aria-hidden="true" sx={sx} />;
}

export const createNumberFormatter = (locale: string) =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });

export const signedLots = (
  value: number,
  formatter: Intl.NumberFormat,
) => (value > 0 ? "+" : "") + formatter.format(value / 1000);

export function SectionCard({
  id,
  title,
  meta,
  icon,
  children,
  fill = false,
  hideMetaAtXs = false,
  typography = "default",
}: {
  id: string;
  title: string;
  meta?: string;
  icon?: ReactNode;
  children: ReactNode;
  fill?: boolean;
  hideMetaAtXs?: boolean;
  typography?: ChipTypographyMode;
}) {
  const isOverview = typography === "overview";

  return (
    <Box
      component="section"
      aria-labelledby={id}
      sx={{
        overflow: "hidden",
        height: fill ? "100%" : "auto",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        borderRadius: primitiveTokens.radius.md + "px",
        bgcolor: semanticTokens.analysis.panel,
        border: "1px solid " + semanticTokens.analysis.divider,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{
          minHeight: 36,
          flexShrink: 0,
          px: { xs: 1, sm: 1.25 },
          borderBottom: "1px solid " + semanticTokens.analysis.divider,
          [compactChipMedia]: {
            minHeight: 30,
            px: 0.75,
            "& .MuiSvgIcon-root": { fontSize: 15 },
          },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={0.75} minWidth={0}>
          {icon && (
            <Box
              aria-hidden="true"
              sx={{
                display: "grid",
                placeItems: "center",
                color: semanticTokens.analysis.textMuted,
                "& .MuiSvgIcon-root": { fontSize: 17 },
              }}
            >
              {icon}
            </Box>
          )}
          <Typography
            id={id}
            component="h2"
            variant="subtitle2"
            color={semanticTokens.analysis.text}
            fontWeight={750}
            sx={{
              letterSpacing: "0.01em",
              ...(isOverview
                ? { fontSize: 13, lineHeight: 1.25 }
                : {}),
              [compactChipMedia]: {
                fontSize: isOverview ? 13 : 12,
                ...(isOverview ? { lineHeight: 1.25 } : {}),
              },
            }}
          >
            {title}
          </Typography>
        </Stack>
        {meta && (
          <Typography
            variant="caption"
            color={semanticTokens.analysis.textMuted}
            textAlign="right"
            sx={{
              display: hideMetaAtXs ? { xs: "none", sm: "block" } : "block",
              fontSize: isOverview ? 12 : 11,
              ...(isOverview ? { lineHeight: 1.25 } : {}),
              [compactChipMedia]: { display: "none" },
            }}
          >
            {meta}
          </Typography>
        )}
      </Stack>
      <Box
        sx={{
          px: { xs: 1, sm: 1.25 },
          py: 0.8,
          flex: fill ? 1 : "none",
          minHeight: 0,
          display: fill ? "flex" : "block",
          flexDirection: fill ? "column" : undefined,
          [compactChipMedia]: { px: 0.75, py: 0.5 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export function StatusCard({
  label,
  status,
  detail,
  typography = "default",
}: {
  label: string;
  status: LightStatus;
  detail: string;
  typography?: ChipTypographyMode;
}) {
  const { t } = useTranslation();
  const tone = toneForStatus(status);
  const color = toneColor[tone];
  const isOverview = typography === "overview";

  return (
    <Box
      sx={{
        minWidth: 0,
        minHeight: 58,
        px: 0.5,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.25,
        borderRight: "1px solid " + semanticTokens.analysis.dividerSubtle,
        "&:last-child": { borderRight: 0 },
        [compactChipMedia]: {
          minHeight: isOverview ? 58 : 46,
          px: 0.35,
          gap: isOverview ? 0.2 : 0.1,
        },
      }}
    >
      <Typography
        variant="body2"
        color={semanticTokens.analysis.textMuted}
        sx={{
          fontSize: isOverview ? 12 : 10,
          lineHeight: isOverview ? 1.25 : 1.15,
          textAlign: "center",
          [compactChipMedia]: {
            fontSize: isOverview ? 12 : 10,
            lineHeight: isOverview ? 1.25 : 1.15,
          },
        }}
      >
        {label}
      </Typography>
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.35}
        sx={{ color }}
      >
        <StatusIcon tone={tone} />
        <Typography
          variant="caption"
          color="inherit"
          fontWeight={700}
          noWrap
          sx={
            isOverview
              ? {
                  fontSize: 13,
                  lineHeight: 1.2,
                  [compactChipMedia]: { fontSize: 13 },
                }
              : undefined
          }
        >
          {t("Pages.Detail.Chip.light.status." + status)}
        </Typography>
      </Stack>
      <Typography
        variant="body2"
        color={semanticTokens.analysis.text}
        fontWeight={700}
        textAlign="center"
        noWrap
        sx={{
          fontFamily: primitiveTokens.font.numeric,
          fontVariantNumeric: "tabular-nums",
          ...(isOverview
            ? {
                fontSize: 13,
                lineHeight: 1.25,
                [compactChipMedia]: { fontSize: 13 },
              }
            : {}),
        }}
      >
        {detail}
      </Typography>
    </Box>
  );
}

export function MetricCard({
  label,
  value,
  direction,
  emphasized = false,
  typography = "default",
}: {
  label: string;
  value: string;
  direction?: number;
  emphasized?: boolean;
  typography?: ChipTypographyMode;
}) {
  const directional = direction !== undefined && direction !== 0;
  const isOverview = typography === "overview";
  const color =
    direction === undefined || direction === 0
      ? semanticTokens.analysis.text
      : direction > 0
        ? semanticTokens.market.gain
        : semanticTokens.market.loss;

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={0.5}
      sx={{
        minHeight: isOverview ? 32 : 29,
        py: 0.15,
        borderBottom: "1px solid " + semanticTokens.analysis.dividerSubtle,
        "&:last-child": { borderBottom: 0 },
        [compactChipMedia]: {
          minHeight: isOverview ? 32 : 23,
          py: isOverview ? 0.15 : 0,
        },
      }}
    >
      <Typography
        variant="body2"
        color={
          emphasized
            ? semanticTokens.analysis.text
            : semanticTokens.analysis.textMuted
        }
        fontWeight={emphasized ? 700 : 500}
        sx={{
          minWidth: 0,
          fontSize: isOverview ? 12 : { xs: 10, sm: 11.5 },
          lineHeight: 1.2,
          overflowWrap: "anywhere",
          [compactChipMedia]: { fontSize: isOverview ? 12 : 10 },
        }}
      >
        {label}
      </Typography>
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.35}
        sx={{ flexShrink: 0 }}
      >
        {directional &&
          (direction > 0 ? (
            <ArrowUpwardRounded aria-hidden="true" sx={{ color, fontSize: 15 }} />
          ) : (
            <ArrowDownwardRounded aria-hidden="true" sx={{ color, fontSize: 15 }} />
          ))}
        {!directional && direction !== undefined && (
          <RemoveRounded
            aria-hidden="true"
            sx={{ color: semanticTokens.market.neutral, fontSize: 15 }}
          />
        )}
        <Typography
          variant="body2"
          color={color}
          fontWeight={emphasized ? 800 : 700}
          sx={{
            fontFamily: primitiveTokens.font.numeric,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
            textAlign: "right",
            ...(isOverview
              ? {
                  fontSize: 13,
                  lineHeight: 1.2,
                  [compactChipMedia]: { fontSize: 13 },
                }
              : { [compactChipMedia]: { fontSize: 11 } }),
          }}
        >
          {value}
        </Typography>
      </Stack>
    </Stack>
  );
}
