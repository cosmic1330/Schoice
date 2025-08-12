import { TrashPrompt } from "../../../types";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import { useState } from "react";
import {
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import formatDateTime from "../../../utils/formatDateTime";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import useSchoiceStore from "../../../store/Schoice.store";
import { t } from "i18next";

export default function CollapseRow({ item }: { item: TrashPrompt }) {
  const [open, setOpen] = useState(false);
  const { recover, removeFromTrash } = useSchoiceStore();
  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell align="center">{item.value.name}</TableCell>
        <TableCell align="center">{item.type}</TableCell>
        <TableCell align="center">{formatDateTime(item.time)}</TableCell>
        <TableCell align="center">
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => removeFromTrash(item.id)}
            sx={{ mr: 1 }}
          >
            {t("Pages.Schoice.Trash.remove")}
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => recover(item.id)}
            sx={{ mr: 1 }}
          >
            {t("Pages.Schoice.Trash.recover")}
          </Button>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="body1" gutterBottom color="textSecondary">
                {t("Pages.Schoice.Trash.promptDetails")}
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell align="center">
                      {t("Pages.Schoice.Trash.hourly")}
                    </TableCell>
                    <TableCell align="center">
                      {t("Pages.Schoice.Trash.daily")}
                    </TableCell>
                    <TableCell align="center">
                      {t("Pages.Schoice.Trash.weekly")}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell align="center">
                      {item.value.value.hourly?.map((prompt, index) => (
                        <Typography
                          key={index}
                          component="div"
                          variant="caption"
                          color="textSecondary"
                        >
                          {index + 1}.
                          {prompt.day1 +
                            prompt.indicator1 +
                            prompt.operator +
                            prompt.day2 +
                            prompt.indicator2}
                        </Typography>
                      ))}
                    </TableCell>
                    <TableCell align="center">
                      {item.value.value.daily.map((prompt, index) => (
                        <Typography
                          key={index}
                          component="div"
                          variant="caption"
                          color="textSecondary"
                        >
                          {index + 1}.
                          {prompt.day1 +
                            prompt.indicator1 +
                            prompt.operator +
                            prompt.day2 +
                            prompt.indicator2}
                        </Typography>
                      ))}
                    </TableCell>
                    <TableCell align="center">
                      {item.value.value.weekly?.map((prompt, index) => (
                        <Typography
                          key={index}
                          component="div"
                          variant="caption"
                          color="textSecondary"
                        >
                          {index + 1}.
                          {prompt.day1 +
                            prompt.indicator1 +
                            prompt.operator +
                            prompt.day2 +
                            prompt.indicator2}
                        </Typography>
                      ))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}
