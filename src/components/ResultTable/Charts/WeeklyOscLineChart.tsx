import { Box, Tooltip } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { Bar, Cell, ComposedChart, ReferenceLine, YAxis } from "recharts";
import { DatabaseContext } from "../../../context/DatabaseContext";
import ChartTooltip from "./ChartTooltip";
import { OscIndicatorColor, weekly_count } from "./config";

const WeeklyOscLineChart = ({
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
    const sqlQuery = `SELECT weekly_skills.t, ${OscIndicatorColor.map(
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

export default WeeklyOscLineChart;
