import { Box, Tooltip } from "@mui/material";
import React from "react";
import { Line, LineChart, ReferenceLine, YAxis } from "recharts";
import ChartTooltip from "./ChartTooltip";
import { daily_count, KdIndicatorColor } from "./config";
import useChartData from "./useChartData";

const DailyKdLineChart = React.memo(
  ({ stock_id, t }: { stock_id: string; t: string }) => {
    const { data } = useChartData({
      stock_id,
      t,
      tableName: "daily_skills",
      dealTableName: "daily_deal",
      indicators: KdIndicatorColor,
      limit: daily_count,
    });
    return (
      <Tooltip title={<ChartTooltip value={KdIndicatorColor} />} arrow>
        <Box>
          <LineChart data={data} width={80} height={60}>
            <YAxis domain={[0, 100]} hide />
            <ReferenceLine y={80} stroke="#d89584" strokeDasharray="3 3" />
            <ReferenceLine y={20} stroke="#d89584" strokeDasharray="3 3" />
            {KdIndicatorColor.map((item, index) => (
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
  }
);

DailyKdLineChart.displayName = "DailyKdLineChart";

export default DailyKdLineChart;
