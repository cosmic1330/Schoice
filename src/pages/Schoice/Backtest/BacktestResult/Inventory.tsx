import { dateFormat } from "@ch20026103/anysis";
import { Mode } from "@ch20026103/anysis/dist/esm/stockSkills/utils/dateFormat";
import { Context } from "@ch20026103/backtest-lib";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useDatabaseQuery from "../../../../hooks/useDatabaseQuery";
import useSchoiceStore from "../../../../store/Schoice.store";
import StockTextButton from "./StockTextButton";

const GlassPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  backgroundColor: alpha(theme.palette.background.paper, 0.4),
  backdropFilter: "blur(10px)",
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: "16px",
  height: "100%",
  boxShadow: "none",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
  },
  "& td": {
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
  },
}));

const StyledHeaderCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: "transparent",
  color: alpha(theme.palette.text.primary, 0.6),
  fontWeight: 800,
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  padding: theme.spacing(1.5),
}));

export default function Inventory({ ctx }: { ctx: Context }) {
  const { t } = useTranslation();
  const { backtestPersent } = useSchoiceStore();
  const [unsoldProfits, setUnsoldProfits] = useState<
    | {
        [id: string]: {
          t: string;
          c: number;
        };
      }
    | undefined
  >();
  const query = useDatabaseQuery();

  const getData = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      const sql = `SELECT stock_id, t, c FROM daily_deal
    WHERE (stock_id, t) IN (
         SELECT stock_id, MAX(t)
         FROM daily_deal
         WHERE stock_id IN ('${ids.join("','")}')
         GROUP BY stock_id
    );`;
      const result = (await query(sql)) as [];

      const resultMap: { [id: string]: { t: string; c: number } } =
        result.reduce((acc: any, item: any) => {
          acc[item.stock_id] = { t: item.t, c: item.c };
          return acc;
        }, {});
      setUnsoldProfits(resultMap);
    },
    [query]
  );

  useEffect(() => {
    if (backtestPersent === 100 && ctx?.record?.inventory) {
      const ids = Object.keys(ctx?.record.inventory);
      getData(ids);
    }
  }, [backtestPersent, getData, ctx?.record?.inventory]);

  return (
    <GlassPaper elevation={0}>
      <Typography
        variant="caption"
        fontWeight={800}
        color="text.secondary"
        sx={{
          textTransform: "uppercase",
          mb: 2,
          display: "block",
          letterSpacing: "0.1em",
        }}
      >
        {t("Pages.Schoice.Backtest.inventoryTitle")}
      </Typography>
      <TableContainer sx={{ flex: 1, maxHeight: "500px" }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <StyledHeaderCell align="center">
                {t("Pages.Schoice.Backtest.buyDate")}
              </StyledHeaderCell>
              <StyledHeaderCell align="center">
                {t("Pages.Schoice.Backtest.buyPrice")}
              </StyledHeaderCell>
              <StyledHeaderCell align="center">
                {t("Pages.Schoice.Backtest.stock")}
              </StyledHeaderCell>
              <StyledHeaderCell align="center">
                {t("Pages.Schoice.Backtest.unsoldDate")}
              </StyledHeaderCell>
              <StyledHeaderCell align="center">
                {t("Pages.Schoice.Backtest.unsoldPrice")}
              </StyledHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.values(ctx?.record.inventory || {}).map((item, index) => (
              <StyledTableRow key={index}>
                <TableCell align="center" sx={{ fontWeight: 500 }}>
                  {dateFormat(item.buyDate, Mode.NumberToString)}
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ color: "primary.main", fontWeight: 700 }}
                >
                  {`$${item.buyData.c.toLocaleString()}`}
                </TableCell>
                <TableCell align="center">
                  <StockTextButton id={item.id} name={item.name} />
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ color: "text.secondary", fontWeight: 500 }}
                >
                  {unsoldProfits ? unsoldProfits[item.id]?.t : "N/A"}
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ color: "primary.main", fontWeight: 700 }}
                >
                  {unsoldProfits
                    ? `$${unsoldProfits[item.id]?.c.toLocaleString()}`
                    : "N/A"}
                </TableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </GlassPaper>
  );
}
