import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Container,
} from "@mui/material";
import useSchoiceStore from "../../../store/Schoice.store";
import CollapseRow from "./CollapseRow";
import { t } from "i18next";
export default function TrashTable() {
  const { trash } = useSchoiceStore();

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center"></TableCell>
              <TableCell align="center" component="th" scope="row">
                {t("Pages.Schoice.Trash.name")}
              </TableCell>
              <TableCell align="center">
                {t("Pages.Schoice.Trash.type")}
              </TableCell>
              <TableCell align="center">
                {t("Pages.Schoice.Trash.time")}
              </TableCell>
              <TableCell align="center">
                {t("Pages.Schoice.Trash.action")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trash.map((item, index) => (
              <CollapseRow key={index} item={item} />
            ))}
            {trash.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary">
                    {t("Pages.Schoice.Trash.empty")}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
