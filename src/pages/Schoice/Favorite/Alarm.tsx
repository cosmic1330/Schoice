import AnalyticsIcon from "@mui/icons-material/Analytics";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useDatabaseQuery from "../../../hooks/useDatabaseQuery";
import useFindStocksByPrompt from "../../../hooks/useFindStocksByPrompt";
import useCloudStore from "../../../store/Cloud.store";
import { StockTableType } from "../../../types";

const GlassPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: alpha(theme.palette.background.paper, 0.4),
  backdropFilter: "blur(10px)",
  border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
  boxShadow: "none",
}));

const ConditionCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  background:
    theme.palette.mode === "dark"
      ? alpha(theme.palette.primary.main, 0.03)
      : alpha(theme.palette.primary.main, 0.01),
  transition: "all 0.3s ease",
  minHeight: 140,
  "&:hover": {
    borderColor: alpha(theme.palette.primary.main, 0.3),
    transform: "translateY(-2px)",
    boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
  },
}));

export default function Alarm({ stocks }: { stocks: StockTableType[] }) {
  const { t } = useTranslation();
  const { alarms } = useCloudStore();
  const { getPromptSqlScripts, getCombinedSqlScript } = useFindStocksByPrompt();
  const query = useDatabaseQuery();

  const [stockAlarmMap, setStockAlarmMap] = useState<Record<string, string[]>>(
    {}
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      if (stocks.length === 0 || Object.keys(alarms).length === 0) {
        setStockAlarmMap({});
        return;
      }

      try {
        setLoading(true);
        const stocksObj = stocks.reduce((acc, stock) => {
          acc[stock.stock_id] = [];
          return acc;
        }, {} as Record<string, string[]>);

        const stockIds = stocks.map((s) => s.stock_id);

        for (let key of Object.keys(alarms)) {
          const promptItem = alarms[key];
          try {
            const sqls = await getPromptSqlScripts(promptItem, stockIds);
            const conbineSql = getCombinedSqlScript(sqls);

            if (conbineSql) {
              const ids = (await query(conbineSql)) as { stock_id: string }[];
              if (ids && Array.isArray(ids)) {
                for (let { stock_id } of ids) {
                  if (stocksObj[stock_id]) {
                    stocksObj[stock_id].push(alarms[key].name);
                  }
                }
              }
            }
          } catch (itemErr) {
            console.error(`Error processing alarm ${key}:`, itemErr);
          }
        }

        if (!ignore) {
          setStockAlarmMap(stocksObj);
        }
      } catch (err) {
        console.error("fetchData error", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchData();

    return () => {
      ignore = true;
    };
  }, [alarms, stocks, query, getPromptSqlScripts, getCombinedSqlScript]);

  const alarmStocks = stocks.filter(
    (stock) =>
      stockAlarmMap[stock.stock_id] && stockAlarmMap[stock.stock_id].length > 0
  );

  return (
    <GlassPaper elevation={0}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <NotificationsActiveIcon sx={{ color: "warning.main" }} />
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{ color: "text.primary" }}
          >
            {t("Pages.Schoice.Favorite.alarmCompare")}
          </Typography>
        </Stack>
        {loading && (
          <CircularProgress size={20} thickness={6} color="warning" />
        )}
      </Stack>

      {stocks.length === 0 ? (
        <Typography
          color="text.secondary"
          align="center"
          py={4}
          fontWeight={500}
        >
          {t("Pages.Schoice.Favorite.noStocks")}
        </Typography>
      ) : alarmStocks.length === 0 && !loading ? (
        <Typography color="text.disabled" align="center" py={4} variant="body2">
          {t("Pages.Schoice.Favorite.noAlarmsActive")}
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {alarmStocks.map((stock) => (
            <Grid key={stock.stock_id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <ConditionCard elevation={0}>
                <CardContent
                  sx={{
                    p: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <AnalyticsIcon
                      sx={{ fontSize: 18, color: "primary.main" }}
                    />
                    <Typography
                      variant="subtitle2"
                      fontWeight={800}
                      sx={{ lineHeight: 1.2 }}
                    >
                      {stock.stock_name}
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{ ml: 1, color: "text.disabled", fontWeight: 700 }}
                      >
                        {stock.stock_id}
                      </Typography>
                    </Typography>
                  </Stack>

                  <Box sx={{ flexGrow: 1 }}>
                    {loading ? (
                      <Typography variant="caption" color="text.disabled">
                        {t("Pages.Schoice.Favorite.loading")}
                      </Typography>
                    ) : (
                      <Stack
                        direction="row"
                        spacing={0.5}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        {stockAlarmMap[stock.stock_id].map((alarm, idx) => (
                          <Chip
                            key={idx}
                            label={alarm}
                            color="warning"
                            size="small"
                            variant="outlined"
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.65rem",
                              borderRadius: "4px",
                              height: "20px",
                              borderColor: (theme) =>
                                alpha(theme.palette.warning.main, 0.3),
                              bgcolor: (theme) =>
                                alpha(theme.palette.warning.main, 0.05),
                            }}
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>
                </CardContent>
              </ConditionCard>
            </Grid>
          ))}
        </Grid>
      )}
    </GlassPaper>
  );
}
