import {
  Box,
  Button,
  InputAdornment,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { stockDailyQueryBuilder } from "../../classes/StockDailyQueryBuilder";
import { stockHourlyQueryBuilder } from "../../classes/StockHourlyQueryBuilder";
import { stockWeeklyQueryBuilder } from "../../classes/StockWeeklyQueryBuilder";
import { Prompts, StorePrompt } from "../../types";

type TimeFrame = "hour" | "day" | "week";

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.2),
  borderRadius: "12px",
  padding: "4px",
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  "& .MuiToggleButton-root": {
    border: "none",
    borderRadius: "8px",
    margin: "0 2px",
    padding: "6px 16px",
    fontWeight: 700,
    color: theme.palette.text.secondary,
    "&.Mui-selected": {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      "&:hover": {
        backgroundColor: theme.palette.primary.dark,
      },
    },
  },
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  borderRadius: "10px",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: alpha(theme.palette.divider, 0.1),
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: alpha(theme.palette.primary.main, 1),
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.main,
  },
}));

function ExpressionGenerator({
  setHourlyPrompts,
  setDailyPrompts,
  setWeekPrompts,
}: {
  setHourlyPrompts: Dispatch<SetStateAction<Prompts>>;
  setDailyPrompts: Dispatch<SetStateAction<Prompts>>;
  setWeekPrompts: Dispatch<SetStateAction<Prompts>>;
}) {
  const { t } = useTranslation();
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("day");

  // Helper to get current builder options
  const currentOptions = useMemo(() => {
    switch (timeFrame) {
      case "hour":
        return stockHourlyQueryBuilder.getOptions();
      case "week":
        return stockWeeklyQueryBuilder.getOptions();
      case "day":
      default:
        return stockDailyQueryBuilder.getOptions();
    }
  }, [timeFrame]);

  const [selects, setSelects] = useState<StorePrompt>({
    day1: currentOptions.timeOptions[0],
    indicator1: currentOptions.indicators[0],
    operator: currentOptions.operators[0],
    day2: currentOptions.timeOptions[0],
    indicator2: currentOptions.indicators[0],
  });

  const handleTimeFrameChange = (
    _event: React.MouseEvent<HTMLElement>,
    newTimeFrame: TimeFrame,
  ) => {
    if (newTimeFrame !== null) {
      setTimeFrame(newTimeFrame);

      // We need to fetch the options for the NEW timeFrame immediately
      let newOptions;
      switch (newTimeFrame) {
        case "hour":
          newOptions = stockHourlyQueryBuilder.getOptions();
          break;
        case "week":
          newOptions = stockWeeklyQueryBuilder.getOptions();
          break;
        case "day":
        default:
          newOptions = stockDailyQueryBuilder.getOptions();
          break;
      }

      setSelects({
        day1: newOptions.timeOptions[0],
        indicator1: newOptions.indicators[0],
        operator: newOptions.operators[0],
        day2: newOptions.timeOptions[0],
        indicator2: newOptions.indicators[0],
      });
    }
  };

  const handleChange = (event: SelectChangeEvent<any>) => {
    const { value, name } = event.target;
    setSelects((prev) => ({
      ...prev,
      [name]: value as string,
    }));
  };

  const handleCustomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setSelects((prev) => ({
      ...prev,
      indicator2: value,
    }));
  };

  const timeOptions = currentOptions.timeOptions;

  const indicators = useMemo(() => {
    // Handling "Other" category logic if present
    if (selects.day1 === "其他" || selects.day2 === "其他") {
      return currentOptions.otherIndicators || [];
    }
    return currentOptions.indicators;
  }, [currentOptions, selects.day1, selects.day2]);

  const operators = currentOptions.operators;

  const currentUnit = useMemo(() => {
    let builder;
    switch (timeFrame) {
      case "hour":
        builder = stockHourlyQueryBuilder;
        break;
      case "week":
        builder = stockWeeklyQueryBuilder;
        break;
      case "day":
      default:
        builder = stockDailyQueryBuilder;
        break;
    }
    const mapping =
      builder.getMapping()[selects.indicator1] ||
      builder.getOthersMapping()[selects.indicator1];
    return mapping?.unit;
  }, [timeFrame, selects.indicator1]);

  return (
    <Box>
      <Stack spacing={1} mb={3}>
        <Typography variant="caption" fontWeight={700} color="text.secondary">
          {t("Pages.Schoice.Prompt.timeFrame")}
        </Typography>
        <StyledToggleButtonGroup
          value={timeFrame}
          exclusive
          onChange={handleTimeFrameChange}
          aria-label="time frame"
          size="small"
        >
          <ToggleButton value="hour" aria-label="hourly">
            {t("Pages.Schoice.Prompt.hourly")}
          </ToggleButton>
          <ToggleButton value="day" aria-label="daily">
            {t("Pages.Schoice.Prompt.daily")}
          </ToggleButton>
          <ToggleButton value="week" aria-label="weekly">
            {t("Pages.Schoice.Prompt.weekly")}
          </ToggleButton>
        </StyledToggleButtonGroup>
      </Stack>

      <Stack spacing={2} direction="row" my={2}>
        <StyledSelect
          value={selects.day1}
          onChange={handleChange}
          name="day1"
          fullWidth
          size="small"
        >
          {timeOptions.map((day) => (
            <MenuItem key={day} value={day}>
              {day}
            </MenuItem>
          ))}
        </StyledSelect>

        <StyledSelect
          value={selects.indicator1}
          onChange={handleChange}
          name="indicator1"
          fullWidth
          size="small"
        >
          {indicators.map((indicator) => (
            <MenuItem key={indicator} value={indicator}>
              {indicator}
            </MenuItem>
          ))}
        </StyledSelect>
      </Stack>
      <Stack mb={2}>
        <StyledSelect
          value={selects.operator}
          onChange={handleChange}
          name="operator"
          fullWidth
          size="small"
        >
          {operators.map((op) => (
            <MenuItem key={op} value={op}>
              {op}
            </MenuItem>
          ))}
        </StyledSelect>
      </Stack>
      <Stack spacing={2} direction="row" mb={3}>
        <StyledSelect
          value={selects.day2}
          onChange={handleChange}
          name="day2"
          fullWidth
          size="small"
        >
          {timeOptions.map((day) => (
            <MenuItem key={day} value={day}>
              {day}
            </MenuItem>
          ))}
        </StyledSelect>

        {selects.day2 === "自定義數值" ? (
          <TextField
            name="indicator2"
            type="number"
            defaultValue={0}
            onChange={handleCustomChange}
            value={selects.indicator2}
            fullWidth
            size="small"
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            slotProps={
              currentUnit
                ? {
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          {currentUnit}
                        </InputAdornment>
                      ),
                    },
                  }
                : undefined
            }
          />
        ) : (
          <StyledSelect
            value={selects.indicator2}
            onChange={handleChange}
            name="indicator2"
            fullWidth
            size="small"
          >
            {indicators.map((indicator) => (
              <MenuItem key={indicator} value={indicator}>
                {indicator}
              </MenuItem>
            ))}
          </StyledSelect>
        )}
      </Stack>

      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={() => {
          if (timeFrame === "hour") {
            setHourlyPrompts((prev) => [...prev, selects]);
          } else if (timeFrame === "day") {
            setDailyPrompts((prev) => [...prev, selects]);
          } else {
            setWeekPrompts((prev) => [...prev, selects]);
          }
        }}
        sx={{
          borderRadius: "12px",
          py: 1.2,
          fontWeight: 700,
          background: (theme) =>
            `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          boxShadow: (theme) =>
            `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
        }}
      >
        {t("Pages.Schoice.Prompt.addRule")}
      </Button>
    </Box>
  );
}

export default ExpressionGenerator;
