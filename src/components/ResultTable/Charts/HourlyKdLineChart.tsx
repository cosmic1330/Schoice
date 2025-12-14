import { dateFormat } from "@ch20026103/anysis";
import { Mode } from "@ch20026103/anysis/dist/esm/stockSkills/utils/dateFormat";
import { Box, Tooltip } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { Line, LineChart, ReferenceLine, YAxis } from "recharts";
import { DatabaseContext } from "../../../context/DatabaseContext";
import ChartTooltip from "./ChartTooltip";
import { hourly_count, KdIndicatorColor } from "./config";

const HourlyKdLineChart = ({
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
    const sqlQuery = `SELECT hourly_deal.ts, ${KdIndicatorColor.map(
      (item) => item.key
    ).join(
      ","
    )} FROM hourly_deal JOIN hourly_skills ON hourly_deal.ts = hourly_skills.ts AND hourly_deal.stock_id = hourly_skills.stock_id WHERE hourly_deal.stock_id = '${stock_id}' AND hourly_deal.ts <= '${
      dateFormat(t, Mode.StringToNumber) * 10000 + 1400
    }' ORDER BY hourly_deal.ts DESC LIMIT ${hourly_count}`;

    if (!db) return;

    db?.select(sqlQuery).then((res: any) => {
      const formatData = res.reverse();
      setData(formatData);
    });
  }, [stock_id, t]);
  return (
    <Tooltip title={<ChartTooltip value={KdIndicatorColor} />} arrow>
      <Box>
        <LineChart data={data} width={80} height={60}>
          <YAxis domain={[0, 100]} hide />
          <ReferenceLine y={80} stroke="#d89584" strokeDasharray="3 3" />
          <ReferenceLine y={20} stroke="#d89584" strokeDasharray="3 3" />
          {KdIndicatorColor.map((item, index) => (
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

export default HourlyKdLineChart;
