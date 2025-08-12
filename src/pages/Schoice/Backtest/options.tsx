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
        label="本金"
        type="number"
        onChange={handleChange("capital")}
        value={options.capital}
        size="small"
      />
      <TextField
        label="買入股價區間(以上)"
        type="number"
        size="small"
        onChange={handleChange("lowStockPrice")}
      />
      <TextField
        label="買入股價區間(以下)"
        type="number"
        size="small"
        onChange={handleChange("hightStockPrice")}
      />
      <TextField
        label="可承受虧損(%)"
        size="small"
        type="number"
        onChange={handleChange("hightLoss")}
      />
      <FormControl>
        <InputLabel>買入價格位置</InputLabel>
        <Select
          onChange={handleSelectChange("buyPrice")}
          value={options.buyPrice}
          size="small"
          fullWidth
        >
          <MenuItem value={BuyPrice.OPEN}>開盤價</MenuItem>
          <MenuItem value={BuyPrice.CLOSE}>收盤價</MenuItem>
          <MenuItem value={BuyPrice.HIGHT}>最高價</MenuItem>
          <MenuItem value={BuyPrice.LOW}>最低價</MenuItem>
        </Select>
      </FormControl>

      <FormControl>
        <InputLabel>賣出價格位置</InputLabel>
        <Select
          onChange={handleSelectChange("sellPrice")}
          value={options.sellPrice}
          size="small"
          fullWidth
        >
          <MenuItem value={SellPrice.OPEN}>開盤價</MenuItem>
          <MenuItem value={SellPrice.CLOSE}>收盤價</MenuItem>
          <MenuItem value={SellPrice.HIGHT}>最高價</MenuItem>
          <MenuItem value={SellPrice.LOW}>最低價</MenuItem>
        </Select>
      </FormControl>

      <Stack direction="row" alignItems="center">
        <Checkbox
          checked={isRandom}
          onChange={() => setIsRandom((prev) => !prev)}
        />
        <Typography variant="body2">隨機排列</Typography>
      </Stack>
    </Stack>
  );
}
