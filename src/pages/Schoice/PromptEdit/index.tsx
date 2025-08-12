import { Box, Button, Container, Grid, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import useSchoiceStore from "../../../store/Schoice.store";
import { Prompts } from "../../../types";
import ExpressionGenerator from "../parts/ExpressionGenerator";
import PromptName from "../parts/PromptName";

export default function PromptEdit() {
  const { id } = useParams();
  const { edit, select, selectObj } = useSchoiceStore();
  const [dailyPrompts, setDailyPrompts] = useState<Prompts>(
    select?.value.daily || []
  );
  const [weekPrompts, setWeekPrompts] = useState<Prompts>(
    select?.value.weekly || []
  );
  const [hourlyPrompts, setHourlyPrompts] = useState<Prompts>(
    select?.value.hourly || []
  );
  const [name, setName] = useState(select?.name || "");
  const navigate = useNavigate();

  const handleEdit = async () => {
    if (id && select) {
      await edit(
        id,
        name,
        {
          daily: dailyPrompts,
          weekly: weekPrompts,
          hourly: hourlyPrompts,
        },
        select.type
      );
      selectObj(id, select.type);
      navigate("/schoice");
    }
  };

  const handleRemove = (type: "hourly" | "daily" | "weekly", index: number) => {
    switch (type) {
      case "hourly":
        setHourlyPrompts(hourlyPrompts.filter((_, i) => i !== index));
        break;
      case "daily":
        setDailyPrompts(dailyPrompts.filter((_, i) => i !== index));
        break;
      case "weekly":
        setWeekPrompts(weekPrompts.filter((_, i) => i !== index));
        break;
    }
  };

  const handleCancel = () => {
    navigate("/schoice");
  };
  if (!select)
    return (
      <Typography variant="h5" gutterBottom>
        找不到資料
      </Typography>
    );
  return (
    <Grid container>
      <Grid size={6}>
        <Container>
          <Typography
            variant="h5"
            gutterBottom
            mt={2}
            textTransform="uppercase"
          >
            {select?.type} Name
          </Typography>
          <Typography variant="body2" gutterBottom>
            {id}
          </Typography>
          <PromptName {...{ name, setName }} />

          <ExpressionGenerator
            {...{
              setHourlyPrompts,
              setDailyPrompts,
              setWeekPrompts,
            }}
          />
        </Container>
      </Grid>
      <Grid size={6}>
        <Container>
          <Typography variant="h5" gutterBottom my={2}>
            已加入的小時線條件
          </Typography>
          <Box border="1px solid #000" borderRadius={1} p={2} mb={2}>
            {hourlyPrompts.length === 0 && (
              <Typography variant="body2" gutterBottom>
                空
              </Typography>
            )}
            {hourlyPrompts.map((prompt, index) => (
              <Typography key={index} variant="body2" gutterBottom>
                {index + 1}.{" "}
                {prompt.day1 +
                  prompt.indicator1 +
                  prompt.operator +
                  prompt.day2 +
                  prompt.indicator2}{" "}
                <Button
                  size="small"
                  color="error"
                  onClick={() => handleRemove("hourly", index)}
                >
                  Remove
                </Button>
              </Typography>
            ))}
          </Box>
          <Typography variant="h5" gutterBottom my={2}>
            已加入的日線條件
          </Typography>
          <Box border="1px solid #000" borderRadius={1} p={2} mb={2}>
            {dailyPrompts.length === 0 && (
              <Typography variant="body2" gutterBottom>
                空
              </Typography>
            )}
            {dailyPrompts.map((prompt, index) => (
              <Typography key={index} variant="body2" gutterBottom>
                {index + 1}.{" "}
                {prompt.day1 +
                  prompt.indicator1 +
                  prompt.operator +
                  prompt.day2 +
                  prompt.indicator2}{" "}
                <Button
                  size="small"
                  color="error"
                  onClick={() => handleRemove("daily", index)}
                >
                  Remove
                </Button>
              </Typography>
            ))}
          </Box>

          <Typography variant="h5" gutterBottom my={2}>
            已加入的週線條件
          </Typography>
          <Box border="1px solid #000" borderRadius={1} p={2} mb={2}>
            {weekPrompts.length === 0 && (
              <Typography variant="body2" gutterBottom>
                空
              </Typography>
            )}
            {weekPrompts.map((prompt, index) => (
              <Typography key={index} variant="body2" gutterBottom>
                {index + 1}.{" "}
                {prompt.day1 +
                  prompt.indicator1 +
                  prompt.operator +
                  prompt.day2 +
                  prompt.indicator2}{" "}
                <Button
                  size="small"
                  color="error"
                  onClick={() => handleRemove("weekly", index)}
                >
                  Remove
                </Button>
              </Typography>
            ))}
          </Box>

          <Stack direction="row" spacing={2}>
            <Button
              onClick={handleCancel}
              fullWidth
              variant="contained"
              color="error"
            >
              取消
            </Button>
            <Button
              onClick={handleEdit}
              fullWidth
              variant="contained"
              disabled={
                (hourlyPrompts.length === 0 &&
                  dailyPrompts.length === 0 &&
                  weekPrompts.length === 0) ||
                name === ""
              }
              color="success"
            >
              修改
            </Button>
          </Stack>
        </Container>
      </Grid>
    </Grid>
  );
}
