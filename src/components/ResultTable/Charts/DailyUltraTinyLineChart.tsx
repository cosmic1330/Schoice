import { Box, Tooltip } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { DatabaseContext } from "../../../context/DatabaseContext";
import ChartTooltip from "./ChartTooltip";
import { daily_count, UltraTinyIndicatorColor } from "./config";
import UltraTinyCandlestickChart from "./UltraTinyCandlestickChart";

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
    const sqlQuery = `SELECT daily_deal.t, o, h, l, c, ${UltraTinyIndicatorColor.map(
      (item) => item.key
    ).join(
      ","
    )} FROM daily_deal JOIN daily_skills ON daily_deal.t = daily_skills.t AND daily_deal.stock_id = daily_skills.stock_id WHERE daily_deal.stock_id = '${stock_id}' AND daily_deal.t <= '${t}' ORDER BY daily_deal.t DESC LIMIT ${daily_count}`;

    if (!db) return;

    db?.select(sqlQuery).then((res: any) => {
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

export default DailyUltraTinyLineChart;
