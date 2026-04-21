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

      // [防禦性修復] 過濾重複或過於接近的週資料點（防止 SQL 存入多筆同週資料導致 K 棒異常）
      const dedupedData: any[] = [];
      let lastTs = 0;

      // res 已經由 SQL 按 t DESC 排序
      for (const item of res) {
        const itemDate = new Date(
          `${String(item.t).slice(0, 4)}-${String(item.t).slice(
            4,
            6,
          )}-${String(item.t).slice(6, 8)}`,
        );
        const itemTs = itemDate.getTime();

        if (lastTs === 0 || lastTs - itemTs >= 4 * 24 * 60 * 60 * 1000) {
          dedupedData.push(item);
          lastTs = itemTs;
        }
      }

      const formatData = dedupedData.reverse();
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
