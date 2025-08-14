import InfoIcon from "@mui/icons-material/Info";
import PostAddIcon from "@mui/icons-material/PostAdd";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import { open } from "@tauri-apps/plugin-shell";
import React, { forwardRef } from "react";
import { toast } from "react-toastify";
import { useUser } from "../../context/UserContext";
import useDetailWebviewWindow from "../../hooks/useDetailWebviewWindow";
import useCloudStore from "../../store/Cloud.store";
import { FundamentalTableType } from "../../types";
import DailyUltraTinyLineChart from "./Charts/DailyUltraTinyLineChart";
import HourlyUltraTinyLineChart from "./Charts/HourlyUltraTinyLineChart";
import WeeklyUltraTinyLineChart from "./Charts/WeeklyUltraTinyLineChart";
import RowChart from "./RowChart";
import { ActionButtonType } from "./types";

function TooltipContent({ row }: { row: FundamentalTableType }) {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        本益比: {row.pe}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        殖利率: {row.dividend_yield}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        股價淨值比: {row.pb}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        EPS: {row.eps}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        YOY: {row.yoy}
      </Typography>
    </Box>
  );
}

export default forwardRef(function ResultTableRow(
  {
    row,
    index,
    type,
  }: {
    row: any;
    index: number;
    type: ActionButtonType;
  },
  ref: React.Ref<HTMLTableRowElement>
) {
  const { openDetailWindow } = useDetailWebviewWindow({
    id: row.stock_id,
    name: row.name,
    group: row.market_type,
  });
  const { user } = useUser();
  const { addToWatchList, removeFromWatchList } = useCloudStore();

  const [addLoading, setAddLoading] = React.useState(false);
  const [removeLoading, setRemoveLoading] = React.useState(false);

  const handleAddToWatchList = async () => {
    if (!user) {
      toast.error("Please login first!");
      return;
    }
    setAddLoading(true);
    try {
      await addToWatchList(row.stock_id, user.id);
      toast.success(`Add ${row.name} Success!`);
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
      toast.success(`Remove ${row.name} Success!`);
    } finally {
      setRemoveLoading(false);
    }
  };

  return (
    <TableRow hover role="checkbox" tabIndex={-1} ref={ref}>
      <TableCell key={index}>{index + 1}.</TableCell>
      <TableCell key={row.t}>{row.t}</TableCell>
      <TableCell key={row.stock_id}>{row.stock_id}</TableCell>
      <Tooltip title={<TooltipContent row={row} />}>
        <TableCell key={row.name}>{row.name}</TableCell>
      </Tooltip>
      <TableCell key={row.c}>{row.c}</TableCell>
      <TableCell>
        <HourlyUltraTinyLineChart stock_id={row.stock_id} t={row.t} />
      </TableCell>
      <TableCell>
        <DailyUltraTinyLineChart stock_id={row.stock_id} t={row.t} />
      </TableCell>
      <TableCell>
        <WeeklyUltraTinyLineChart stock_id={row.stock_id} t={row.t} />
      </TableCell>

      <TableCell>
        <RowChart row={row} />
      </TableCell>
      <TableCell key={row + row.k}>
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
