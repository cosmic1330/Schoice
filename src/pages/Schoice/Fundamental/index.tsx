import AddCircleIcon from "@mui/icons-material/AddCircle";
import {
  Box,
  Button,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { stockFundamentalQueryBuilder } from "../../../classes/StockFundamentalQueryBuilder";
import { FundamentalPrompt, FundamentalPrompts } from "../../../types";
import ConditionsList from "./ConditionsList";
import ConditionsTable from "./ConditionsTable";
import FundamentalResult from "./FundamentalResult";

export default function Fundamental() {
  const { indicators, operators, valuesByIndicator } =
    stockFundamentalQueryBuilder.getOptions();
  const [open, setOpen] = useState(false);
  const [prompts, setPrompts] = useState<FundamentalPrompts>([]);
  const [selects, setSelects] = useState<FundamentalPrompt>({
    indicator: indicators[0],
    operator: operators[0],
    value: valuesByIndicator[indicators[0]][0] || "1",
  });

  const handleIndicatorChange = (event: SelectChangeEvent<string>) => {
    const { value } = event.target;
    setSelects((prev) => ({
      ...prev,
      indicator: value,
      value: valuesByIndicator[value][0] || "1",
    }));
  };

  const handleChange = (event: SelectChangeEvent<string>) => {
    const { value, name } = event.target;
    setSelects((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setSelects((prev) => ({
      ...prev,
      value,
    }));
  };

  const handleAddCondition = () => {
    if (!selects.indicator || !selects.operator || !selects.value) {
      return;
    }
    setPrompts((prev) => [...prev, selects]);
  };

  const handleDeleteCondition = (index: number) => {
    setPrompts((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Grid container spacing={2} px={2}>
      <Grid size={6}>
        <ConditionsTable />
      </Grid>
      <Grid size={6} sx={{ overflowY: "auto" }}>
        <Paper
          variant="outlined"
          sx={{ padding: "20px", marginBottom: "20px" }}
        >
          <Typography variant="h5" gutterBottom align="center">
            挑選基本面
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: "20px",
            }}
          >
            <Select
              value={selects.indicator}
              onChange={handleIndicatorChange}
              name="indicator"
              fullWidth
            >
              {indicators.map((indicator) => (
                <MenuItem key={indicator} value={indicator}>
                  {indicator}
                </MenuItem>
              ))}
            </Select>
            <Select
              value={selects.operator}
              onChange={handleChange}
              name="operator"
              fullWidth
            >
              {operators.map((op) => (
                <MenuItem key={op} value={op}>
                  {op}
                </MenuItem>
              ))}
            </Select>
            {open ? (
              <TextField
                name="value"
                type="number"
                label="值"
                fullWidth
                onChange={handleValueChange}
                value={selects.value}
              />
            ) : (
              <Select
                value={selects.value}
                onChange={handleChange}
                name="value"
                fullWidth
              >
                {valuesByIndicator[selects.indicator].map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={open}
                  onChange={() => setOpen((value) => !value)}
                />
              }
              label="設定數字"
            />
          </Box>
          <Box sx={{ textAlign: "center", marginTop: "20px" }}>
            <Tooltip title="Add Condition">
              <Button
                startIcon={<AddCircleIcon />}
                onClick={handleAddCondition}
                variant="contained"
              >
                Add Condition
              </Button>
            </Tooltip>
          </Box>
        </Paper>
        <ConditionsList
          {...{
            prompts,
            handleDeleteCondition,
          }}
        />
      </Grid>
      <Grid size={12}>
        <FundamentalResult />
      </Grid>
    </Grid>
  );
}
