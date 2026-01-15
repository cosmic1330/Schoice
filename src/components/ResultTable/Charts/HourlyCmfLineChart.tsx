import { Box, Tooltip } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { Line, LineChart, ReferenceLine, YAxis } from "recharts";
import { DatabaseContext } from "../../../context/DatabaseContext";
import ChartTooltip from "./ChartTooltip";
import { CmfIndicatorColor, hourly_count } from "./config";

const HourlyCmfLineChart = ({
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
    const sqlQuery = `SELECT hourly_skills.ts, ${CmfIndicatorColor.map(
      (item) => item.key
    ).join(
      ","
    )} FROM hourly_skills JOIN hourly_deal ON hourly_skills.ts = hourly_deal.ts AND hourly_skills.stock_id = hourly_deal.stock_id WHERE hourly_skills.stock_id = '${stock_id}' AND hourly_skills.ts <=  '${t} 14:00:00' ORDER BY hourly_skills.ts DESC LIMIT ${hourly_count}`;

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

export default HourlyCmfLineChart;
