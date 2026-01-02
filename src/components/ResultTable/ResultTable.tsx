import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import React, { memo, useMemo } from "react";
import { TableVirtuoso } from "react-virtuoso";
import { StockTableType } from "../../types";
import ResultTableRow from "./ResultTableRow";
import SelectChartHead from "./SelectChartHead";
import { ActionButtonType } from "./types";

import { useTranslation } from "react-i18next";

export default memo(function ResultTable({
  result,
  type = ActionButtonType.Increase,
}: {
  result: StockTableType[];
  type?: ActionButtonType;
}) {
  const { t } = useTranslation();
  // 使用 useMemo 穩定 columns 陣列
  const columns = useMemo(
    () => [
      t("Components.ResultTable.date"),
      t("Components.ResultTable.id"),
      t("Components.ResultTable.name"),
      t("Components.ResultTable.priceVolume"),
      t("Components.ResultTable.hourlyChart"),
      t("Components.ResultTable.dailyChart"),
      t("Components.ResultTable.weeklyChart"),
      <SelectChartHead key="select-chart-head" />,
      t("Components.ResultTable.action"),
    ],
    [t]
  );

  // 使用 react-virtuoso 的 TableVirtuoso 取代手動切分與 IntersectionObserver
  return (
    <TableVirtuoso
      data={result}
      style={{ height: 500 }}
      components={{
        Scroller: React.forwardRef((props: any, ref) => (
          <TableContainer ref={ref as any} sx={{ maxHeight: 500 }} {...props} />
        )),
        Table: (props: any) => (
          <Table stickyHeader aria-label="sticky table" {...props} />
        ),
        // 移除自定義 TableHead，改用 fixedHeaderContent
        TableRow: (props: any) => <TableRow {...props} />,
        TableBody: (props: any) => <TableBody {...props} />,
      }}
      // 使用 fixedHeaderContent 來渲染表頭，避免 header 被 virtuoso 覆蓋
      fixedHeaderContent={() => (
        <TableRow sx={{ backgroundColor: "background.paper" }}>
          <TableCell width={5}></TableCell>
          {columns.map((column, index) => (
            <TableCell key={index}>{column}</TableCell>
          ))}
        </TableRow>
      )}
      itemContent={(index: number, row: StockTableType) => (
        <ResultTableRow
          key={`${row.stock_id}`}
          row={row}
          index={index}
          type={type}
        />
      )}
    />
  );
});
