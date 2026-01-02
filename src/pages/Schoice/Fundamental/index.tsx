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
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { stockFundamentalQueryBuilder } from "../../../classes/StockFundamentalQueryBuilder";
import { useUser } from "../../../context/UserContext";
import useCloudStore from "../../../store/Cloud.store";
import { FundamentalPrompt, FundamentalPrompts } from "../../../types";
import ConditionsList from "./ConditionsList";
import FundamentalResult from "./FundamentalResult";

const GlassCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: alpha(theme.palette.background.paper, 0.7),
  backdropFilter: "blur(12px)",
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow:
    theme.palette.mode === "dark"
      ? "0 8px 32px 0 rgba(0, 0, 0, 0.37)"
      : "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
  position: "relative",
  overflow: "hidden",
  "&::after": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "2px",
    background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent)`,
    opacity: 0.5,
  },
}));

export default function Fundamental() {
  const { t } = useTranslation();
  const { indicators, operators, valuesByIndicator } =
    stockFundamentalQueryBuilder.getOptions();
  const [open, setOpen] = useState(false);
  const [prompts, setPrompts] = useState<FundamentalPrompts>([]);
  const [selects, setSelects] = useState<FundamentalPrompt>({
    indicator: indicators[0],
    operator: operators[0],
    value: valuesByIndicator[indicators[0]][0] || "1",
  });

  // Persistence Logic
  const { user } = useUser();
  const { fundamentalCondition, reload } = useCloudStore();

  useEffect(() => {
    if (user) {
      reload(user.id);
    }
  }, [user, reload]);

  useEffect(() => {
    if (fundamentalCondition) {
      setPrompts(fundamentalCondition);
    }
  }, [fundamentalCondition]);

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

  const handleEditCondition = (index: number) => {
    const target = prompts[index];
    if (!target) return;

    // Check if value is in the standard list
    const standardValues = valuesByIndicator[target.indicator] || [];
    const isCustomValue = !standardValues.includes(target.value);

    setSelects(target);
    setOpen(isCustomValue);

    // Remove from list so it can be re-added after edit
    handleDeleteCondition(index);
  };

  return (
    <Grid container spacing={3} p={3}>
      <Grid size={{ xs: 12, md: 7 }}>
        <ConditionsList
          {...{
            prompts,
            handleDeleteCondition,
            handleEditCondition,
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 5 }}>
        <GlassCard elevation={0}>
          <Typography
            variant="h5"
            gutterBottom
            align="center"
            fontWeight={800}
            sx={{
              mb: 4,
              background: (theme) =>
                `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {t("Pages.Schoice.Fundamental.title")}
          </Typography>
          <Stack spacing={3}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "20px",
              }}
            >
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 700,
                    mb: 1,
                    display: "block",
                  }}
                >
                  {t("Pages.Schoice.Fundamental.category")}
                </Typography>
                <Select
                  value={selects.indicator}
                  onChange={handleIndicatorChange}
                  name="indicator"
                  fullWidth
                  size="small"
                >
                  {indicators.map((indicator) => (
                    <MenuItem key={indicator} value={indicator}>
                      {indicator}
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 700,
                    mb: 1,
                    display: "block",
                  }}
                >
                  {t("Pages.Schoice.Fundamental.operator")}
                </Typography>
                <Select
                  value={selects.operator}
                  onChange={handleChange}
                  name="operator"
                  fullWidth
                  size="small"
                >
                  {operators.map((op) => (
                    <MenuItem key={op} value={op}>
                      {op}
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 700,
                    mb: 1,
                    display: "block",
                  }}
                >
                  {t("Pages.Schoice.Fundamental.value")}
                </Typography>
                {open ? (
                  <TextField
                    name="value"
                    type="number"
                    fullWidth
                    size="small"
                    onChange={handleValueChange}
                    value={selects.value}
                    autoFocus
                  />
                ) : (
                  <Select
                    value={selects.value}
                    onChange={handleChange}
                    name="value"
                    fullWidth
                    size="small"
                  >
                    {valuesByIndicator[selects.indicator].map((value) => (
                      <MenuItem key={value} value={value}>
                        {value}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              </Box>
            </Box>

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={open}
                    onChange={() => setOpen((value) => !value)}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {t("Pages.Schoice.Fundamental.setNumber")}
                  </Typography>
                }
              />

              <Tooltip title={t("Pages.Schoice.Fundamental.addCondition")}>
                <Button
                  startIcon={<AddCircleIcon />}
                  onClick={handleAddCondition}
                  variant="contained"
                  sx={{
                    borderRadius: "10px",
                    px: 3,
                    boxShadow: (theme) =>
                      `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
                  }}
                >
                  {t("Pages.Schoice.Fundamental.addCondition")}
                </Button>
              </Tooltip>
            </Box>
          </Stack>
        </GlassCard>
      </Grid>
      <Grid size={12}>
        <Box sx={{ mt: 2 }}>
          <FundamentalResult />
        </Box>
      </Grid>
    </Grid>
  );
}
