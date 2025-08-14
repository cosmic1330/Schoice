import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Grid } from "@mui/material";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import useCloudStore from "../../../../../store/Cloud.store";
import { PromptValue, SelectType } from "../../../../../types";

export default function Summary({ select }: { select: SelectType | null }) {
  const { bears, bulls } = useCloudStore();
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
    <Accordion sx={{ width: "100%" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="body1">策略內容</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          <Grid size={3}>
            <Typography variant="h6" gutterBottom>
              小時線
            </Typography>
            {conditions.hourly?.map((prompt, index) => (
              <Typography key={index} variant="body1">
                {index + 1}.
                {prompt.day1 +
                  prompt.indicator1 +
                  prompt.operator +
                  prompt.day2 +
                  prompt.indicator2}
              </Typography>
            ))}
          </Grid>
          <Grid size={3}>
            <Typography variant="h6" gutterBottom>
              日線
            </Typography>
            {conditions.daily?.map((prompt, index) => (
              <Typography key={index} variant="body1">
                {index + 1}.
                {prompt.day1 +
                  prompt.indicator1 +
                  prompt.operator +
                  prompt.day2 +
                  prompt.indicator2}
              </Typography>
            ))}
          </Grid>
          <Grid size={3}>
            <Typography variant="h6" gutterBottom>
              週線
            </Typography>
            {conditions.weekly?.map((prompt, index) => (
              <Typography key={index} variant="body1">
                {index + 1}.
                {prompt.day1 +
                  prompt.indicator1 +
                  prompt.operator +
                  prompt.day2 +
                  prompt.indicator2}
              </Typography>
            ))}
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}
