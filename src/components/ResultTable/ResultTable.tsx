import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useEffect, useRef, useState } from "react";
import ResultTableRow from "./ResultTableRow";
import SelectChartHead from "./SelectChartHead";
import { ActionButtonType } from "./types";

const columns = [
  "日期",
  "代碼",
  "名稱",
  "收盤價",
  "小時趨勢圖",
  "日趨勢圖",
  "週趨勢圖",
  <SelectChartHead />,
  "Action",
];
export default function ResultTable({
  result,
  type = ActionButtonType.Increase,
}: {
  result: any[];
  type?: ActionButtonType;
}) {
  const [visibleCount, setVisibleCount] = useState(20); // 初始顯示 10 筆
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect(); // 清除舊的 observer

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 20, result.length)); // 每次+10筆
        }
      },
      { rootMargin: "100px" }
    );

    if (lastItemRef.current) {
      observerRef.current.observe(lastItemRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [visibleCount, result.length]); // 依賴 `visibleCount` 和 `result.length`

  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <TableContainer sx={{ maxHeight: 500 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell width={5}></TableCell>
              {columns.map((column, index) => (
                <TableCell key={index}>{column}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {result.slice(0, visibleCount).map((row, index) => {
              const isLastItem = index === visibleCount - 1;
              return (
                <ResultTableRow
                  key={index}
                  row={row}
                  index={index}
                  type={type}
                  ref={isLastItem ? lastItemRef : null} // 綁定最後一個 row
                />
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
