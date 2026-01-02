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
import { useTranslation } from "react-i18next";
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

export default function History({ ctx }: { ctx: Context }) {
  const { t } = useTranslation();

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
        {t("Pages.Schoice.Backtest.historyTitle")}
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
                {t("Pages.Schoice.Backtest.sellDate")}
              </StyledHeaderCell>
              <StyledHeaderCell align="center">
                {t("Pages.Schoice.Backtest.sellPrice")}
              </StyledHeaderCell>
              <StyledHeaderCell align="center">
                {t("Pages.Schoice.Backtest.stock")}
              </StyledHeaderCell>
              <StyledHeaderCell align="center">
                {t("Pages.Schoice.Backtest.profit")}
              </StyledHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.values(ctx?.record.history || {}).map((item, index) => {
              const profit = item.sellPrice - item.buyPrice;
              return (
                <StyledTableRow key={index}>
                  <TableCell align="center" sx={{ fontWeight: 500 }}>
                    {dateFormat(item.buyDate, Mode.NumberToString)}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ color: "primary.main", fontWeight: 700 }}
                  >
                    {`$${item.buyPrice.toLocaleString()}`}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 500 }}>
                    {dateFormat(item.sellDate, Mode.NumberToString)}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ color: "primary.main", fontWeight: 700 }}
                  >
                    {`$${item.sellPrice.toLocaleString()}`}
                  </TableCell>
                  <TableCell align="center">
                    <StockTextButton id={item.id} name={item.name} />
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 900,
                      color: profit >= 0 ? "success.main" : "error.main",
                    }}
                  >
                    {profit >= 0 ? "+" : ""}
                    {`$${profit.toLocaleString()}`}
                  </TableCell>
                </StyledTableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </GlassPaper>
  );
}
