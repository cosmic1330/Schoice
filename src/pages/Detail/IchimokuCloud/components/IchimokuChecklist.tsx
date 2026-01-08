import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import React from "react";
import { StepCheck } from "../../../../types";

interface IchimokuChecklistProps {
  activeStepData:
    | {
        description: string;
        checks: StepCheck[];
      }
    | undefined;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pass":
      return <CheckCircleIcon fontSize="small" color="success" />;
    case "fail":
      return <CancelIcon fontSize="small" color="error" />;
    case "manual":
    default:
      return <HelpOutlineIcon fontSize="small" color="disabled" />;
  }
};

const IchimokuChecklist: React.FC<IchimokuChecklistProps> = ({
  activeStepData,
}) => {
  if (!activeStepData) return null;

  return (
    <Card variant="outlined" sx={{ mb: 1, bgcolor: "background.default" }}>
      <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1}
          alignItems="center"
        >
          <Typography variant="subtitle2" color="primary" fontWeight="bold">
            {activeStepData.description}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {activeStepData.checks.map((check, idx) => (
              <Chip
                key={idx}
                icon={getStatusIcon(check.status)}
                label={check.label}
                variant="outlined"
                color={
                  check.status === "pass"
                    ? "success"
                    : check.status === "fail"
                    ? "error"
                    : "default"
                }
                size="small"
              />
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default IchimokuChecklist;
