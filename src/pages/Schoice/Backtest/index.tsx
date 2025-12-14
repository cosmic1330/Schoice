import { dateFormat } from "@ch20026103/anysis";
import { Mode } from "@ch20026103/anysis/dist/esm/stockSkills/utils/dateFormat";
import type {
  Options as BacktestOptions,
  StrategyMethod,
} from "@ch20026103/backtest-lib";
import { BuyPrice, Context, SellPrice } from "@ch20026103/backtest-lib";
import InfoIcon from "@mui/icons-material/Info";
import PlayCircleFilledWhiteIcon from "@mui/icons-material/PlayCircleFilledWhite";
import {
  Button,
  Container,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { DatabaseContext } from "../../../context/DatabaseContext";
import useDatabaseQuery from "../../../hooks/useDatabaseQuery";
import useCloudStore from "../../../store/Cloud.store";
import useSchoiceStore from "../../../store/Schoice.store";
import { PromptItem, StockTableType } from "../../../types";
import shuffleArray from "../../../utils/shuffleArray";
import BacktestResult from "./BacktestResult";
import Options from "./options";
import Progress from "./Progress";
import useBacktestFunc, { BacktestType } from "./useBacktestFunc";

enum Status {
  Running = "running",
  Idle = "idle",
}

enum SelectedStocks {
  WatchStock = "watch-stock",
  FilterStocks = "filter-stocks",
}

export default function Backtest() {
  const query = useDatabaseQuery();
  const { t } = useTranslation();
  const { filterStocks, setBacktestPersent } = useSchoiceStore();
  const { bulls, bears, watchStocks } = useCloudStore();
  const { dates } = useContext(DatabaseContext);
  const [ctx, setCtx] = useState<Context>();
  const [selectedBull, setSelectedBull] = useState<string[]>([]);
  const [selectedBear, setSelectedBear] = useState<string[]>([]);
  const [selectedStocks, setSelectedStocks] = useState<SelectedStocks>(
    SelectedStocks.WatchStock
  );
  const [status, setStatus] = useState<Status>(Status.Idle);
  const [options, setOptions] = useState<BacktestOptions>({
    capital: 300000,
    sellPrice: SellPrice.LOW,
    buyPrice: BuyPrice.OPEN,
  });
  const [isRandom, setIsRandom] = useState(true);

  const handleBullChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedBull(typeof value === "string" ? value.split(",") : value);
  };

  const handleBearChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedBear(typeof value === "string" ? value.split(",") : value);
  };

  const handleStocksChange = (event: SelectChangeEvent) => {
    setSelectedStocks(event.target.value as SelectedStocks);
  };

  const get = useBacktestFunc();

  const createContext = useCallback(async () => {
    setBacktestPersent(0);
    if (!selectedBull.length || !selectedBear.length) {
      toast.error(t("Pages.Schoice.Backtest.selectStrategy"));
      return;
    }
    let stocksValue = await query(
      `SELECT * FROM stock WHERE stock_id IN (${watchStocks.map((id) => `'${id}'`).join(",")})`
    );
    if (selectedStocks === SelectedStocks.FilterStocks && filterStocks) {
      stocksValue = filterStocks;
    }
    if (!stocksValue || stocksValue.length === 0) {
      toast.error(t("Pages.Schoice.Backtest.noData"));
      return;
    }

    const genStrategyMethod = (
      select: PromptItem,
      type: BacktestType
    ): StrategyMethod => {
      return (stockId: string, date: number, inWait: boolean | undefined) =>
        get(stockId, date, inWait, {
          select,
          type,
        });
    };

    const contextDates = [...dates]
      .reverse()
      .map((date) => dateFormat(date, Mode.StringToNumber));

    // 隨機排列
    if (isRandom && stocksValue) {
      stocksValue = shuffleArray(stocksValue);
    }

    const ctx = new Context({
      dates: contextDates,
      stocks: stocksValue.map((stock: StockTableType) => ({
        id: stock.stock_id,
        name: stock.stock_name,
      })),
      buy: selectedBull.map((key) =>
        genStrategyMethod(bulls[key], BacktestType.Buy)
      ),
      sell: selectedBear.map((key) =>
        genStrategyMethod(bears[key], BacktestType.Sell)
      ),
      options: { ...options }, // 確保傳遞的是新的物件
    });
    setCtx(ctx);
  }, [
    selectedBull,
    selectedBear,
    selectedStocks,
    filterStocks,
    dates,
    get,
    options,
    isRandom,
  ]);

  const run = useCallback(async () => {
    setStatus(Status.Running);
    if (ctx) {
      sessionStorage.removeItem("schoice:backtest:run");
      let status = true;
      while (status) {
        status = await ctx.run();
        if (sessionStorage.getItem("schoice:backtest:run") === "false") {
          status = false;
        }
        setBacktestPersent(
          Math.floor(
            (ctx.dateSequence.historyDates.length / dates.length) * 100
          )
        );
      }
    }
    setStatus(Status.Idle);
  }, [ctx, setBacktestPersent, dates, options]);

  const stop = useCallback(() => {
    setStatus(Status.Idle);
    sessionStorage.setItem("schoice:backtest:run", "false");
  }, []);

  const remove = useCallback(() => {
    setCtx(undefined);
    sessionStorage.setItem("schoice:backtest:run", "false");
    setStatus(Status.Idle);
  }, []);

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        {t("Pages.Schoice.Backtest.title")}
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        {t("Pages.Schoice.Backtest.subtitle")}
      </Typography>
      <Paper
        elevation={16}
        sx={{ padding: 2, marginBottom: 2, borderRadius: 2 }}
      >
        <Grid container spacing={3}>
          <Grid size={4}>
            <Typography variant="subtitle1" gutterBottom>
              {t("Pages.Schoice.Backtest.bullStrategy")}
              <Tooltip title={t("Pages.Schoice.Backtest.bullOption")}>
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <Select
              fullWidth
              value={selectedBull}
              onChange={handleBullChange}
              size="small"
              multiple
              renderValue={(selected) =>
                (selected as string[]).map((key) => bulls[key]?.name).join(", ")
              }
            >
              <MenuItem value="">
                <em>{t("Pages.Schoice.Backtest.favorite")}</em>
              </MenuItem>
              {Object.keys(bulls).map((key) => (
                <MenuItem key={key} value={key}>
                  {bulls[key].name}
                </MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid size={4}>
            <Typography variant="subtitle1" gutterBottom>
              {t("Pages.Schoice.Backtest.bearStrategy")}
              <Tooltip title={t("Pages.Schoice.Backtest.bearOption")}>
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>

            <Select
              value={selectedBear}
              onChange={handleBearChange}
              size="small"
              fullWidth
              multiple
              renderValue={(selected) =>
                (selected as string[]).map((key) => bears[key]?.name).join(", ")
              }
            >
              <MenuItem value="">
                <em>{t("Pages.Schoice.Backtest.favorite")}</em>
              </MenuItem>
              {Object.keys(bears).map((key) => (
                <MenuItem key={key} value={key}>
                  {bears[key].name}
                </MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid size={4}>
            <Typography variant="subtitle1" gutterBottom>
              {t("Pages.Schoice.Backtest.source")}
            </Typography>
            <Select
              value={selectedStocks}
              onChange={handleStocksChange}
              size="small"
              fullWidth
            >
              <MenuItem value={SelectedStocks.WatchStock}>
                <em>{t("Pages.Schoice.Backtest.favorite")}</em>
              </MenuItem>
              {filterStocks && (
                <MenuItem value={SelectedStocks.FilterStocks}>
                  <em>{t("Pages.Schoice.Backtest.filter")}</em>
                </MenuItem>
              )}
            </Select>
          </Grid>

          {/* Additional Options */}
          <Grid size={12}>
            <Typography variant="subtitle1" gutterBottom>
              {t("Pages.Schoice.Backtest.options")}
            </Typography>
            <Options {...{ isRandom, setIsRandom, options, setOptions }} />
          </Grid>

          <Grid size={12}>
            <Stack direction="row" spacing={2} justifyContent="center">
              {!ctx && status === Status.Idle && (
                <Button variant="contained" onClick={createContext}>
                  {t("Pages.Schoice.Backtest.create")}
                </Button>
              )}
              {ctx && status === Status.Idle && (
                <Button
                  variant="contained"
                  startIcon={<PlayCircleFilledWhiteIcon />}
                  onClick={run}
                >
                  {t("Pages.Schoice.Backtest.run")}
                </Button>
              )}
              {ctx && status === Status.Running && (
                <Button variant="outlined" onClick={stop}>
                  {t("Pages.Schoice.Backtest.stop")}
                </Button>
              )}
              {ctx && (
                <Button variant="outlined" color="error" onClick={remove}>
                  {t("Pages.Schoice.Backtest.remove")}
                </Button>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {ctx && <Progress />}
      <Divider />
      {ctx && <BacktestResult ctx={ctx} />}
    </Container>
  );
}
