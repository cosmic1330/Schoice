import { Box } from "@mui/material";
import useSchoiceStore, { ChartType } from "../../store/Schoice.store";
import DailyBollLineChart from "./Charts/DailyBollLineChart";
import DailyKdLineChart from "./Charts/DailyKdLineChart";
import DailyObvLineChart from "./Charts/DailyObvLineChart";
import DailyOscLineChart from "./Charts/DailyOscLineChart";
import DailyRsiLineChart from "./Charts/DailyRsiLineChart";
import HourlyKdLineChart from "./Charts/HourlyKdLineChart";
import HourlyOscLineChart from "./Charts/HourlyOscLineChart";
import HourlyRsiLineChart from "./Charts/HourlyRsiLineChart";
import WeeklyBollLineChart from "./Charts/WeeklyBollLineChart";
import WeeklyKdLineChart from "./Charts/WeeklyKdLineChart";
import WeeklyObvLineChart from "./Charts/WeeklyObvLineChart";
import WeeklyOscLineChart from "./Charts/WeeklyOscLineChart";
import WeeklyRsiLineChart from "./Charts/WeeklyRsiLineChart";
import HourlyBollLineChart from "./Charts/HourlyBollLineChart";
import HourlyObvLineChart from "./Charts/HourlyObvLineChart";

export default function RowChart({ row }: { row: any }) {
  const { chartType } = useSchoiceStore();
  return (
    <Box>
      {/* Hourly */}
      {chartType === ChartType.HOURLY_OBV && (
        <HourlyObvLineChart stock_id={row.stock_id} t={row.t} />
      )}
      {chartType === ChartType.HOURLY_KD && (
        <HourlyKdLineChart stock_id={row.stock_id} t={row.t} />
      )}
      {chartType === ChartType.HOURLY_RSI && (
        <HourlyRsiLineChart stock_id={row.stock_id} t={row.t} />
      )}
      {chartType === ChartType.HOURLY_OSC && (
        <HourlyOscLineChart stock_id={row.stock_id} t={row.t} />
      )}
      {chartType === ChartType.HOURLY_BOLL && (
        <HourlyBollLineChart stock_id={row.stock_id} t={row.t} />
      )}

      {/* Daily */}
      {chartType === ChartType.DAILY_KD && (
        <DailyKdLineChart stock_id={row.stock_id} t={row.t} />
      )}
      {chartType === ChartType.DAILY_OBV && (
        <DailyObvLineChart stock_id={row.stock_id} t={row.t} />
      )}
      {chartType === ChartType.DAILY_RSI && (
        <DailyRsiLineChart stock_id={row.stock_id} t={row.t} />
      )}
      {chartType === ChartType.DAILY_OSC && (
        <DailyOscLineChart stock_id={row.stock_id} t={row.t} />
      )}
      {chartType === ChartType.DAILY_BOLL && (
        <DailyBollLineChart stock_id={row.stock_id} t={row.t} />
      )}
      {/* Weekly */}
      {chartType === ChartType.WEEKLY_KD && (
        <WeeklyKdLineChart stock_id={row.stock_id} t={row.t} />
      )}
      {chartType === ChartType.WEEKLY_OBV && (
        <WeeklyObvLineChart stock_id={row.stock_id} t={row.t} />
      )}
      {chartType === ChartType.WEEKLY_RSI && (
        <WeeklyRsiLineChart stock_id={row.stock_id} t={row.t} />
      )}
      {chartType === ChartType.WEEKLY_BOLL && (
        <WeeklyBollLineChart stock_id={row.stock_id} t={row.t} />
      )}
      {chartType === ChartType.WEEKLY_OSC && (
        <WeeklyOscLineChart stock_id={row.stock_id} t={row.t} />
      )}
    </Box>
  );
}
