import { Box, Tooltip } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { Line, LineChart, YAxis } from "recharts";
import { DatabaseContext } from "../../../context/DatabaseContext";
import ChartTooltip from "./ChartTooltip";
import { UltraTinyIndicatorColor, weekly_count } from "./config";

const WeeklyUltraTinyLineChart = ({
  stock_id,
  t,
}: {
  stock_id: string;
  t: string;
}) => {
  const { db } = useContext(DatabaseContext);
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    if (!stock_id) return;
    const sqlQuery = `SELECT weekly_deal.t, ${UltraTinyIndicatorColor.map(
      (item) => item.key
    ).join(
      ","
    )} FROM weekly_deal JOIN weekly_skills ON weekly_deal.t = weekly_skills.t AND weekly_deal.stock_id = weekly_skills.stock_id WHERE weekly_deal.stock_id = ${stock_id} AND weekly_deal.t <= '${t}' ORDER BY weekly_deal.t DESC LIMIT ${weekly_count}`;

    if (!db) return;

    db?.select(sqlQuery).then((res: any) => {
      const formatData = res.reverse();

      setData(formatData);
    });
  }, [stock_id, t]);
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
};

export default WeeklyUltraTinyLineChart;
