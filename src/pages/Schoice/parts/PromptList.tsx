import { Box, Button, Typography } from "@mui/material";
import { Prompts } from "../../../types";

interface PromptListProps {
  title: string;
  prompts: Prompts;
  onRemove: (index: number) => void;
}

export function PromptList({ title, prompts, onRemove }: PromptListProps) {
  return (
    <>
      <Typography variant="h5" gutterBottom my={2}>
        {title}
      </Typography>
      <Box border="1px solid #000" borderRadius={1} p={2} mb={2}>
        {prompts.length === 0 && (
          <Typography variant="body2" gutterBottom>
            空
          </Typography>
        )}
        {prompts.map((prompt, index) => (
          <Typography key={index} variant="body2" gutterBottom>
            {index + 1}. {Object.values(prompt).join("")}{" "}
            <Button
              size="small"
              color="error"
              onClick={() => onRemove(index)}
            >
              Remove
            </Button>
          </Typography>
        ))}
      </Box>
    </>
  );
}
