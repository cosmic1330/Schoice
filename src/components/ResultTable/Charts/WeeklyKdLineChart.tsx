import { Box, Tooltip } from "@mui/material";
import { memo, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Line, LineChart, ReferenceLine, YAxis } from "recharts";
import { DatabaseContext } from "../../../context/DatabaseContext";
import ChartTooltip from "./ChartTooltip";
import { KdIndicatorColor, weekly_count } from "./config";

const WeeklyKdLineChart = ({
  stock_id,
  t,
}: {
  stock_id: string;
  t: string;
}) => {
  const { db } = useContext(DatabaseContext);
  const [data, setData] = useState<any[]>([]);
  const prevRef = useRef<any[] | null>(null);

  useEffect(() => {
    if (!stock_id) return;
    if (!db) return;

    const sqlQuery = `SELECT weekly_skills.t, ${KdIndicatorColor.map(
      (item) => item.key
    ).join(
      ","
    )} FROM weekly_skills JOIN weekly_deal ON weekly_skills.t = weekly_deal.t AND weekly_skills.stock_id = weekly_deal.stock_id WHERE weekly_skills.stock_id = '${stock_id}' AND weekly_skills.t <= '${t}' ORDER BY weekly_skills.t DESC LIMIT ${weekly_count}`;

    let cancelled = false;
    db.select(sqlQuery).then((res: any) => {
      if (cancelled) return;
      const formatData = res.reverse();
      const prev = prevRef.current;
      const changed =
        !prev ||
        prev.length !== formatData.length ||
        JSON.stringify(prev) !== JSON.stringify(formatData);
      if (changed) {
        prevRef.current = formatData;
        setData(formatData);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [stock_id, t, db]);

  // 緩存 Line 元素，避免每次渲染重建
  const lines = useMemo(
    () =>
      KdIndicatorColor.map((item, index) => (
        <Line
          key={index}
          type="monotone"
          dataKey={item.key}
          stroke={item.color}
          strokeWidth={1.5}
          dot={false}
        />
      )),
    []
  );

  return (
    <Tooltip title={<ChartTooltip value={KdIndicatorColor} />} arrow>
      <Box>
        <LineChart data={data} width={80} height={60}>
          <YAxis domain={[0, 100]} hide />
          <ReferenceLine y={80} stroke="#d89584" strokeDasharray="3 3" />
          <ReferenceLine y={20} stroke="#d89584" strokeDasharray="3 3" />
          {lines}
        </LineChart>
      </Box>
    </Tooltip>
  );
};

export default memo(WeeklyKdLineChart, (prevProps, nextProps) => {
  return (
    prevProps.stock_id === nextProps.stock_id && prevProps.t === nextProps.t
  );
});
