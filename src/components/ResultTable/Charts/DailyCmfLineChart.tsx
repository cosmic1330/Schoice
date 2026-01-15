import { Box, Tooltip } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { Line, LineChart, ReferenceLine, YAxis } from "recharts";
import { DatabaseContext } from "../../../context/DatabaseContext";
import ChartTooltip from "./ChartTooltip";
import { CmfIndicatorColor, daily_count } from "./config";

const DailyCmfLineChart = ({
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
    const sqlQuery = `SELECT daily_skills.t, ${CmfIndicatorColor.map(
      (item) => item.key
    ).join(
      ","
    )} FROM daily_skills JOIN daily_deal ON daily_skills.t = daily_deal.t AND daily_skills.stock_id = daily_deal.stock_id WHERE daily_skills.stock_id = '${stock_id}' AND daily_skills.t <=  '${t}' ORDER BY daily_skills.t DESC LIMIT ${daily_count}`;

    if (!db) return;

    db?.select(sqlQuery).then((res: any) => {
      const formatData = res.reverse();
      setData(formatData);
    });
  }, [stock_id, t]);
  return (
    <Tooltip title={<ChartTooltip value={CmfIndicatorColor} />} arrow>
      <Box>
        <LineChart data={data} width={80} height={60}>
          <YAxis domain={["dataMin", "dataMax"]} hide yAxisId="cmf" />
          <ReferenceLine
            y={0}
            stroke="#aca7a6"
            strokeDasharray="3 3"
            yAxisId="cmf"
          />
          <ReferenceLine
            y={0.1}
            stroke="#63c762"
            strokeDasharray="3 3"
            yAxisId="cmf"
          />
          <ReferenceLine
            y={-0.1}
            stroke="#f44336"
            strokeDasharray="3 3"
            yAxisId="cmf"
          />
          {CmfIndicatorColor.map((item, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={item.key}
              stroke={item.color}
              strokeWidth={1.5}
              dot={false}
              yAxisId="cmf"
            />
          ))}
        </LineChart>
      </Box>
    </Tooltip>
  );
};

export default DailyCmfLineChart;
