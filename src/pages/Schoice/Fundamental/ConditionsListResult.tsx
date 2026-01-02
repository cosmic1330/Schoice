import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { stockFundamentalQueryBuilder } from "../../../classes/StockFundamentalQueryBuilder";
import { useUser } from "../../../context/UserContext";
import useDatabaseQuery from "../../../hooks/useDatabaseQuery";
import useCloudStore from "../../../store/Cloud.store";
import useSchoiceStore from "../../../store/Schoice.store";
import { FundamentalPrompts, StockTableType } from "../../../types";

export default function ConditionsListResult({
  prompts,
}: {
  prompts: FundamentalPrompts;
}) {
  const { t } = useTranslation();
  const query = useDatabaseQuery();
  const [results, setResults] = useState<StockTableType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const { setFilterStocks } = useSchoiceStore();
  const { setFundamentalCondition } = useCloudStore();
  const { user } = useUser();

  useEffect(() => {
    setIsFetching(true);
    setResults([]);

    const timer = setTimeout(() => {
      stockFundamentalQueryBuilder
        .getStocksByConditions({ conditions: prompts })
        .then((stockIds) => {
          if (!stockIds || stockIds.length === 0) {
            setResults([]);
            setIsFetching(false);
          } else {
            query(
              `SELECT * FROM stock WHERE stock_id IN (${stockIds
                .map((id) => `'${id}'`)
                .join(",")})`
            ).then((data: StockTableType[] | null) => {
              setResults(data || []);
              setIsFetching(false);
            });
          }
        })
        .catch((err) => {
          console.error("Fundamental query error:", err);
          setIsFetching(false);
        });
    }, 0);

    return () => clearTimeout(timer);
  }, [prompts, query]);

  const handleClick = useCallback(async () => {
    if (isLoading) return;
    if (!user) {
      toast.error(t("Pages.Schoice.Header.msgPleaseLogin"));
      return;
    }

    try {
      setIsLoading(true);
      setFilterStocks(results);
      await setFundamentalCondition(prompts, user.id);
      toast.success(t("Pages.Schoice.Fundamental.msgSuccess"));
    } catch (error) {
      toast.error(t("Pages.Schoice.Fundamental.msgError"));
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading,
    results,
    setFilterStocks,
    setFundamentalCondition,
    prompts,
    user,
    t,
  ]);

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.4),
        p: 2,
        borderRadius: 2,
      }}
    >
      <Box display="flex" alignItems="center" gap={2}>
        <Typography
          variant="subtitle1"
          fontWeight={800}
          sx={{ color: "text.primary" }}
        >
          {t("Pages.Schoice.Fundamental.matchResult")}
        </Typography>
        {isFetching ? (
          <CircularProgress size={20} thickness={6} />
        ) : (
          <Chip
            label={t("Pages.Schoice.Fundamental.totalMatches", {
              count: results.length,
            })}
            color="primary"
            variant="outlined"
            size="small"
            sx={{
              fontWeight: 700,
              borderRadius: "8px",
              borderWidth: "2px",
            }}
          />
        )}
      </Box>
      <Button
        variant="contained"
        color="success"
        onClick={handleClick}
        disabled={isLoading || isFetching || results.length === 0}
        sx={{
          borderRadius: "10px",
          px: 4,
          fontWeight: 800,
          boxShadow: (theme) =>
            `0 4px 14px 0 ${alpha(theme.palette.success.main, 0.3)}`,
        }}
      >
        {isLoading
          ? t("Pages.Schoice.Fundamental.processing")
          : t("Pages.Schoice.Fundamental.confirm")}
      </Button>
    </Stack>
  );
}
