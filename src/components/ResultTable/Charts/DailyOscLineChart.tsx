import { Box, Tooltip } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { Bar, Cell, ComposedChart, ReferenceLine, YAxis } from "recharts";
import { DatabaseContext } from "../../../context/DatabaseContext";
import ChartTooltip from "./ChartTooltip";
import { daily_count, OscIndicatorColor } from "./config";

const DailyOscLineChart = ({
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
    const sqlQuery = `SELECT daily_skills.t, ${OscIndicatorColor.map(
      (item) => item.key
    ).join(
      ","
    )} FROM daily_skills JOIN daily_deal ON daily_skills.t = daily_deal.t AND daily_skills.stock_id = daily_deal.stock_id WHERE daily_skills.stock_id = ${stock_id} AND daily_skills.t <= '${t}' ORDER BY daily_skills.t DESC LIMIT ${daily_count}`;
    if (!db) return;

    db?.select(sqlQuery).then((res: any) => {
      const formatData = res.reverse();
      setData(formatData);
    });
  }, [stock_id]);
  return (
    <Tooltip title={<ChartTooltip value={OscIndicatorColor} />} arrow>
      <Box>
        <ComposedChart data={data} width={80} height={60}>
          <YAxis domain={["dataMin", "dataMax"]} hide />
          <ReferenceLine y={0} stroke="#ff7300" strokeDasharray="3" />
          {OscIndicatorColor.map((item, index) => (
            <Bar key={index} dataKey={item.key} barSize={6}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  cursor="pointer"
                  fill={entry[item.key] > 0 ? "#f55" : "#5f5"}
                />
              ))}
            </Bar>
          ))}
        </ComposedChart>
      </Box>
    </Tooltip>
  );
};

export default DailyOscLineChart;
