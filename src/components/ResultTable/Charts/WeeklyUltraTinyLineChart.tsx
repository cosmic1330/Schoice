import { Box, Tooltip } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { DatabaseContext } from "../../../context/DatabaseContext";
import ChartTooltip from "./ChartTooltip";
import { UltraTinyIndicatorColor, weekly_count } from "./config";
import UltraTinyCandlestickChart from "./UltraTinyCandlestickChart";

const WeeklyUltraTinyLineChart = ({
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
    const sqlQuery = `SELECT weekly_deal.t, o, h, l, c, ${UltraTinyIndicatorColor.map(
      (item) => item.key,
    ).join(
      ",",
    )} FROM weekly_deal JOIN weekly_skills ON weekly_deal.t = weekly_skills.t AND weekly_deal.stock_id = weekly_skills.stock_id WHERE weekly_deal.stock_id = '${stock_id}' AND weekly_deal.t <= '${t}' ORDER BY weekly_deal.t DESC LIMIT ${weekly_count}`;

    if (!db) return;

    db?.select(sqlQuery).then((res: any) => {
      if (!res || res.length === 0) {
        setData([]);
        return;
      }

      const formatData = res.reverse();
      setData(formatData);
    });
  }, [stock_id, t, db]);
  return (
    <Tooltip title={<ChartTooltip value={UltraTinyIndicatorColor} />} arrow>
      <Box sx={{ width: 80, height: 60 }}>
        <UltraTinyCandlestickChart data={data} />
      </Box>
    </Tooltip>
  );
};

export default WeeklyUltraTinyLineChart;
