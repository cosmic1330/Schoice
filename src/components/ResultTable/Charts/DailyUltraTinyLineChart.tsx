import { Box, Tooltip } from "@mui/material";
import React from "react";
import { Line, LineChart, YAxis } from "recharts";
import ChartTooltip from "./ChartTooltip";
import { daily_count, UltraTinyIndicatorColor } from "./config";
import useChartData from "./useChartData";

const DailyUltraTinyLineChart = React.memo(
  ({ stock_id, t }: { stock_id: string; t: string }) => {
    const { data } = useChartData({
      stock_id,
      t,
      tableName: "daily_skills",
      dealTableName: "daily_deal",
      indicators: UltraTinyIndicatorColor,
      limit: daily_count,
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

DailyUltraTinyLineChart.displayName = "DailyUltraTinyLineChart";

export default DailyUltraTinyLineChart;
