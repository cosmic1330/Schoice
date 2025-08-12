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
import { Dispatch, SetStateAction, useState } from "react";
import { StockDailyQueryBuilder } from "../../../classes/StockDailyQueryBuilder";
import { StockHourlyQueryBuilder } from "../../../classes/StockHourlyQueryBuilder";
import { StockWeeklyQueryBuilder } from "../../../classes/StockWeeklyQueryBuilder";
import { Prompts, StorePrompt } from "../../../types";

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
  const [selects, setSelects] = useState<StorePrompt>({
    day1:
      timeFrame === "hour"
        ? StockHourlyQueryBuilder.options.hours[0]
        : timeFrame === "day"
        ? StockDailyQueryBuilder.options.days[0]
        : StockWeeklyQueryBuilder.options.weeks[0],
    indicator1:
      timeFrame === "hour"
        ? StockHourlyQueryBuilder.options.indicators[0]
        : StockDailyQueryBuilder.options.indicators[0],
    operator: StockDailyQueryBuilder.options.operators[0],
    day2:
      timeFrame === "hour"
        ? StockHourlyQueryBuilder.options.hours[0]
        : timeFrame === "day"
        ? StockDailyQueryBuilder.options.days[0]
        : StockWeeklyQueryBuilder.options.weeks[0],
    indicator2:
      timeFrame === "hour"
        ? StockHourlyQueryBuilder.options.indicators[0]
        : StockDailyQueryBuilder.options.indicators[0],
  });

  const handleTimeFrameChange = (
    _event: React.MouseEvent<HTMLElement>,
    newTimeFrame: TimeFrame
  ) => {
    if (newTimeFrame !== null) {
      setTimeFrame(newTimeFrame);
      setSelects((prev) => ({
        ...prev,
        day1:
          newTimeFrame === "hour"
            ? StockHourlyQueryBuilder.options.hours[0]
            : newTimeFrame === "day"
            ? StockDailyQueryBuilder.options.days[0]
            : StockWeeklyQueryBuilder.options.weeks[0],
        day2:
          newTimeFrame === "hour"
            ? StockHourlyQueryBuilder.options.hours[0]
            : newTimeFrame === "day"
            ? StockDailyQueryBuilder.options.days[0]
            : StockWeeklyQueryBuilder.options.weeks[0],
        indicator1:
          newTimeFrame === "hour"
            ? StockHourlyQueryBuilder.options.indicators[0]
            : newTimeFrame === "day"
            ? StockDailyQueryBuilder.options.indicators[0]
            : StockWeeklyQueryBuilder.options.indicators[0],
        indicator2:
          newTimeFrame === "hour"
            ? StockHourlyQueryBuilder.options.indicators[0]
            : newTimeFrame === "day"
            ? StockDailyQueryBuilder.options.indicators[0]
            : StockWeeklyQueryBuilder.options.indicators[0],
      }));
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

  const timeOptions =
    timeFrame === "hour"
      ? StockHourlyQueryBuilder.options.hours
      : timeFrame === "day"
      ? StockDailyQueryBuilder.options.days
      : StockWeeklyQueryBuilder.options.weeks;

  const indicators =
    timeFrame === "hour"
      ? StockHourlyQueryBuilder.options.indicators
      : timeFrame === "day"
      ? StockDailyQueryBuilder.options.indicators
      : StockWeeklyQueryBuilder.options.indicators;

  const operators = StockDailyQueryBuilder.options.operators;

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
