import { Button, Container, Grid, Typography } from "@mui/material";
import { nanoid } from "nanoid";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import useSchoiceStore from "../../../store/Schoice.store";
import { Prompts, PromptType } from "../../../types";
import ExpressionGenerator from "../parts/ExpressionGenerator";
import { PromptList } from "../parts/PromptList";
import PromptName from "../parts/PromptName";

type PromptCategory = "hourly" | "daily" | "weekly";

export default function PromptAdd() {
  const { increase, selectObj } = useSchoiceStore();
  const [prompts, setPrompts] = useState<Record<PromptCategory, Prompts>>({
    hourly: [],
    daily: [],
    weekly: [],
  });

  const [name, setName] = useState(nanoid());
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const promptType = searchParams.get("promptType");
  const navigate = useNavigate();

  const handleCreate = async () => {
    const id = await increase(
      name,
      prompts,
      promptType === "bulls" ? PromptType.BULLS : PromptType.BEAR
    );
    if (id)
      selectObj(
        id,
        promptType === "bulls" ? PromptType.BULLS : PromptType.BEAR
      );
    navigate("/schoice");
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
              setHourlyPrompts: (newPrompts) =>
                setPrompts((p) => ({ ...p, hourly: newPrompts(p.hourly) })),
              setDailyPrompts: (newPrompts) =>
                setPrompts((p) => ({ ...p, daily: newPrompts(p.daily) })),
              setWeekPrompts: (newPrompts) =>
                setPrompts((p) => ({ ...p, weekly: newPrompts(p.weekly) })),
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
              name === ""
            }
            color="success"
          >
            建立
          </Button>
        </Container>
      </Grid>
    </Grid>
  );
}
