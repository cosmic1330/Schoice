// 檢查當前時間是否在台灣時間非六日 9:00 AM 到 1:30 PM 之間
const checkTimeRange = (time: unknown) => {
  // 檢查 time 是否可被 new Date 正確解析
  const date = new Date(time as any);
  if (isNaN(date.getTime())) return false;
  const day = date.getDay();
  if (day === 0 || day === 6) return false; // 0: Sunday, 6: Saturday
  const hours = date.getHours();
  const minutes = date.getMinutes();
  // 9:00 AM 至 1:30 PM 時間範圍
  return hours >= 9 && (hours < 13 || (hours === 13 && minutes <= 30));
};
export default checkTimeRange;
