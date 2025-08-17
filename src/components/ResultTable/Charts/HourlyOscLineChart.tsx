import { dateFormat } from "@ch20026103/anysis";
import { Mode } from "@ch20026103/anysis/dist/esm/stockSkills/utils/dateFormat";
import { Box, Tooltip } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { Bar, Cell, ComposedChart, ReferenceLine, YAxis } from "recharts";
import { DatabaseContext } from "../../../context/DatabaseContext";
import ChartTooltip from "./ChartTooltip";
import { hourly_count, OscIndicatorColor } from "./config";

const HourlyOscLineChart = ({
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
    const sqlQuery = `SELECT hourly_skills.ts, ${OscIndicatorColor.map(
      (item) => item.key
    ).join(
      ","
    )} FROM hourly_skills JOIN hourly_deal ON hourly_skills.ts = hourly_deal.ts AND hourly_skills.stock_id = hourly_deal.stock_id WHERE ${stock_id} = hourly_skills.stock_id AND hourly_skills.ts <= '${
      dateFormat(t, Mode.StringToNumber) * 10000 + 1400
    }' ORDER BY hourly_skills.ts DESC LIMIT ${hourly_count}`;

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

export default HourlyOscLineChart;
