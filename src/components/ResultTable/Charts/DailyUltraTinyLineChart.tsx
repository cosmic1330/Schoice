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
    const sqlQuery = `SELECT daily_deal.t, ${UltraTinyIndicatorColor.map(
      (item) => item.key
    ).join(
      ","
    )} FROM daily_deal JOIN daily_skills ON daily_deal.t = daily_skills.t AND daily_deal.stock_id = daily_skills.stock_id WHERE ${stock_id} = daily_deal.stock_id AND daily_deal.t <= '${t}' ORDER BY daily_deal.t DESC LIMIT ${daily_count}`;

    if (!db) return;

    db?.select(sqlQuery).then((res: any) => {
      const formatData = res.reverse();
      setData(formatData);
    });
  }, [stock_id, t]);

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
};

export default DailyUltraTinyLineChart;
