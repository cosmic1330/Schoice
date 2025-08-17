import { Box, Tooltip } from "@mui/material";
import React from "react";
import { Line, LineChart, YAxis } from "recharts";
import ChartTooltip from "./ChartTooltip";
import { UltraTinyIndicatorColor, weekly_count } from "./config";
import useChartData from "./useChartData";

const WeeklyUltraTinyLineChart = React.memo(
  ({ stock_id, t }: { stock_id: string; t: string }) => {
    const { data } = useChartData({
      stock_id,
      t,
      tableName: "weekly_skills",
      dealTableName: "weekly_deal",
      indicators: UltraTinyIndicatorColor,
      limit: weekly_count,
    });
    return (
      <Tooltip title={<ChartTooltip value={UltraTinyIndicatorColor} />} arrow>
        <Box>
          {/* <ResponsiveContainer > */}
          <LineChart data={data} width={80} height={60}>
            <YAxis domain={["dataMin", "dataMax"]} hide />
            {UltraTinyIndicatorColor.map((item, index) => (
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
          {/* </ResponsiveContainer> */}
        </Box>
      </Tooltip>
    );
  }
);

WeeklyUltraTinyLineChart.displayName = "WeeklyUltraTinyLineChart";

export default WeeklyUltraTinyLineChart;
