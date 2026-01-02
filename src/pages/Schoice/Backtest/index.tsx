import { dateFormat } from "@ch20026103/anysis";
import { Mode } from "@ch20026103/anysis/dist/esm/stockSkills/utils/dateFormat";
import type {
  Options as BacktestOptions,
  StrategyMethod,
} from "@ch20026103/backtest-lib";
import { BuyPrice, Context, SellPrice } from "@ch20026103/backtest-lib";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import PlayCircleFilledWhiteIcon from "@mui/icons-material/PlayCircleFilledWhite";
import SettingsIcon from "@mui/icons-material/Settings";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
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

const GlassCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: alpha(theme.palette.background.paper, 0.4),
  backdropFilter: "blur(12px)",
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: "16px",
  boxShadow: "none",
  position: "relative",
  overflow: "hidden",
}));

const ConfigHeader = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 800,
  fontSize: "0.875rem",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

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
      `SELECT * FROM stock WHERE stock_id IN (${watchStocks
        .map((id) => `'${id}'`)
        .join(",")})`
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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <Stack direction="row" alignItems="center" spacing={2} mb={1}>
          <AssessmentIcon color="primary" sx={{ fontSize: 36 }} />
          <Typography
            variant="h4"
            fontWeight={900}
            sx={{ letterSpacing: "-0.02em" }}
          >
            {t("Pages.Schoice.Backtest.title")}
          </Typography>
        </Stack>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ opacity: 0.8 }}
        >
          {t("Pages.Schoice.Backtest.subtitle")}
        </Typography>
      </Box>

      <GlassCard elevation={0} sx={{ mb: 4 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <ConfigHeader>
              <AddCircleOutlineIcon fontSize="small" />
              {t("Pages.Schoice.Backtest.bullStrategy")}
            </ConfigHeader>
            <Select
              fullWidth
              value={selectedBull}
              onChange={handleBullChange}
              size="small"
              multiple
              displayEmpty
              renderValue={(selected) => {
                if ((selected as string[]).length === 0) {
                  return (
                    <Typography color="text.disabled" variant="body2">
                      {t("Pages.Schoice.Backtest.favorite")}
                    </Typography>
                  );
                }
                return (selected as string[])
                  .map((key) => bulls[key]?.name)
                  .join(", ");
              }}
              sx={{ borderRadius: "8px" }}
            >
              {Object.keys(bulls).map((key) => (
                <MenuItem key={key} value={key}>
                  {bulls[key].name}
                </MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <ConfigHeader>
              <StopCircleIcon fontSize="small" />
              {t("Pages.Schoice.Backtest.bearStrategy")}
            </ConfigHeader>
            <Select
              value={selectedBear}
              onChange={handleBearChange}
              size="small"
              fullWidth
              multiple
              displayEmpty
              renderValue={(selected) => {
                if ((selected as string[]).length === 0) {
                  return (
                    <Typography color="text.disabled" variant="body2">
                      {t("Pages.Schoice.Backtest.favorite")}
                    </Typography>
                  );
                }
                return (selected as string[])
                  .map((key) => bears[key]?.name)
                  .join(", ");
              }}
              sx={{ borderRadius: "8px" }}
            >
              {Object.keys(bears).map((key) => (
                <MenuItem key={key} value={key}>
                  {bears[key].name}
                </MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 4,
            }}
          >
            <ConfigHeader>
              <Inventory2Icon fontSize="small" sx={{ fontSize: 16 }} />
              {t("Pages.Schoice.Backtest.source")}
            </ConfigHeader>
            <Select
              value={selectedStocks}
              onChange={handleStocksChange}
              size="small"
              fullWidth
              sx={{ borderRadius: "8px" }}
            >
              <MenuItem value={SelectedStocks.WatchStock}>
                {t("Pages.Schoice.Backtest.favorite")}
              </MenuItem>
              {filterStocks && (
                <MenuItem value={SelectedStocks.FilterStocks}>
                  {t("Pages.Schoice.Backtest.filter")}
                </MenuItem>
              )}
            </Select>
          </Grid>

          <Grid size={12}>
            <Divider sx={{ opacity: 0.1, my: 1 }} />
            <ConfigHeader sx={{ mt: 2 }}>
              <SettingsIcon fontSize="small" />
              {t("Pages.Schoice.Backtest.options")}
            </ConfigHeader>
            <Options {...{ isRandom, setIsRandom, options, setOptions }} />
          </Grid>

          <Grid size={12}>
            <Stack direction="row" spacing={2} justifyContent="center" mt={2}>
              {!ctx && status === Status.Idle && (
                <Button
                  variant="contained"
                  onClick={createContext}
                  sx={{
                    borderRadius: "10px",
                    px: 4,
                    py: 1,
                    fontWeight: 700,
                    textTransform: "none",
                    boxShadow: "none",
                    "&:hover": { boxShadow: "none" },
                  }}
                >
                  {t("Pages.Schoice.Backtest.create")}
                </Button>
              )}
              {ctx && status === Status.Idle && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PlayCircleFilledWhiteIcon />}
                  onClick={run}
                  sx={{
                    borderRadius: "10px",
                    px: 4,
                    py: 1,
                    fontWeight: 700,
                    textTransform: "none",
                    boxShadow: "none",
                    "&:hover": { boxShadow: "none" },
                  }}
                >
                  {t("Pages.Schoice.Backtest.run")}
                </Button>
              )}
              {ctx && status === Status.Running && (
                <Button
                  variant="outlined"
                  onClick={stop}
                  sx={{
                    borderRadius: "10px",
                    px: 4,
                    py: 1,
                    fontWeight: 700,
                    textTransform: "none",
                  }}
                >
                  {t("Pages.Schoice.Backtest.stop")}
                </Button>
              )}
              {ctx && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={remove}
                  startIcon={<DeleteSweepIcon />}
                  sx={{
                    borderRadius: "10px",
                    px: 4,
                    py: 1,
                    fontWeight: 700,
                    textTransform: "none",
                  }}
                >
                  {t("Pages.Schoice.Backtest.remove")}
                </Button>
              )}
            </Stack>
          </Grid>
        </Grid>
      </GlassCard>

      {ctx && (
        <Stack spacing={4}>
          <Progress />
          <Divider sx={{ opacity: 0.1 }} />
          <BacktestResult ctx={ctx} />
        </Stack>
      )}
    </Container>
  );
}
