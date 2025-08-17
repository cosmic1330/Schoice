import { Box, Tooltip } from "@mui/material";
import { Line, LineChart, ReferenceLine, YAxis } from "recharts";
import ChartTooltip from "./ChartTooltip";
import { daily_count, RsiIndicatorColor } from "./config";
import useChartData from "./useChartData";

const DailyRsiLineChart = ({
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
    indicators: RsiIndicatorColor,
    limit: daily_count
  });
  return (
    <Tooltip title={<ChartTooltip value={RsiIndicatorColor} />} arrow>
      <Box>
        <LineChart data={data} width={80} height={60}>
          <YAxis domain={[0, 100]} hide />
          <ReferenceLine y={50} stroke="#d89584" strokeDasharray="3 3" />
          {RsiIndicatorColor.map((item, index) => (
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

export default DailyRsiLineChart;
