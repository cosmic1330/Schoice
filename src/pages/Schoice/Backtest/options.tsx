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
import { alpha, styled } from "@mui/material/styles";
import { SetStateAction } from "react";
import { useTranslation } from "react-i18next";

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiInputBase-root": {
    borderRadius: "8px",
    backgroundColor: alpha(theme.palette.background.paper, 0.2),
  },
  "& .MuiInputLabel-root": {
    color: alpha(theme.palette.text.primary, 0.6),
    fontWeight: 600,
  },
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  flex: 1,
  minWidth: "180px",
  "& .MuiInputBase-root": {
    borderRadius: "8px",
    backgroundColor: alpha(theme.palette.background.paper, 0.2),
  },
  "& .MuiInputLabel-root": {
    color: alpha(theme.palette.text.primary, 0.6),
    fontWeight: 600,
  },
}));

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
    <Stack gap={3} my={2}>
      <Stack direction="row" flexWrap="wrap" gap={2}>
        <StyledTextField
          label={t("Pages.Schoice.Backtest.capital")}
          type="number"
          onChange={handleChange("capital")}
          value={options.capital}
          size="small"
          sx={{ flex: 1, minWidth: "150px" }}
        />
        <StyledTextField
          label={t("Pages.Schoice.Backtest.lowStockPrice")}
          type="number"
          size="small"
          onChange={handleChange("lowStockPrice")}
          value={options.lowStockPrice}
          sx={{ flex: 1, minWidth: "150px" }}
        />
        <StyledTextField
          label={t("Pages.Schoice.Backtest.hightStockPrice")}
          type="number"
          size="small"
          onChange={handleChange("hightStockPrice")}
          value={options.hightStockPrice}
          sx={{ flex: 1, minWidth: "150px" }}
        />
        <StyledTextField
          label={t("Pages.Schoice.Backtest.hightLoss")}
          size="small"
          type="number"
          onChange={handleChange("hightLoss")}
          value={options.hightLoss}
          sx={{ flex: 1, minWidth: "150px" }}
        />
      </Stack>

      <Stack direction="row" flexWrap="wrap" gap={2} alignItems="center">
        <StyledFormControl size="small">
          <InputLabel>{t("Pages.Schoice.Backtest.buyPrice")}</InputLabel>
          <Select
            onChange={handleSelectChange("buyPrice")}
            value={options.buyPrice}
            label={t("Pages.Schoice.Backtest.buyPrice")}
          >
            <MenuItem value={BuyPrice.OPEN}>
              {t("Pages.Schoice.Backtest.openPrice")}
            </MenuItem>
            <MenuItem value={BuyPrice.CLOSE}>
              {t("Pages.Schoice.Backtest.closePrice")}
            </MenuItem>
            <MenuItem value={BuyPrice.HIGHT}>
              {t("Pages.Schoice.Backtest.hightPrice")}
            </MenuItem>
            <MenuItem value={BuyPrice.LOW}>
              {t("Pages.Schoice.Backtest.lowPrice")}
            </MenuItem>
          </Select>
        </StyledFormControl>

        <StyledFormControl size="small">
          <InputLabel>{t("Pages.Schoice.Backtest.sellPrice")}</InputLabel>
          <Select
            onChange={handleSelectChange("sellPrice")}
            value={options.sellPrice}
            label={t("Pages.Schoice.Backtest.sellPrice")}
          >
            <MenuItem value={SellPrice.OPEN}>
              {t("Pages.Schoice.Backtest.openPrice")}
            </MenuItem>
            <MenuItem value={SellPrice.CLOSE}>
              {t("Pages.Schoice.Backtest.closePrice")}
            </MenuItem>
            <MenuItem value={SellPrice.HIGHT}>
              {t("Pages.Schoice.Backtest.hightPrice")}
            </MenuItem>
            <MenuItem value={SellPrice.LOW}>
              {t("Pages.Schoice.Backtest.lowPrice")}
            </MenuItem>
          </Select>
        </StyledFormControl>

        <Stack direction="row" alignItems="center" sx={{ px: 1 }}>
          <Checkbox
            checked={isRandom}
            onChange={() => setIsRandom((prev) => !prev)}
            sx={{
              color: alpha("#2196f3", 0.5),
              "&.Mui-checked": { color: "#2196f3" },
            }}
          />
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            {t("Pages.Schoice.Backtest.randomize")}
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  );
}
