import { Box, Tooltip } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { Line, LineChart, YAxis } from "recharts";
import { DatabaseContext } from "../../../context/DatabaseContext";
import ChartTooltip from "./ChartTooltip";
import { hourly_count, UltraTinyIndicatorColor } from "./config";

const HourlyUltraTinyLineChart = ({
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
    const sqlQuery = `SELECT hourly_deal.ts, ${UltraTinyIndicatorColor.map(
      (item) => item.key
    ).join(
      ","
    )} FROM hourly_deal LEFT JOIN hourly_skills ON hourly_deal.ts = hourly_skills.ts AND hourly_deal.stock_id = hourly_skills.stock_id WHERE hourly_deal.stock_id = '${stock_id}' AND hourly_deal.ts < '${t} 14:00:00+08'::timestamptz ORDER BY hourly_deal.ts DESC LIMIT ${hourly_count}`;
    console.log(sqlQuery);
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

export default HourlyUltraTinyLineChart;
