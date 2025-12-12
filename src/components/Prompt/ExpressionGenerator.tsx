import {
  Box,
  Button,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import {
  stockDailyQueryBuilder,
} from "../../classes/StockDailyQueryBuilder";
import {
  stockHourlyQueryBuilder,
} from "../../classes/StockHourlyQueryBuilder";
import {
  stockWeeklyQueryBuilder,
} from "../../classes/StockWeeklyQueryBuilder";
import { Prompts, StorePrompt } from "../../types";

type TimeFrame = "hour" | "day" | "week";

function ExpressionGenerator({
  setHourlyPrompts,
  setDailyPrompts,
  setWeekPrompts,
}: {
  setHourlyPrompts: Dispatch<SetStateAction<Prompts>>;
  setDailyPrompts: Dispatch<SetStateAction<Prompts>>;
  setWeekPrompts: Dispatch<SetStateAction<Prompts>>;
}) {
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
    newTimeFrame: TimeFrame
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

  const handleChange = (event: SelectChangeEvent<string>) => {
    const { value, name } = event.target;
    setSelects((prev) => ({
      ...prev,
      [name]: value,
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
    if (
      selects.day1 === "其他" ||
      selects.day2 === "其他"
    ) {
      return currentOptions.otherIndicators || [];
    }
    return currentOptions.indicators;
  }, [currentOptions, selects.day1, selects.day2]);

  const operators = currentOptions.operators;

  return (
    <Box>
      <Stack spacing={2} direction="row" alignItems="center" mb={2}>
        <ToggleButtonGroup
          value={timeFrame}
          exclusive
          onChange={handleTimeFrameChange}
          aria-label="時間週期"
        >
          <ToggleButton value="hour" aria-label="小時線">
            小時線
          </ToggleButton>
          <ToggleButton value="day" aria-label="日線">
            日線
          </ToggleButton>
          <ToggleButton value="week" aria-label="週線">
            週線
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Stack spacing={2} direction="row" my={2}>
        <Select
          value={selects.day1}
          onChange={handleChange}
          name="day1"
          fullWidth
        >
          {timeOptions.map((day) => (
            <MenuItem key={day} value={day}>
              {day}
            </MenuItem>
          ))}
        </Select>

        <Select
          value={selects.indicator1}
          onChange={handleChange}
          name="indicator1"
          fullWidth
        >
          {indicators.map((indicator) => (
            <MenuItem key={indicator} value={indicator}>
              {indicator}
            </MenuItem>
          ))}
        </Select>
      </Stack>
      <Stack mb={2}>
        <Select
          value={selects.operator}
          onChange={handleChange}
          name="operator"
          fullWidth
        >
          {operators.map((op) => (
            <MenuItem key={op} value={op}>
              {op}
            </MenuItem>
          ))}
        </Select>
      </Stack>
      <Stack spacing={2} direction="row" mb={2}>
        <Select
          value={selects.day2}
          onChange={handleChange}
          name="day2"
          fullWidth
        >
          {timeOptions.map((day) => (
            <MenuItem key={day} value={day}>
              {day}
            </MenuItem>
          ))}
        </Select>

        {selects.day2 === "自定義數值" ? (
          <TextField
            name="indicator2"
            type="number"
            defaultValue={0}
            onChange={handleCustomChange}
            value={selects.indicator2}
          />
        ) : (
          <Select
            value={selects.indicator2}
            onChange={handleChange}
            name="indicator2"
            fullWidth
          >
            {indicators.map((indicator) => (
              <MenuItem key={indicator} value={indicator}>
                {indicator}
              </MenuItem>
            ))}
          </Select>
        )}
      </Stack>

      <Button
        variant="contained"
        fullWidth
        onClick={() => {
          if (timeFrame === "hour") {
            setHourlyPrompts((prev) => [...prev, selects]);
          } else if (timeFrame === "day") {
            setDailyPrompts((prev) => [...prev, selects]);
          } else {
            setWeekPrompts((prev) => [...prev, selects]);
          }
        }}
      >
        加入規則
      </Button>
    </Box>
  );
}

export default ExpressionGenerator;
