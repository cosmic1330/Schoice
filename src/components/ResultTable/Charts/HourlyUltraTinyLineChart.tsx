import { Box, Tooltip } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { DatabaseContext } from "../../../context/DatabaseContext";
import ChartTooltip from "./ChartTooltip";
import { hourly_count, UltraTinyIndicatorColor } from "./config";
import UltraTinyCandlestickChart from "./UltraTinyCandlestickChart";

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
    const sqlQuery = `SELECT hourly_deal.ts, o, h, l, c, ${UltraTinyIndicatorColor.map(
      (item) => item.key
    ).join(
      ","
    )} FROM hourly_deal LEFT JOIN hourly_skills ON hourly_deal.ts = hourly_skills.ts AND hourly_deal.stock_id = hourly_skills.stock_id WHERE hourly_deal.stock_id = '${stock_id}' AND hourly_deal.ts < '${t} 14:00:00+08' ORDER BY hourly_deal.ts DESC LIMIT ${hourly_count}`;
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

export default HourlyUltraTinyLineChart;
