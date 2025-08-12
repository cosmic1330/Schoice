import AddCircleIcon from "@mui/icons-material/AddCircle";
import {
  Box,
  Button,
  Grid,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { StockFundamentalQueryBuilder } from "../../../classes/StockFundamentalQueryBuilder";
import { StorePrompt } from "../../../types";
import ConditionsList from "./ConditionsList";
import ConditionsTable from "./ConditionsTable";
import FundamentalResult from "./FundamentalResult";

export default function Fundamental() {
  const [prompts, setPrompts] = useState<StorePrompt[]>([]);
  const [selects, setSelects] = useState<StorePrompt>({
    day1: StockFundamentalQueryBuilder.options.days[0],
    indicator1: StockFundamentalQueryBuilder.options.indicators[0],
    operator: StockFundamentalQueryBuilder.options.operators[0],
    day2: StockFundamentalQueryBuilder.options.days[1],
    indicator2: "0",
  });

  const indicators = StockFundamentalQueryBuilder.options.indicators;
  const operators = StockFundamentalQueryBuilder.options.operators;

  const handleChange = (event: SelectChangeEvent<string>) => {
    const { value, name } = event.target;
    setSelects((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCustomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setSelects((prev) => ({
      ...prev,
      indicator2: value,
    }));
  };

  const handleAddCondition = () => {
    if (!selects.indicator1 || !selects.operator || !selects.indicator2) {
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
          <Typography variant="h4" gutterBottom align="center">
            Fundamental Analysis
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px",
            }}
          >
            <Select
              value={selects.indicator1}
              onChange={handleChange}
              name="indicator1"
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
            <TextField
              name="indicator2"
              type="number"
              label="Value"
              fullWidth
              onChange={handleCustomChange}
              value={selects.indicator2}
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
