import { Box, Stack, Step, StepButton, Stepper } from "@mui/material";
import React from "react";

interface IchimokuHeaderProps {
  activeStep: number;
  steps: { label: string }[];
  onStepChange: (step: number) => void;
}

const IchimokuHeader: React.FC<IchimokuHeaderProps> = ({
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
