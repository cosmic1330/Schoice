import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  styled,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
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
  backgroundColor: theme.palette.background.paper,
  border: "3px solid #202027",
  boxShadow: "7px 7px 0 #202027",
  position: "relative",
  overflow: "hidden",
  marginTop: theme.spacing(3),
  "&::after": {
    content: '""',
    position: "absolute",
    top: 0,
    height: "12px",
    width: "120px",
    left: 28,
    right: "auto",
    borderRadius: "0 0 999px 999px",
    background: theme.palette.secondary.main,
  },
}));

export default function Favorite() {
  const { t } = useTranslation();
  const query = useDatabaseQuery();
  const watchStocks = useCloudStore((state) => state.watchStocks);
  const [stocks, setStocks] = useState<StockTableType[]>([]);

  const options = useMemo(() => {
    return new Map(watchStocks.map((data) => [data.stock_id, data]));
  }, [watchStocks]);

  useEffect(() => {
    if (watchStocks.length === 0) {
      setStocks([]);
      return;
    }

    import("../../../store/Setting.store").then(({ getStore }) => {
      getStore().then((store) => {
        store.get("menu").then((menuData) => {
          const menuList = (menuData as StockTableType[]) || [];
          const menuMap = new Map(menuList.map((s) => [s.stock_id, s]));

          query(
            `SELECT * FROM stock WHERE stock_id IN (${watchStocks
              .map((data) => `'${data.stock_id}'`)
              .join(",")})`,
          ).then((data: StockTableType[] | null) => {
            const dbStocks = data || [];
            const dbStockMap = new Map(dbStocks.map((s) => [s.stock_id, s]));

            // 確保所有 watchStocks 中的 ID 都會顯示，即使資料庫查不到元資料
            // 按照加入時間新到舊排序，並優先向 SQLite 查，若無則查全局選單
            const mergedStocks = [...watchStocks]
              .sort(
                (a, b) =>
                  new Date(b.added_date).getTime() - new Date(a.added_date).getTime(),
              )
              .map((data) => {
                const fallback = menuMap.get(data.stock_id);
                return (
                  dbStockMap.get(data.stock_id) ||
                  fallback || {
                    stock_id: data.stock_id,
                    stock_name: t("Pages.Schoice.Favorite.unknownStock", {
                      id: data.stock_id,
                    }),
                    industry_group: "",
                    market_type: "",
                  }
                );
              });
            setStocks(mergedStocks);
          });
        });
      });
    });
  }, [watchStocks, query, t]);

  return (
    <Box
      sx={{
        height: "100%",
        overflowY: "auto",
        "&::-webkit-scrollbar": { display: "none" },
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <Container maxWidth="xl" sx={{ mb: 8 }}>
        <Grid container spacing={4}>
          <Grid size={12}>
            <GlassCard elevation={0}>
              <Box mb={4}>
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{
                    color: "text.primary",
                    display: "inline-block",
                    bgcolor: "warning.main",
                    border: "2px solid #202027",
                    borderRadius: "16px",
                    px: 2,
                    py: 0.5,
                    boxShadow: "3px 3px 0 #202027",
                    transform: "rotate(-1deg)",
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

              <ResultTable
                result={stocks}
                type={ActionButtonType.Decrease}
                options={options}
              />
            </GlassCard>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
