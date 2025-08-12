import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import { Box, Button, Stack, Tab, Tabs } from "@mui/material";
import { useNavigate } from "react-router";
import useSchoiceStore from "../../../../store/Schoice.store";
import ListItem from "./ListItem";
import { PromptType } from "../../../../types";

export default function ListArea() {
  const { bulls, bears, using, changeUsing } = useSchoiceStore();
  const navigate = useNavigate();
  const handleChange = (_: React.SyntheticEvent, newValue: PromptType) => {
    changeUsing(newValue);
  };

  return (
    <Stack px={1} boxShadow={"2px 0px 4px rgba(0, 0, 0, 0.25)"} spacing={2}>
      <Tabs value={using} onChange={handleChange} variant="fullWidth">
        <Tab
          label="BULLS"
          value={PromptType.BULLS}
          icon={<TrendingUpRoundedIcon />}
        />
        <Tab
          label="BEAR"
          value={PromptType.BEAR}
          icon={<TrendingDownRoundedIcon />}
        />
      </Tabs>
      <Box width={300}>
        {using === PromptType.BULLS
          ? Object.keys(bulls).map((id, index) => (
              <ListItem
                key={index}
                index={index}
                id={id}
                name={bulls[id].name}
                promptType={PromptType.BULLS}
              />
            ))
          : Object.keys(bears).map((id, index) => (
              <ListItem
                key={index}
                index={index}
                id={id}
                name={bears[id].name}
                promptType={PromptType.BEAR}
              />
            ))}
      </Box>
      <Button
        fullWidth
        variant="contained"
        onClick={() => {
          navigate(
            "/schoice/add?promptType=" +
              (using === PromptType.BULLS ? PromptType.BULLS : PromptType.BEAR)
          );
        }}
      >
        Add Filter
      </Button>
    </Stack>
  );
}
