import { Box, Tooltip } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { Line, LineChart, ReferenceLine, YAxis } from "recharts";
import { DatabaseContext } from "../../../context/DatabaseContext";
import ChartTooltip from "./ChartTooltip";
import { ObvIndicatorColor, weekly_count } from "./config";

const WeeklyObvLineChart = ({
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
    const sqlQuery = `SELECT weekly_skills.t, ${ObvIndicatorColor.map(
      (item) => item.key
    ).join(
      ","
    )} FROM weekly_skills JOIN weekly_deal ON weekly_skills.t = weekly_deal.t AND weekly_skills.stock_id = weekly_deal.stock_id WHERE weekly_skills.stock_id = ${stock_id} AND weekly_skills.t <= '${t}' ORDER BY weekly_skills.t DESC LIMIT ${weekly_count}`;

    if (!db) return;

    db?.select(sqlQuery).then((res: any) => {
      const formatData = res.reverse();
      setData(formatData);
    });
  }, [stock_id]);
  return (
    <Tooltip title={<ChartTooltip value={ObvIndicatorColor} />} arrow>
      <Box>
        <LineChart data={data} width={80} height={60}>
          <YAxis domain={["dataMin", "dataMax"]} hide yAxisId="obv" />
          <YAxis domain={["dataMin", "dataMax"]} hide yAxisId="close" />
          <ReferenceLine
            y={0}
            stroke="#d89584"
            strokeDasharray="3 3"
            yAxisId="obv"
          />
          {ObvIndicatorColor.map((item, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={item.key}
              stroke={item.color}
              strokeWidth={1.5}
              dot={false}
              yAxisId={item.key === "c" ? "close" : "obv"}
            />
          ))}
        </LineChart>
      </Box>
    </Tooltip>
  );
};

export default WeeklyObvLineChart;
