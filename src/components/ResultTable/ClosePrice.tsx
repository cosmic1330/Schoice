import { useEffect, useState } from "react";
import useFindStocksByPrompt from "../../hooks/useFindStocksByPrompt";
import { StockTableType } from "../../types";

export default function ClosePrice({
  row,
  t,
}: {
  row: StockTableType;
  t: string;
}) {
  const { getOneDateDailyDataByStockId } = useFindStocksByPrompt();
  const [close, setClose] = useState<number>(0);

  // 使用 useCallback 穩定函數參照
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getOneDateDailyDataByStockId(t, row.stock_id);
        setClose(data[0]?.c || 0);
      } catch (error) {
        console.error("Error fetching daily data:", error);
        setClose(0);
      }
    };
    fetchData();
  }, [t, row.stock_id, getOneDateDailyDataByStockId]);

  return <>{close}</>;
}
