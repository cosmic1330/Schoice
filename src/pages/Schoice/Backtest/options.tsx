import {
  Options as BacktestOptions,
  BuyPrice,
  SellPrice,
} from "@ch20026103/backtest-lib";
import {
  Checkbox,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { SetStateAction } from "react";
import { useTranslation } from "react-i18next";

export default function Options({
  options,
  isRandom,
  setIsRandom,
  setOptions,
}: {
  options: BacktestOptions;
  isRandom: boolean;
  setOptions: React.Dispatch<SetStateAction<BacktestOptions>>;
  setIsRandom: React.Dispatch<SetStateAction<boolean>>;
}) {
  const { t } = useTranslation();

  const handleChange =
    (key: keyof BacktestOptions) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setOptions((prev: BacktestOptions) => ({
        ...prev,
        [key]: parseFloat(event.target.value),
      }));
    };

  const handleSelectChange =
    (key: keyof BacktestOptions) => (event: SelectChangeEvent<unknown>) => {
      setOptions((prev: BacktestOptions) => ({
        ...prev,
        [key]: event.target.value as BuyPrice | SellPrice,
      }));
    };

  return (
    <Stack gap={2} my={2} direction="row" flexWrap="wrap">
      <TextField
        label={t("Pages.Schoice.Backtest.capital")}
        type="number"
        onChange={handleChange("capital")}
        value={options.capital}
        size="small"
      />
      <TextField
        label={t("Pages.Schoice.Backtest.lowStockPrice")}
        type="number"
        size="small"
        onChange={handleChange("lowStockPrice")}
        value={options.lowStockPrice}
      />
      <TextField
        label={t("Pages.Schoice.Backtest.hightStockPrice")}
        type="number"
        size="small"
        onChange={handleChange("hightStockPrice")}
        value={options.hightStockPrice}
      />
      <TextField
        label={t("Pages.Schoice.Backtest.hightLoss")}
        size="small"
        type="number"
        onChange={handleChange("hightLoss")}
        value={options.hightLoss}
      />
      <FormControl>
        <InputLabel>{t("Pages.Schoice.Backtest.buyPrice")}</InputLabel>
        <Select
          onChange={handleSelectChange("buyPrice")}
          value={options.buyPrice}
          size="small"
          fullWidth
        >
          <MenuItem value={BuyPrice.OPEN}>
            {t("Pages.Schoice.Backtest.openPrice")}
          </MenuItem>
          <MenuItem value={BuyPrice.CLOSE}>
            {t("Pages.Schoice.Backtest.closePrice")}
          </MenuItem>
          <MenuItem value={BuyPrice.HIGHT}>
            {t("Pages.Schoice.Backtest.highPrice")}
          </MenuItem>
          <MenuItem value={BuyPrice.LOW}>
            {t("Pages.Schoice.Backtest.lowPrice")}
          </MenuItem>
        </Select>
      </FormControl>

      <FormControl>
        <InputLabel>{t("Pages.Schoice.Backtest.sellPrice")}</InputLabel>
        <Select
          onChange={handleSelectChange("sellPrice")}
          value={options.sellPrice}
          size="small"
          fullWidth
        >
          <MenuItem value={SellPrice.OPEN}>
            {t("Pages.Schoice.Backtest.openPrice")}
          </MenuItem>
          <MenuItem value={SellPrice.CLOSE}>
            {t("Pages.Schoice.Backtest.closePrice")}
          </MenuItem>
          <MenuItem value={SellPrice.HIGHT}>
            {t("Pages.Schoice.Backtest.highPrice")}
          </MenuItem>
          <MenuItem value={SellPrice.LOW}>
            {t("Pages.Schoice.Backtest.lowPrice")}
          </MenuItem>
        </Select>
      </FormControl>

      <Stack direction="row" alignItems="center">
        <Checkbox
          checked={isRandom}
          onChange={() => setIsRandom((prev) => !prev)}
        />
        <Typography variant="body2">
          {t("Pages.Schoice.Backtest.randomize")}
        </Typography>
      </Stack>
    </Stack>
  );
}
