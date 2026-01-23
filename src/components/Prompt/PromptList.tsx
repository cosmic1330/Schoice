import DeleteIcon from "@mui/icons-material/Delete";
import { Box, IconButton, Paper, Stack, Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { Prompts } from "../../types";

const GlassPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  backgroundColor: alpha(theme.palette.background.paper, 0.4),
  backdropFilter: "blur(10px)",
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: "16px",
  boxShadow: "none",
  marginBottom: theme.spacing(3),
}));

const ConditionItem = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(1.5),
  backgroundColor: alpha(theme.palette.background.paper, 0.3),
  borderRadius: "12px",
  marginBottom: theme.spacing(1),
  border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    backgroundColor: alpha(theme.palette.background.paper, 0.5),
    borderColor: alpha(theme.palette.primary.main, 0.2),
    transform: "translateX(4px)",
  },
}));

interface PromptListProps {
  title: string;
  prompts: Prompts;
  onRemove: (index: number) => void;
}

export function PromptList({ title, prompts, onRemove }: PromptListProps) {
  const { t } = useTranslation();

  const renderPrompt = (prompt: any) => {
    const { day1, indicator1, operator, day2, indicator2 } = prompt;
    const day2Value = day2 === "自定義數值" ? `${indicator2}` : indicator2;

    return `${day1} ${indicator1} ${operator} ${day2} ${day2Value}`;
  };

  return (
    <GlassPaper elevation={0}>
      <Typography
        variant="caption"
        fontWeight={800}
        color="text.secondary"
        sx={{
          textTransform: "uppercase",
          mb: 2,
          display: "block",
          letterSpacing: "0.1em",
        }}
      >
        {title}
      </Typography>
      <Box sx={{ minHeight: "40px" }}>
        {prompts.length === 0 && (
          <Typography
            variant="body2"
            color="text.disabled"
            sx={{ fontStyle: "italic", textAlign: "center", py: 2 }}
          >
            {t("Pages.Schoice.Prompt.emptyConditions")}
          </Typography>
        )}
        <Stack spacing={1}>
          {prompts.map((prompt, index) => (
            <ConditionItem key={index}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography
                  variant="caption"
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    backgroundColor: (theme) =>
                      alpha(theme.palette.primary.main, 0.1),
                    color: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}
                >
                  {index + 1}
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="text.primary"
                >
                  {renderPrompt(prompt)}
                </Typography>
              </Stack>
              <IconButton
                size="small"
                color="error"
                onClick={() => onRemove(index)}
                sx={{
                  backgroundColor: (theme) =>
                    alpha(theme.palette.error.main, 0.05),
                  "&:hover": {
                    backgroundColor: (theme) =>
                      alpha(theme.palette.error.main, 0.1),
                  },
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </ConditionItem>
          ))}
        </Stack>
      </Box>
    </GlassPaper>
  );
}
