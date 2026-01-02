import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import HistoryIcon from "@mui/icons-material/History";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import RestoreIcon from "@mui/icons-material/Restore";
import {
  Button,
  Chip,
  Divider,
  IconButton,
  Paper,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import Stack from "@mui/material/Stack";
import { alpha, styled } from "@mui/material/styles";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUser } from "../../../context/UserContext";
import useCloudStore from "../../../store/Cloud.store";
import { PromptType, TrashPrompt } from "../../../types";
import formatDateTime from "../../../utils/formatDateTime";

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.main, 0.02),
  },
  "&.Mui-selected": {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
  },
}));

const DetailBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: alpha(theme.palette.background.paper, 0.2),
  borderRadius: "0 0 12px 12px",
}));

const ConditionGroup = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: alpha(theme.palette.background.paper, 0.4),
  backdropFilter: "blur(4px)",
  border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
  borderRadius: "12px",
  flex: 1,
  minWidth: "200px",
}));

export default function CollapseRow({ item }: { item: TrashPrompt }) {
  const [open, setOpen] = useState(false);
  const { recover, removeFromTrash } = useCloudStore();
  const { user } = useUser();
  const { t } = useTranslation();

  const isBull = item.type === PromptType.BULL;

  return (
    <>
      <StyledTableRow selected={open}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
            sx={{
              transform: open ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 0.2s",
            }}
          >
            <KeyboardArrowDownIcon />
          </IconButton>
        </TableCell>
        <TableCell align="left">
          <Typography variant="subtitle2" fontWeight={700}>
            {item.value.name}
          </Typography>
        </TableCell>
        <TableCell align="center">
          <Chip
            label={
              isBull
                ? t("Pages.Schoice.Trash.typeBull")
                : t("Pages.Schoice.Trash.typeBear")
            }
            size="small"
            sx={{
              fontWeight: 700,
              bgcolor: isBull ? alpha("#4caf50", 0.1) : alpha("#f44336", 0.1),
              color: isBull ? "#4caf50" : "#f44336",
              border: `1px solid ${
                isBull ? alpha("#4caf50", 0.2) : alpha("#f44336", 0.2)
              }`,
            }}
          />
        </TableCell>
        <TableCell align="center">
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            justifyContent="center"
            sx={{ opacity: 0.7 }}
          >
            <HistoryIcon sx={{ fontSize: 14 }} />
            <Typography variant="caption" fontWeight={500}>
              {formatDateTime(item.time)}
            </Typography>
          </Stack>
        </TableCell>
        <TableCell align="center">
          <Stack direction="row" spacing={1} justifyContent="center">
            <Tooltip title={t("Pages.Schoice.Trash.recover")}>
              <Button
                variant="contained"
                size="small"
                startIcon={<RestoreIcon />}
                onClick={() => user && recover(item.id, user.id)}
                sx={{
                  borderRadius: "8px",
                  boxShadow: "none",
                  textTransform: "none",
                  fontWeight: 700,
                  "&:hover": { boxShadow: "none" },
                }}
              >
                {t("Pages.Schoice.Trash.recover")}
              </Button>
            </Tooltip>
            <Tooltip title={t("Pages.Schoice.Trash.remove")}>
              <IconButton
                color="error"
                size="small"
                onClick={() => {
                  if (
                    user &&
                    window.confirm(t("Pages.Schoice.Trash.confirmDelete"))
                  ) {
                    removeFromTrash(item.value.index, item.id, user.id);
                  }
                }}
                sx={{
                  bgcolor: (theme) => alpha(theme.palette.error.main, 0.05),
                  "&:hover": {
                    bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                  },
                }}
              >
                <DeleteForeverIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </TableCell>
      </StyledTableRow>
      <TableRow>
        <TableCell
          style={{ paddingBottom: 0, paddingTop: 0, border: "none" }}
          colSpan={6}
        >
          <Collapse in={open} timeout="auto" unmountOnExit>
            <DetailBox>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Typography
                  variant="subtitle2"
                  fontWeight={800}
                  color="primary"
                  sx={{ opacity: 0.8 }}
                >
                  {t("Pages.Schoice.Trash.promptDetails")}
                </Typography>
                <Divider sx={{ flexGrow: 1, opacity: 0.1 }} />
              </Stack>

              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                {[
                  { key: "hourly", label: t("Pages.Schoice.Trash.hourly") },
                  { key: "daily", label: t("Pages.Schoice.Trash.daily") },
                  { key: "weekly", label: t("Pages.Schoice.Trash.weekly") },
                ].map((type) => {
                  const conditions =
                    item.value.conditions[
                      type.key as keyof typeof item.value.conditions
                    ];
                  if (!conditions || conditions.length === 0) return null;

                  return (
                    <ConditionGroup key={type.key} elevation={0}>
                      <Typography
                        variant="caption"
                        fontWeight={900}
                        color="text.secondary"
                        sx={{
                          mb: 1,
                          display: "block",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {type.label}
                      </Typography>
                      <Stack spacing={0.5}>
                        {conditions.map((prompt, idx) => (
                          <Box key={idx} sx={{ display: "flex", gap: 1 }}>
                            <Typography
                              variant="caption"
                              color="primary"
                              fontWeight={700}
                            >
                              {idx + 1}.
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.primary"
                              fontWeight={500}
                            >
                              {`${prompt.day1}${prompt.indicator1} ${prompt.operator} ${prompt.day2}${prompt.indicator2}`}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </ConditionGroup>
                  );
                })}
              </Stack>
            </DetailBox>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}
