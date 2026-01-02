import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import { Box, Grid, Stack } from "@mui/material";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Typography from "@mui/material/Typography";
import { alpha, styled } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useCloudStore from "../../../../../store/Cloud.store";
import { PromptValue, SelectType } from "../../../../../types";

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  width: "100%",
  backgroundColor: alpha(theme.palette.background.paper, 0.4),
  backdropFilter: "blur(20px)",
  borderRadius: "24px !important",
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
  overflow: "hidden",
  "&:before": {
    display: "none",
  },
  "& .MuiAccordionSummary-root": {
    backgroundColor: alpha(theme.palette.divider, 0.03),
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
    padding: theme.spacing(1, 3),
  },
  "& .MuiAccordionDetails-root": {
    padding: theme.spacing(4, 3),
  },
}));

const ConditionItem = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  borderRadius: "12px",
  backgroundColor: alpha(theme.palette.divider, 0.03),
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  marginBottom: theme.spacing(1.5),
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  fontFamily: "monospace",
  fontSize: "0.85rem",
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    borderColor: alpha(theme.palette.primary.main, 0.3),
    transform: "translateX(4px)",
  },
}));

const CategoryTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 800,
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: theme.spacing(2),
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export default function Summary({ select }: { select: SelectType | null }) {
  const { bears, bulls } = useCloudStore();
  const { t } = useTranslation();
  const [conditions, setConditions] = useState<PromptValue>({
    hourly: [],
    daily: [],
    weekly: [],
  });

  useEffect(() => {
    if (select) {
      const bull = bulls[select.prompt_id];
      const bear = bears[select.prompt_id];
      if (bull && select.type === "bull") {
        setConditions(bull.conditions);
      } else if (bear && select.type === "bear") {
        setConditions(bear.conditions);
      } else {
        setConditions({ hourly: [], daily: [], weekly: [] });
      }
    }
  }, [select, bulls, bears]);

  return (
    <StyledAccordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={1} alignItems="center">
          <HubRoundedIcon color="primary" fontSize="small" />
          <Typography
            variant="subtitle2"
            fontWeight={800}
            sx={{ letterSpacing: "0.05em" }}
          >
            {t("Pages.Schoice.PromptList.logic.title")}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <CategoryTitle>
              {t("Pages.Schoice.PromptList.logic.hourly")}
            </CategoryTitle>
            {conditions.hourly?.length > 0 ? (
              conditions.hourly.map((prompt, index) => (
                <ConditionItem key={index}>
                  <Typography
                    variant="caption"
                    sx={{ opacity: 0.5, fontWeight: 900 }}
                  >
                    {index + 1}
                  </Typography>
                  {`${prompt.day1} ${prompt.indicator1} ${prompt.operator} ${prompt.day2} ${prompt.indicator2}`}
                </ConditionItem>
              ))
            ) : (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontStyle: "italic", px: 1 }}
              >
                {t("Pages.Schoice.PromptList.logic.noHourly")}
              </Typography>
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <CategoryTitle>
              {t("Pages.Schoice.PromptList.logic.daily")}
            </CategoryTitle>
            {conditions.daily?.length > 0 ? (
              conditions.daily.map((prompt, index) => (
                <ConditionItem key={index}>
                  <Typography
                    variant="caption"
                    sx={{ opacity: 0.5, fontWeight: 900 }}
                  >
                    {index + 1}
                  </Typography>
                  {`${prompt.day1} ${prompt.indicator1} ${prompt.operator} ${prompt.day2} ${prompt.indicator2}`}
                </ConditionItem>
              ))
            ) : (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontStyle: "italic", px: 1 }}
              >
                {t("Pages.Schoice.PromptList.logic.noDaily")}
              </Typography>
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <CategoryTitle>
              {t("Pages.Schoice.PromptList.logic.weekly")}
            </CategoryTitle>
            {conditions.weekly?.length > 0 ? (
              conditions.weekly.map((prompt, index) => (
                <ConditionItem key={index}>
                  <Typography
                    variant="caption"
                    sx={{ opacity: 0.5, fontWeight: 900 }}
                  >
                    {index + 1}
                  </Typography>
                  {`${prompt.day1} ${prompt.indicator1} ${prompt.operator} ${prompt.day2} ${prompt.indicator2}`}
                </ConditionItem>
              ))
            ) : (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontStyle: "italic", px: 1 }}
              >
                {t("Pages.Schoice.PromptList.logic.noWeekly")}
              </Typography>
            )}
          </Grid>
        </Grid>
      </AccordionDetails>
    </StyledAccordion>
  );
}
