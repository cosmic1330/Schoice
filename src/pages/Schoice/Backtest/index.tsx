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
import { SetStateAction, useCallback, useContext, useState } from "react";
import { toast } from "react-toastify";
import { DatabaseContext } from "../../../context/DatabaseContext";
import useSchoiceStore from "../../../store/Schoice.store";
import useStocksStore from "../../../store/Stock.store";
import { PromptItem } from "../../../types";
import shuffleArray from "../../../utils/shuffleArray";
import BacktestResult from "./BacktestResult";
import Options from "./options";
import Progress from "./Progress";
import useBacktestFunc, { BacktestType } from "./useBacktestFunc";

enum Status {
  Running = "running",
  Idle = "idle",
}

export default function Backtest() {
  const { stocks } = useStocksStore();
  const { bulls, bears, filterStocks, setBacktestPersent } = useSchoiceStore();
  const { dates } = useContext(DatabaseContext);
  const [ctx, setCtx] = useState<Context>();
  const [selectedBull, setSelectedBull] = useState<string[]>([]);
  const [selectedBear, setSelectedBear] = useState<string[]>([]);
  const [selectedStocks, setSelectedStocks] = useState("stocks");
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

  const handleStocksChange = (
    event: SelectChangeEvent<SetStateAction<string>>
  ) => {
    setSelectedStocks(event.target.value);
  };

  const get = useBacktestFunc();

  const createContext = useCallback(() => {
    setBacktestPersent(0);
    if (!selectedBull.length || !selectedBear.length) {
      toast.error("請選擇多空策略");
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
    let stocksValue = selectedStocks === "filterStocks" ? filterStocks : stocks;
    if (isRandom && stocksValue) {
      stocksValue = shuffleArray(stocksValue);
    }

    const ctx = new Context({
      dates: contextDates,
      stocks: stocksValue,
      buy: selectedBull.map((key) =>
        genStrategyMethod(bulls[key], BacktestType.Buy)
      ),
      sell: selectedBear.map((key) =>
        genStrategyMethod(bears[key], BacktestType.Sell)
      ),
      options: { ...options }, // 確保傳遞的是新的物件
    });
    console.log("ctx", ctx, options);
    setCtx(ctx);
  }, [
    selectedBull,
    selectedBear,
    selectedStocks,
    filterStocks,
    stocks,
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
        Trading Analysis Dashboard
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Compare and analyze trading strategies
      </Typography>
      <Paper
        elevation={16}
        sx={{ padding: 2, marginBottom: 2, borderRadius: 2 }}
      >
        <Grid container spacing={3}>
          <Grid size={4}>
            <Typography variant="subtitle1" gutterBottom>
              Bull Strategy
              <Tooltip title="可支持多選，多選結果為符合A或B或C其一時，納入待購清單，於隔日買進。">
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
                <em>None</em>
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
              Bears Strategy
              <Tooltip title="可支持多選，多選結果為符合A或B或C其一時，納入待售清單，於隔日賣出。">
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
                <em>None</em>
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
              Source
            </Typography>
            <Select
              value={selectedStocks}
              onChange={handleStocksChange}
              size="small"
              fullWidth
            >
              <MenuItem value="stocks">
                <em>My Favorite</em>
              </MenuItem>
              {filterStocks && (
                <MenuItem value="filterStocks">
                  <em>Fundamental Filter</em>
                </MenuItem>
              )}
            </Select>
          </Grid>

          {/* Additional Options */}
          <Grid size={12}>
            <Typography variant="subtitle1" gutterBottom>
              Additional Options
            </Typography>
            <Options {...{ isRandom, setIsRandom, options, setOptions }} />
          </Grid>

          <Grid size={12}>
            <Stack direction="row" spacing={2} justifyContent="center">
              {!ctx && status === Status.Idle && (
                <Button variant="contained" onClick={createContext}>
                  Create
                </Button>
              )}
              {ctx && status === Status.Idle && (
                <Button
                  variant="contained"
                  startIcon={<PlayCircleFilledWhiteIcon />}
                  onClick={run}
                >
                  Execute Analysis
                </Button>
              )}
              {ctx && status === Status.Running && (
                <Button variant="outlined" onClick={stop}>
                  Stop
                </Button>
              )}
              {ctx && (
                <Button variant="outlined" color="error" onClick={remove}>
                  Delete
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
