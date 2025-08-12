import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Grid } from "@mui/material";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Typography from "@mui/material/Typography";
import { PromptType, PromptValue } from "../../../../../types";

export default function Summary({
  select,
}: {
  select: {
    id: string;
    name: string;
    value: PromptValue;
    type: PromptType;
  };
}) {
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
            {select.value.hourly?.map((prompt, index) => (
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
            {select.value.daily?.map((prompt, index) => (
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
            {select.value.weekly?.map((prompt, index) => (
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
