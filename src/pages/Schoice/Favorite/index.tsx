import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  alpha,
  styled,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ResultTable from "../../../components/ResultTable/ResultTable";
import { ActionButtonType } from "../../../components/ResultTable/types";
import useDatabaseQuery from "../../../hooks/useDatabaseQuery";
import useCloudStore from "../../../store/Cloud.store";
import { StockTableType } from "../../../types";
import Alarm from "./Alarm";
import InsertFavorite from "./InsertFavorite";

const GlassCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: alpha(theme.palette.background.paper, 0.7),
  backdropFilter: "blur(12px)",
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow:
    theme.palette.mode === "dark"
      ? "0 8px 32px 0 rgba(0, 0, 0, 0.37)"
      : "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
  position: "relative",
  overflow: "hidden",
  marginTop: theme.spacing(3),
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

export default function Favorite() {
  const { t } = useTranslation();
  const query = useDatabaseQuery();
  const { watchStocks } = useCloudStore();
  const [stocks, setStocks] = useState<StockTableType[]>([]);

  useEffect(() => {
    if (watchStocks.length === 0) {
      setStocks([]);
      return;
    }
    query(
      `SELECT * FROM stock WHERE stock_id IN (${watchStocks
        .map((id) => `'${id}'`)
        .join(",")})`
    ).then((data: StockTableType[] | null) => {
      const dbStocks = data || [];
      const dbStockMap = new Map(dbStocks.map((s) => [s.stock_id, s]));

      // 確保所有 watchStocks 中的 ID 都會顯示，即使資料庫查不到元資料
      const mergedStocks = watchStocks.map((id) => {
        return (
          dbStockMap.get(id) || {
            stock_id: id,
            stock_name: t("Pages.Schoice.Favorite.unknownStock", { id }),
            industry_group: "",
            market_type: "",
          }
        );
      });
      setStocks(mergedStocks);
    });
  }, [watchStocks, query]);

  return (
    <Container maxWidth="xl">
      <Grid container spacing={4}>
        <Grid size={12}>
          <GlassCard elevation={0}>
            <Box mb={4}>
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{
                  background: (theme) =>
                    `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  mb: 1,
                }}
              >
                {t("Pages.Schoice.Favorite.title")}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={500}
              >
                {t("Pages.Schoice.Favorite.alarmCompare")}
              </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Alarm stocks={stocks} />
            </Box>

            <Box sx={{ mb: 4 }}>
              <InsertFavorite />
            </Box>

            <ResultTable result={stocks} type={ActionButtonType.Decrease} />
          </GlassCard>
        </Grid>
      </Grid>
    </Container>
  );
}
