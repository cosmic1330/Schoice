import { Box, Button, Container, Grid, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import ExpressionGenerator from "../../../components/Prompt/ExpressionGenerator";
import PromptChart from "../../../components/Prompt/PromptChart";
import PromptName from "../../../components/Prompt/PromptName";
import { useUser } from "../../../context/UserContext";
import useExampleData from "../../../hooks/useExampleData";
import useCloudStore from "../../../store/Cloud.store";
import useSchoiceStore from "../../../store/Schoice.store";
import { Prompts } from "../../../types";

export default function PromptEdit() {
  const { id } = useParams();
  const { select, setSelect } = useSchoiceStore();
  const { edit, bears, bulls } = useCloudStore();
  const { user } = useUser();
  const [dailyPrompts, setDailyPrompts] = useState<Prompts>([]);
  const [weekPrompts, setWeekPrompts] = useState<Prompts>([]);
  const [hourlyPrompts, setHourlyPrompts] = useState<Prompts>([]);
  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const {
    hour: hourlyData,
    day: dailyData,
    week: weeklyData,
  } = useExampleData();

  const handleEdit = async () => {
    if (!(id && select && user)) return;
    setIsEditing(true);
    try {
      await edit(
        id,
        name,
        {
          daily: dailyPrompts,
          weekly: weekPrompts,
          hourly: hourlyPrompts,
        },
        select.type,
        user.id
      );
      setSelect({ prompt_id: id, type: select.type });
      navigate("/schoice");
    } finally {
      setIsEditing(false);
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
  useEffect(() => {
    if (select) {
      if (select.type === "bull") {
        setName(bulls[select.prompt_id]?.name || "");
        setDailyPrompts(bulls[select.prompt_id]?.conditions.daily || []);
        setWeekPrompts(bulls[select.prompt_id]?.conditions.weekly || []);
        setHourlyPrompts(bulls[select.prompt_id]?.conditions.hourly || []);
      } else if (select.type === "bear") {
        setName(bears[select.prompt_id]?.name || "");
        setDailyPrompts(bears[select.prompt_id]?.conditions.daily || []);
        setWeekPrompts(bears[select.prompt_id]?.conditions.weekly || []);
        setHourlyPrompts(bears[select.prompt_id]?.conditions.hourly || []);
      }
    }
  }, [select, bulls, bears]);

  if (!select) {
    return <Typography variant="h6">No prompt selected</Typography>;
  }

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
                name === "" ||
                isEditing
              }
              color="success"
            >
              {isEditing ? "修改中…" : "修改"}
            </Button>
          </Stack>
        </Container>
      </Grid>
      <Grid size={6}>
        <PromptChart
          hourlyPrompts={hourlyPrompts}
          dailyPrompts={dailyPrompts}
          weeklyPrompts={weekPrompts}
          hourlyData={hourlyData}
          dailyData={dailyData}
          weeklyData={weeklyData}
        />
      </Grid>
    </Grid>
  );
}
