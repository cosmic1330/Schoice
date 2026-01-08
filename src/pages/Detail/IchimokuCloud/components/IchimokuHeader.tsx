import {
  Box,
  Chip,
  Divider,
  Stack,
  Step,
  StepButton,
  Stepper,
  Tooltip,
  Typography,
} from "@mui/material";
import React from "react";

interface IchimokuHeaderProps {
  score: number;
  recommendation: string;
  activeStep: number;
  steps: { label: string }[];
  onStepChange: (step: number) => void;
}

const IchimokuHeader: React.FC<IchimokuHeaderProps> = ({
  score,
  recommendation,
  activeStep,
  steps,
  onStepChange,
}) => {
  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      sx={{ mb: 1, flexShrink: 0 }}
    >
      <Tooltip
        title={
          <Box sx={{ p: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
              一目均衡表 + CMF 策略
            </Typography>
            <Typography variant="caption" display="block">
              核心邏輯：
            </Typography>
            <Typography variant="caption" display="block">
              1. 結構：價格 &gt; 雲層 (多頭結構)
            </Typography>
            <Typography variant="caption" display="block">
              2. 動能：CMF 資金流入 & TK 金叉
            </Typography>
            <Typography variant="caption" display="block">
              3. 風險：基準線不應下彎 & 無頂背離
            </Typography>
          </Box>
        }
        arrow
      >
        <Typography variant="h6" component="h1" fontWeight="bold" color="white">
          Ichimoku Cloud
        </Typography>
      </Tooltip>

      <Chip
        label={`${score}分 - ${recommendation}`}
        color={score >= 60 ? "success" : "error"}
        variant="outlined"
        size="small"
      />

      <Divider orientation="vertical" flexItem />

      <Box sx={{ flexGrow: 1 }}>
        <Stepper nonLinear activeStep={activeStep}>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepButton color="inherit" onClick={() => onStepChange(index)}>
                {step.label}
              </StepButton>
            </Step>
          ))}
        </Stepper>
      </Box>
    </Stack>
  );
};

export default IchimokuHeader;
