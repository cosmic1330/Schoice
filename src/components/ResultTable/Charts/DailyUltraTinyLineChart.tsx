import { Box, Tooltip } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { Line, LineChart, YAxis } from "recharts";
import { DatabaseContext } from "../../../context/DatabaseContext";
import ChartTooltip from "./ChartTooltip";
import { daily_count, UltraTinyIndicatorColor } from "./config";

const DailyUltraTinyLineChart = ({
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
    const sqlQuery = `SELECT daily_skills.t, ${UltraTinyIndicatorColor.map(
      (item) => `NULLIF(${item.key}, 0) AS ${item.key}`
    ).join(
      ","
    )} FROM daily_skills JOIN daily_deal ON daily_skills.t = daily_deal.t AND daily_skills.stock_id = daily_deal.stock_id WHERE ${stock_id} = daily_skills.stock_id AND daily_skills.t <= '${t}' ORDER BY daily_skills.t DESC LIMIT ${daily_count}`;

    if (!db) return;

    db?.select(sqlQuery).then((res: any) => {
      const formatData = res.reverse();
      setData(formatData);
    });
  }, [stock_id]);
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

export default DailyUltraTinyLineChart;
