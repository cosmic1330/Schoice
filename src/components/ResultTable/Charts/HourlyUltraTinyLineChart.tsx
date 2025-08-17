import { dateFormat } from "@ch20026103/anysis";
import { Mode } from "@ch20026103/anysis/dist/esm/stockSkills/utils/dateFormat";
import { Box, Tooltip } from "@mui/material";
import React from "react";
import { Line, LineChart, YAxis } from "recharts";
import ChartTooltip from "./ChartTooltip";
import { hourly_count, UltraTinyIndicatorColor } from "./config";
import useChartData from "./useChartData";

const HourlyUltraTinyLineChart = React.memo(
  ({ stock_id, t }: { stock_id: string; t: string }) => {
    const { data } = useChartData({
      stock_id,
      t,
      tableName: "hourly_skills",
      dealTableName: "hourly_deal",
      indicators: UltraTinyIndicatorColor,
      limit: hourly_count,
      timeColumn: "ts",
      transformTime: (t) => dateFormat(t, Mode.StringToNumber) * 10000 + 1400,
    });

    return (
      <Tooltip title={<ChartTooltip value={UltraTinyIndicatorColor} />} arrow>
        <Box>
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
        </Box>
      </Tooltip>
    );
  }
);

HourlyUltraTinyLineChart.displayName = "HourlyUltraTinyLineChart";

export default HourlyUltraTinyLineChart;
