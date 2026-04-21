import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { AnimatePresence, motion } from "framer-motion";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { stockFundamentalQueryBuilder } from "../../../classes/StockFundamentalQueryBuilder";
import ResultTable from "../../../components/ResultTable/ResultTable";
import { DatabaseContext } from "../../../context/DatabaseContext";
import { useUser } from "../../../context/UserContext";
import useDatabaseQuery from "../../../hooks/useDatabaseQuery";
import useCloudStore from "../../../store/Cloud.store";
import useSchoiceStore from "../../../store/Schoice.store";
import {
  FundamentalPrompt,
  FundamentalPrompts,
  StockTableType,
} from "../../../types";

// --- Styled Components (Density Optimized) ---

const PageWrapper = styled(Box)(({ theme }) => ({
  height: "100%",
  background:
    theme.palette.mode === "dark"
      ? alpha(theme.palette.background.default, 0.95)
      : theme.palette.background.default,
  overflowY: "auto",
  "&::-webkit-scrollbar": { display: "none" },
  scrollbarWidth: "none",
}));

const CompactGlassBar = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  backgroundColor: alpha(theme.palette.background.paper, 0.6),
  backdropFilter: "blur(12px)",
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: "12px",
  boxShadow: "0 4px 20px -10px rgba(0,0,0,0.1)",
}));

const ConditionChip = styled(motion.div)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  padding: theme.spacing(0.5, 1.5),
  borderRadius: "8px",
  background: alpha(theme.palette.primary.main, 0.05),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  "&:hover": {
    background: alpha(theme.palette.primary.main, 0.1),
    borderColor: alpha(theme.palette.primary.main, 0.3),
  },
}));

const GradientButton = styled(Button)(({ theme }) => ({
  borderRadius: "8px",
  padding: "6px 20px",
  fontWeight: 700,
  textTransform: "none",
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.35)}`,
  "&:hover": {
    transform: "translateY(-1px)",
    boxShadow: `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.45)}`,
  },
}));

// --- Main Component ---

export default function Fundamental() {
  const { t } = useTranslation();
  const { indicators, operators, valuesByIndicator } =
    stockFundamentalQueryBuilder.getOptions();
  const query = useDatabaseQuery();
  const { db } = useContext(DatabaseContext);
  const { user } = useUser();
  const { fundamentalCondition, reload, setFundamentalCondition } =
    useCloudStore();
  const { filterStocks, setFilterStocks } = useSchoiceStore();

  const [prompts, setPrompts] = useState<FundamentalPrompts>([]);
  const [selects, setSelects] = useState<FundamentalPrompt>(() => {
    const firstInd = indicators?.[0] || "";
    return {
      indicator: firstInd,
      operator: operators?.[0] || "",
      value: (firstInd && valuesByIndicator[firstInd]?.[0]) || "1",
    };
  });
  const [isCustomValue, setIsCustomValue] = useState(false);
  const [results, setResults] = useState<StockTableType[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (user) reload(user.id);
  }, [user, reload]);

  useEffect(() => {
    if (fundamentalCondition) setPrompts(fundamentalCondition);
  }, [fundamentalCondition]);

  useEffect(() => {
    if (prompts.length === 0) {
      setResults([]);
      return;
    }
    setIsFetching(true);
    const timer = setTimeout(() => {
      if (db) stockFundamentalQueryBuilder.setDatabase(db);
      stockFundamentalQueryBuilder
        .getStocksByConditions({ conditions: prompts })
        .then((stockIds) => {
          if (!stockIds || stockIds.length === 0) {
            setResults([]);
          } else {
            query(
              `SELECT * FROM stock WHERE stock_id IN (${stockIds.map((id) => `'${id}'`).join(",")})`,
            ).then((data: StockTableType[] | null) => setResults(data || []));
          }
        })
        .finally(() => setIsFetching(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [prompts, db, query]);

  const handleAdd = () => {
    if (!selects.indicator || !selects.operator || !selects.value) return;
    setPrompts((prev) => [...prev, selects]);
  };

  const handleExecute = async () => {
    if (isConfirming || !user) return;
    try {
      setIsConfirming(true);
      setFilterStocks(results);
      await setFundamentalCondition(prompts, user.id);
      toast.success(t("Pages.Schoice.Fundamental.msgSuccess"));
    } catch (e) {
      toast.error(t("Pages.Schoice.Fundamental.msgError"));
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <PageWrapper>
      {/* --- Density Optimized Header & Builder --- */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: (theme) => alpha(theme.palette.background.default, 0.8),
          backdropFilter: "blur(8px)",
          borderBottom: (theme) =>
            `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          p: 1.5,
          px: 3,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={3} sx={{ mb: 1.5 }}>
          <Typography
            variant="h6"
            fontWeight={900}
            sx={{ letterSpacing: -0.5, color: "primary.main" }}
          >
            {t("Pages.Schoice.Fundamental.title")}
          </Typography>

          {/* Horizontal Builder Bar */}
          <CompactGlassBar elevation={0} sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{ flex: 2 }}>
                <Select
                  value={selects.indicator}
                  onChange={(e) => {
                    const val = e.target.value as string;
                    setSelects((p) => ({
                      ...p,
                      indicator: val,
                      value:
                        (valuesByIndicator[val] && valuesByIndicator[val][0]) ||
                        "1",
                    }));
                  }}
                  fullWidth
                  size="small"
                  variant="standard"
                  disableUnderline
                  sx={{ fontWeight: 700, fontSize: "0.875rem" }}
                >
                  {indicators.map((i) => (
                    <MenuItem key={i} value={i}>
                      {i}
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Select
                  value={selects.operator}
                  onChange={(e) =>
                    setSelects((p) => ({ ...p, operator: e.target.value }))
                  }
                  fullWidth
                  size="small"
                  variant="standard"
                  disableUnderline
                  sx={{
                    fontWeight: 800,
                    color: "secondary.main",
                    fontSize: "0.875rem",
                  }}
                >
                  {operators.map((o) => (
                    <MenuItem key={o} value={o}>
                      {o}
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              <Box sx={{ flex: 1.5 }}>
                {isCustomValue ? (
                  <TextField
                    fullWidth
                    size="small"
                    variant="standard"
                    type="number"
                    value={selects.value}
                    onChange={(e) =>
                      setSelects((p) => ({ ...p, value: e.target.value }))
                    }
                    InputProps={{
                      disableUnderline: true,
                      style: { fontWeight: 800, fontSize: "0.875rem" },
                    }}
                  />
                ) : (
                  <Select
                    value={selects.value}
                    onChange={(e) =>
                      setSelects((p) => ({
                        ...p,
                        value: e.target.value as string,
                      }))
                    }
                    fullWidth
                    size="small"
                    variant="standard"
                    disableUnderline
                    sx={{ fontWeight: 800, fontSize: "0.875rem" }}
                  >
                    {(valuesByIndicator[selects.indicator] || []).map((v) => (
                      <MenuItem key={v} value={v}>
                        {v}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              </Box>

              <Divider
                orientation="vertical"
                flexItem
                sx={{ height: 20, my: "auto" }}
              />

              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title={t("Pages.Schoice.Fundamental.setNumber")}>
                  <Switch
                    size="small"
                    checked={isCustomValue}
                    onChange={() => setIsCustomValue(!isCustomValue)}
                    color="secondary"
                  />
                </Tooltip>
                <IconButton color="primary" onClick={handleAdd} size="small">
                  <AddCircleIcon />
                </IconButton>
              </Stack>
            </Stack>
          </CompactGlassBar>

          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ textAlign: "right", minWidth: 60 }}>
              <Typography
                variant="h6"
                fontWeight={900}
                sx={{ lineHeight: 1, color: "primary.main" }}
              >
                {isFetching ? (
                  <CircularProgress size={14} thickness={6} />
                ) : (
                  results.length
                )}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={700}
              >
                MATCHES
              </Typography>
            </Box>
            <GradientButton
              disabled={results.length === 0 || isFetching || isConfirming}
              onClick={handleExecute}
              variant="contained"
              size="small"
              startIcon={
                isConfirming ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <SearchIcon />
                )
              }
            >
              FINALIZE
            </GradientButton>
          </Stack>
        </Stack>

        {/* Dynamic Condition Chips Area */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
          <AnimatePresence>
            {prompts.map((p, i) => (
              <ConditionChip
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                layout
              >
                <Typography
                  variant="caption"
                  fontWeight={800}
                  color="primary.main"
                >
                  #{i + 1}
                </Typography>
                <Typography variant="caption" fontWeight={700}>
                  {p.indicator}
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight={900}
                  color="secondary.main"
                >
                  {p.operator}
                </Typography>
                <Typography variant="caption" fontWeight={800}>
                  {p.value}
                </Typography>
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{
                    ml: 1,
                    borderLeft: (theme) =>
                      `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    pl: 1,
                  }}
                >
                  <IconButton
                    size="small"
                    sx={{ p: 0.2 }}
                    onClick={() => {
                      setSelects(p);
                      setPrompts((prev) => prev.filter((_, idx) => idx !== i));
                    }}
                  >
                    <EditIcon sx={{ fontSize: 12 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    sx={{ p: 0.2 }}
                    onClick={() =>
                      setPrompts((prev) => prev.filter((_, idx) => idx !== i))
                    }
                  >
                    <DeleteIcon sx={{ fontSize: 12 }} />
                  </IconButton>
                </Stack>
              </ConditionChip>
            ))}
          </AnimatePresence>
        </Box>
      </Box>

      {/* --- Main Result Table Area --- */}
      <Box sx={{ p: 2 }}>
        {filterStocks && filterStocks.length > 0 ? (
          <Box
            sx={{
              borderRadius: "16px",
              overflow: "hidden",
              border: (theme) =>
                `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              background: alpha("#fff", 0.02),
            }}
          >
            <ResultTable result={filterStocks} />
          </Box>
        ) : (
          <Box
            sx={{
              height: "60vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.3,
            }}
          >
            <SearchIcon sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h6" fontWeight={700}>
              START FILTERING
            </Typography>
            <Typography variant="body2">
              Add conditions to see potential stock matches here
            </Typography>
          </Box>
        )}
      </Box>
    </PageWrapper>
  );
}
