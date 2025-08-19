import InfoIcon from "@mui/icons-material/Info";
import PostAddIcon from "@mui/icons-material/PostAdd";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { IconButton, Tooltip } from "@mui/material";
import TableCell from "@mui/material/TableCell";
// TableRow removed: Virtuoso provides the row wrapper
import { open } from "@tauri-apps/plugin-shell";
import { lazy, memo, Suspense, useContext, useState } from "react";
import { toast } from "react-toastify";
import { DatabaseContext } from "../../context/DatabaseContext";
import { useUser } from "../../context/UserContext";
import useDetailWebviewWindow from "../../hooks/useDetailWebviewWindow";
import useCloudStore from "../../store/Cloud.store";
import useSchoiceStore from "../../store/Schoice.store";
import { StockTableType } from "../../types";
import ClosePrice from "./ClosePrice";
import FundamentalTooltip from "./FundamentalTooltip";
import { ActionButtonType } from "./types";

// 使用 lazy 延遲載入較重的 chart 元件
const HourlyUltraTinyLineChart = lazy(
  () => import("./Charts/HourlyUltraTinyLineChart")
);
const WeeklyUltraTinyLineChart = lazy(
  () => import("./Charts/WeeklyUltraTinyLineChart")
);
const RowChart = lazy(() => import("./RowChart"));

const DailyUltraTinyLineChart = lazy(
  () => import("./Charts/DailyUltraTinyLineChart")
);

export default memo(function ResultTableRow({
  row,
  index,
  type,
}: {
  row: StockTableType;
  index: number;
  type: ActionButtonType;
}) {
  const { dates } = useContext(DatabaseContext);
  const { openDetailWindow } = useDetailWebviewWindow({
    id: row.stock_id,
    name: row.stock_name,
    group: row.market_type,
  });
  const { user } = useUser();
  const { addToWatchList, removeFromWatchList } = useCloudStore();
  const { todayDate } = useSchoiceStore();
  const [addLoading, setAddLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);

  const handleAddToWatchList = async () => {
    if (!user) {
      toast.error("Please login first!");
      return;
    }
    setAddLoading(true);
    try {
      await addToWatchList(row.stock_id, user.id);
      toast.success(`Add ${row.stock_name} Success!`);
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveToWatchList = async () => {
    if (!user) {
      toast.error("Please login first!");
      return;
    }
    setRemoveLoading(true);
    try {
      await removeFromWatchList(row.stock_id, user.id);
      toast.success(`Remove ${row.stock_name} Success!`);
    } finally {
      setRemoveLoading(false);
    }
  };

  // 回傳只有 TableCell（不包 TableRow），讓 Virtuoso 負責包裹 <tr>
  return (
    <>
      <TableCell>{index + 1}.</TableCell>
      <TableCell>{dates[todayDate]}</TableCell>
      <TableCell>{row.stock_id}</TableCell>
      <TableCell>
        <Tooltip title={<FundamentalTooltip row={row} />}>
          <span>{row.stock_name}</span>
        </Tooltip>
      </TableCell>
      <TableCell>
        <ClosePrice row={row} t={dates[todayDate]} />
      </TableCell>
      <TableCell>
        <Suspense
          fallback={
            <span style={{ display: "inline-block", width: 24, height: 12 }} />
          }
        >
          <HourlyUltraTinyLineChart
            stock_id={row.stock_id}
            t={dates[todayDate]}
          />
        </Suspense>
      </TableCell>
      <TableCell>
        <Suspense
          fallback={
            <span style={{ display: "inline-block", width: 48, height: 12 }} />
          }
        >
          <DailyUltraTinyLineChart
            stock_id={row.stock_id}
            t={dates[todayDate]}
          />
        </Suspense>
      </TableCell>
      <TableCell>
        <Suspense
          fallback={
            <span style={{ display: "inline-block", width: 24, height: 12 }} />
          }
        >
          <WeeklyUltraTinyLineChart
            stock_id={row.stock_id}
            t={dates[todayDate]}
          />
        </Suspense>
      </TableCell>
      <TableCell>
        <Suspense
          fallback={
            <span style={{ display: "inline-block", width: 48, height: 12 }} />
          }
        >
          <RowChart row={row} t={dates[todayDate]} />
        </Suspense>
      </TableCell>
      <TableCell>
        <IconButton
          onClick={() =>
            open(
              row.market_type === "上市"
                ? `https://tw.tradingview.com/chart?symbol=TWSE%3A${row.stock_id}`
                : `https://tw.tradingview.com/chart?symbol=TPEX%3A${row.stock_id}`
            )
          }
        >
          <img
            src="/tradingview.svg"
            alt="tradingview"
            style={{ width: 24, height: 24 }}
          />
        </IconButton>
        <IconButton
          onClick={() =>
            open(
              `https://pchome.megatime.com.tw/stock/sto0/ock1/sid${row.stock_id}.html`
            )
          }
        >
          <img
            src="/pchome_stock.jpg"
            alt="pchome_stock"
            style={{ width: 24, height: 24 }}
          />
        </IconButton>
        {/* <IconButton
          onClick={() =>
            open(`https://statementdog.com/analysis/${row.stock_id}/`)
          }
        >
          <img
            style={{ width: 24, height: 24 }}
            alt="財報狗"
            src="/naughty.svg"
          />
        </IconButton> */}
        <IconButton onClick={openDetailWindow}>
          <InfoIcon />
        </IconButton>
        {type === ActionButtonType.Increase && (
          <IconButton onClick={handleAddToWatchList} disabled={addLoading}>
            <PostAddIcon />
          </IconButton>
        )}
        {type === ActionButtonType.Decrease && (
          <IconButton
            onClick={handleRemoveToWatchList}
            disabled={removeLoading}
          >
            <RemoveCircleOutlineIcon />
          </IconButton>
        )}
      </TableCell>
    </>
  );
});
