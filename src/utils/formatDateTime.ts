const formatDateTime = (timestamp: number) => {
  const d = new Date(timestamp);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return parseInt(`${yyyy}${mm}${dd}${hh}${mi}`, 10);
};

export default formatDateTime;
