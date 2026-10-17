import {
  CheckCircleOutlineRounded,
  InsightsRounded,
  RemoveRounded,
  WarningAmberRounded,
} from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { ChipData } from "../../../api/marketApi";
import { primitiveTokens, semanticTokens } from "../../../theme";
import { compactChipMedia, SectionCard } from "./chipUi";

const positiveSignals = new Set<ChipData["signals"][number]>([
  "price_down_institution_buy",
  "trust_streak",
]);

export default function AnalysisPanel({ data }: { data: ChipData }) {
  const { t } = useTranslation();

  return (
    <Stack spacing={1}>
      <SectionCard
        id="signal-title"
        title={t("Pages.Detail.Chip.signals")}
        icon={<InsightsRounded />}
      >
        {data.signals.length > 0 ? (
          <Stack component="ul" sx={{ p: 0, m: 0 }}>
            {data.signals.map((signal) => {
              const positive = positiveSignals.has(signal);
              const color = positive
                ? semanticTokens.market.gain
                : semanticTokens.market.warning;
              return (
                <Stack
                  component="li"
                  key={signal}
                  direction="row"
                  alignItems="flex-start"
                  spacing={0.7}
                  sx={{
                    listStyle: "none",
                    py: 0.7,
                    borderBottom: "1px solid " + semanticTokens.analysis.dividerSubtle,
                    "&:last-child": { borderBottom: 0 },
                    [compactChipMedia]: { py: 0.35 },
                  }}
                >
                  {positive ? (
                    <CheckCircleOutlineRounded
                      aria-hidden="true"
                      sx={{ color, fontSize: 16, mt: 0.08 }}
                    />
                  ) : (
                    <WarningAmberRounded
                      aria-hidden="true"
                      sx={{ color, fontSize: 16, mt: 0.08 }}
                    />
                  )}
                  <Typography
                    variant="body2"
                    color={semanticTokens.analysis.text}
                    sx={{ fontSize: 12.5, lineHeight: 1.4, [compactChipMedia]: { fontSize: 11, lineHeight: 1.25 } }}
                  >
                    {t("Pages.Detail.Chip.signal." + signal)}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
        ) : (
          <Stack direction="row" alignItems="center" spacing={0.7} sx={{ py: 0.65 }}>
            <RemoveRounded
              aria-hidden="true"
              sx={{ color: semanticTokens.market.neutral, fontSize: 16 }}
            />
            <Typography variant="body2" color={semanticTokens.analysis.textMuted}>
              {t("Pages.Detail.Chip.noSignals")}
            </Typography>
          </Stack>
        )}
      </SectionCard>

      <SectionCard
        id="score-breakdown"
        title={t("Pages.Detail.Chip.scoreBreakdown")}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          }}
        >
          <ScoreCell label={t("Pages.Detail.Chip.baseScore")} points={50} base />
          {data.scoreBreakdown.map((item) => (
            <ScoreCell
              key={item.factor}
              label={t("Pages.Detail.Chip.factor." + item.factor)}
              points={item.points}
            />
          ))}
        </Box>
      </SectionCard>
    </Stack>
  );
}

function ScoreCell({
  label,
  points,
  base = false,
}: {
  label: string;
  points: number;
  base?: boolean;
}) {
  const color = base
    ? semanticTokens.analysis.text
    : points > 0
      ? semanticTokens.market.gain
      : points < 0
        ? semanticTokens.market.loss
        : semanticTokens.market.neutral;

  return (
    <Box
      sx={{
        minWidth: 0,
        minHeight: 54,
        px: 0.65,
        py: 0.45,
        borderRight: "1px solid " + semanticTokens.analysis.dividerSubtle,
        borderBottom: "1px solid " + semanticTokens.analysis.dividerSubtle,
        "&:nth-of-type(3n)": { borderRight: 0 },
        "&:nth-last-of-type(-n + 3)": { borderBottom: 0 },
        [compactChipMedia]: { minHeight: 40, py: 0.25 },
      }}
    >
      <Typography
        variant="caption"
        color={semanticTokens.analysis.textMuted}
        sx={{
          display: "-webkit-box",
          minHeight: 26,
          overflow: "hidden",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
          fontSize: 10.5,
          lineHeight: 1.2,
          [compactChipMedia]: { minHeight: 20, fontSize: 10 },
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        color={color}
        fontWeight={750}
        sx={{
          mt: 0.2,
          fontFamily: primitiveTokens.font.numeric,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {(!base && points > 0 ? "+" : "") + points}
      </Typography>
    </Box>
  );
}
