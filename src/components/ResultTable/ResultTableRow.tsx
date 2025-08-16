import InfoIcon from "@mui/icons-material/Info";
import PostAddIcon from "@mui/icons-material/PostAdd";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { IconButton, Tooltip } from "@mui/material";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import { open } from "@tauri-apps/plugin-shell";
import React, {
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "react-toastify";
import { DatabaseContext } from "../../context/DatabaseContext";
import { useUser } from "../../context/UserContext";
import useDetailWebviewWindow from "../../hooks/useDetailWebviewWindow";
import useFindStocksByPrompt from "../../hooks/useFindStocksByPrompt";
import useCloudStore from "../../store/Cloud.store";
import useSchoiceStore from "../../store/Schoice.store";
import { StockTableType } from "../../types";
import DailyUltraTinyLineChart from "./Charts/DailyUltraTinyLineChart";
import HourlyUltraTinyLineChart from "./Charts/HourlyUltraTinyLineChart";
import WeeklyUltraTinyLineChart from "./Charts/WeeklyUltraTinyLineChart";
import FundamentalTooltip from "./FundamentalTooltip";
import RowChart from "./RowChart";
import { ActionButtonType } from "./types";

export default forwardRef(function ResultTableRow(
  {
    row,
    index,
    type,
  }: {
    row: StockTableType;
    index: number;
    type: ActionButtonType;
  },
  ref: React.Ref<HTMLTableRowElement>
) {
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
  const [dailyData, setDailyData] = useState<any[]>([]);
  const { getOneDateDailyDataByStockId } = useFindStocksByPrompt();

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

  useEffect(() => {
    const fetchDailyData = async () => {
      try {
        const data = await getOneDateDailyDataByStockId(
          dates[todayDate],
          row.stock_id
        );
        setDailyData(data || []);
      } catch (error) {
        console.error("Error fetching daily data:", error);
        setDailyData([]);
      }
    };

    if (dates[todayDate] && row.stock_id) {
      fetchDailyData();
    }
  }, [dates, todayDate, row.stock_id, getOneDateDailyDataByStockId]);

  const t = useMemo(() => {
    if (dailyData.length === 0) return "N/A";
    return dailyData[dailyData.length - 1].t || "N/A";
  }, [dailyData]);

  const c = useMemo(() => {
    if (dailyData.length === 0) return "N/A";
    return dailyData[dailyData.length - 1].c || "N/A";
  }, [dailyData]);

  return (
    <TableRow hover role="checkbox" tabIndex={-1} ref={ref}>
      <TableCell>{index + 1}.</TableCell>
      <TableCell>{t}</TableCell>
      <TableCell>{row.stock_id}</TableCell>
      <Tooltip title={<FundamentalTooltip row={row} />}>
        <TableCell>{row.stock_name}</TableCell>
      </Tooltip>
      <TableCell>{c}</TableCell>
      <TableCell>
        {c !== "N/A" ? (
          <HourlyUltraTinyLineChart stock_id={row.stock_id} t={t} />
        ) : (
          c
        )}
      </TableCell>
      <TableCell>
        {c !== "N/A" ? (
          <DailyUltraTinyLineChart stock_id={row.stock_id} t={t} />
        ) : (
          c
        )}
      </TableCell>
      <TableCell>
        {c !== "N/A" ? (
          <WeeklyUltraTinyLineChart stock_id={row.stock_id} t={t} />
        ) : (
          c
        )}
      </TableCell>
      <TableCell>{c !== "N/A" ? <RowChart row={row} /> : c}</TableCell>
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
        <IconButton
          onClick={() =>
            open(`https://statementdog.com/analysis/${row.stock_id}/`)
          }
        >
          <img
            style={{ width: 24, height: 24 }}
            alt="財報狗"
            src="/naughty.svg"
          />
        </IconButton>
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
    </TableRow>
  );
});
