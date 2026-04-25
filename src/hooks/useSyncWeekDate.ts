import { useCallback, useContext, useEffect } from "react";
import { DatabaseContext } from "../context/DatabaseContext";
import useSchoiceStore from "../store/Schoice.store";
import { getUpcomingSunday } from "../utils/dateUtils";

/**
 * 自動同步 Store 中的 weekIndex。
 * 當日線索引 (dateIndex) 或日期資料 (dates) 改變時，自動計算對應的週對齊基準日。
 */
export default function useSyncWeekDate() {
  const { dates, weekDates } = useContext(DatabaseContext);
  const { dateIndex, setWeekIndex } = useSchoiceStore();

  const refreshWeekDate = useCallback(() => {
    if (
      dates &&
      dates.length > 0 &&
      dateIndex >= 0 &&
      dateIndex < dates.length
    ) {
      const currentDailyDate = dates[dateIndex];
      const sundayBound = getUpcomingSunday(currentDailyDate);

      // 1. 尋找「當週內」且「不小於今日」的週資料
      // 因為 weekDates 已是 DESC 排序，filter 後的第一筆就是該週內最新的一筆
      const candidates = weekDates.filter(
        (w) => w >= currentDailyDate && w <= sundayBound,
      );
      let target = candidates.length > 0 ? candidates[0] : undefined;

      if (!target) {
        // 2. 如果當週還沒有資料，則尋找過去最接近的一筆 (<= 今日)
        target = weekDates.find((w) => w <= currentDailyDate);
      }

      if (target) {
        const targetIndex = weekDates.indexOf(target);
        if (targetIndex !== -1) {
          console.log("[useSyncWeekDate] date", currentDailyDate, "week date", weekDates[targetIndex]);
          setWeekIndex(targetIndex);
        }
      }
    }
  }, [dates, weekDates, dateIndex, setWeekIndex]);

  useEffect(() => {
    refreshWeekDate();
  }, [refreshWeekDate]);

  return { refreshWeekDate };
}
