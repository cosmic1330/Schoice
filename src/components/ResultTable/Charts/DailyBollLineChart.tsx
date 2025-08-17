import { Box, Tooltip } from "@mui/material";
import { Line, LineChart, YAxis } from "recharts";
import ChartTooltip from "./ChartTooltip";
import { BollIndicatorColor, daily_count } from "./config";
import useChartData from "./useChartData";

const DailyBollLineChart = ({
  stock_id,
  t,
}: {
  stock_id: string;
  t: string;
}) => {
  const { data } = useChartData({
    stock_id,
    t,
    tableName: 'daily_skills',
    dealTableName: 'daily_deal',
    indicators: BollIndicatorColor,
    limit: daily_count
  });
  return (
    <Tooltip title={<ChartTooltip value={BollIndicatorColor} />} arrow>
      <Box>
        <LineChart data={data} width={80} height={60}>
          <YAxis domain={["dataMin", "dataMax"]} hide />
          {BollIndicatorColor.map((item, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={item.key}
              stroke={item.color}
              strokeWidth={1.5}
              dot={false}
            />
          ))}
        </LineChart>
      </Box>
    </Tooltip>
  );
};

export default DailyBollLineChart;
