/**
 * 根據 YYYYMMDD 格式的日期字串，計算該日期所屬週的週日 (Upcoming Sunday)
 * 如果日期本身是週日，則返回該日期
 */
export const getUpcomingSunday = (dateStr: string): string => {
  if (!dateStr || dateStr.length !== 8) return dateStr;

  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1;
  const day = parseInt(dateStr.substring(6, 8));
  const d = new Date(year, month, day);

  if (isNaN(d.getTime())) return dateStr;

  const dayOfWeek = d.getDay();
  // 如果今天是週日 (0)，則不需要加天數；否則加到下一個週日 (7)
  const diff = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  
  const sunday = new Date(d);
  sunday.setDate(d.getDate() + diff);

  const yyyy = sunday.getFullYear();
  const mm = String(sunday.getMonth() + 1).padStart(2, "0");
  const dd = String(sunday.getDate()).padStart(2, "0");

  return `${yyyy}${mm}${dd}`;
};
