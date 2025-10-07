import { Button, Container, Grid, Typography } from "@mui/material";
import { nanoid } from "nanoid";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import ExpressionGenerator from "../../../components/Prompt/ExpressionGenerator";
import PromptChart from "../../../components/Prompt/PromptChart";
import { PromptList } from "../../../components/Prompt/PromptList";
import PromptName from "../../../components/Prompt/PromptName";
import { useUser } from "../../../context/UserContext";
import useExampleData from "../../../hooks/useExampleData";
import useCloudStore from "../../../store/Cloud.store";
import useSchoiceStore from "../../../store/Schoice.store";
import { Prompts, PromptType, RequirementPrompt } from "../../../types";

type PromptCategory = "hourly" | "daily" | "weekly";

export default function PromptAdd() {
  const { setSelect } = useSchoiceStore();
  const { increase } = useCloudStore();
  const { user } = useUser();
  const [prompts, setPrompts] = useState<Record<PromptCategory, Prompts>>({
    hourly: [],
    daily: [],
    weekly: [],
  });
  const [specialRequirement, setSpecialRequirement] = useState<
    RequirementPrompt[]
  >([]);

  const [name, setName] = useState(nanoid());
  const [isCreating, setIsCreating] = useState(false);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const promptType = searchParams.get("promptType");
  const navigate = useNavigate();
  const {
    hour: hourlyData,
    day: dailyData,
    week: weeklyData,
  } = useExampleData();

  const handleCreate = async () => {
    if (!user) {
      return;
    }
    setIsCreating(true);
    try {
      const id = await increase(
        name,
        prompts,
        promptType === "bull" ? PromptType.BULL : PromptType.BEAR,
        user.id
      );
      if (id)
        setSelect({
          prompt_id: id,
          type: promptType === "bull" ? PromptType.BULL : PromptType.BEAR,
        });
      navigate("/schoice");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRemove = (type: PromptCategory, index: number) => {
    setPrompts((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const promptCategories: { type: PromptCategory; title: string }[] = [
    { type: "hourly", title: "已加入的小時線條件" },
    { type: "daily", title: "已加入的日線條件" },
    { type: "weekly", title: "已加入的週線條件" },
  ];

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
            {promptType} Name
          </Typography>
          <PromptName {...{ name, setName }} />

          <ExpressionGenerator
            {...{
              promptType,
              setHourlyPrompts: (newPrompts: any) =>
                setPrompts((p) => ({ ...p, hourly: newPrompts(p.hourly) })),
              setDailyPrompts: (newPrompts: any) =>
                setPrompts((p) => ({ ...p, daily: newPrompts(p.daily) })),
              setWeekPrompts: (newPrompts: any) =>
                setPrompts((p) => ({ ...p, weekly: newPrompts(p.weekly) })),
              setSpecialRequirement,
              specialRequirement,
            }}
          />
        </Container>
      </Grid>
      <Grid size={6}>
        <Container>
          {promptCategories.map(({ type, title }) => (
            <PromptList
              key={type}
              title={title}
              prompts={prompts[type]}
              onRemove={(index) => handleRemove(type, index)}
            />
          ))}

          <Button
            onClick={handleCreate}
            fullWidth
            variant="contained"
            disabled={
              (prompts.hourly.length === 0 &&
                prompts.daily.length === 0 &&
                prompts.weekly.length === 0) ||
              name === "" ||
              isCreating
            }
            color="success"
          >
            {isCreating ? "建立中…" : "建立"}
          </Button>
        </Container>
      </Grid>
      <Grid size={6}>
        <PromptChart
          hourlyPrompts={prompts.hourly}
          dailyPrompts={prompts.daily}
          weeklyPrompts={prompts.weekly}
          hourlyData={hourlyData}
          dailyData={dailyData}
          weeklyData={weeklyData}
          specialRequirement={specialRequirement}
        />
      </Grid>
    </Grid>
  );
}
