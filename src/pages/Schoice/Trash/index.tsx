import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import {
  Box,
  Container,
  Paper,
  Stack,
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
import useCloudStore from "../../../store/Cloud.store";
import CollapseRow from "./CollapseRow";

const GlassCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: alpha(theme.palette.background.paper, 0.4),
  backdropFilter: "blur(12px)",
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: "16px",
  boxShadow: "none",
  position: "relative",
  overflow: "hidden",
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  backgroundColor: "transparent",
  boxShadow: "none",
  "& .MuiTableCell-head": {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    color: theme.palette.text.primary,
    fontWeight: 800,
    borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  },
  "& .MuiTableCell-root": {
    borderColor: alpha(theme.palette.divider, 0.05),
  },
}));

export default function TrashTable() {
  const { trash } = useCloudStore();
  const { t } = useTranslation();

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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={2} mb={1}>
              <DeleteSweepIcon color="primary" sx={{ fontSize: 32 }} />
              <Typography
                variant="h4"
                fontWeight={900}
                sx={{ letterSpacing: "-0.02em" }}
              >
                {t("Pages.Schoice.Trash.title")}
              </Typography>
            </Stack>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ opacity: 0.8 }}
            >
              {t("Pages.Schoice.Trash.subtitle")}
            </Typography>
          </Box>

          <GlassCard elevation={0}>
            <StyledTableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell width={60} />
                    <TableCell align="left">
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
                    <CollapseRow key={item.id || index} item={item} />
                  ))}
                  {trash.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} padding="none">
                        <Box
                          sx={{
                            py: 12,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 2,
                            opacity: 0.5,
                          }}
                        >
                          <Inventory2Icon
                            sx={{ fontSize: 64, color: "text.disabled" }}
                          />
                          <Typography
                            variant="h6"
                            fontWeight={700}
                            color="text.disabled"
                          >
                            {t("Pages.Schoice.Trash.empty")}
                          </Typography>
                          <Typography variant="body2" color="text.disabled">
                            {t("Pages.Schoice.Trash.emptySubtitle")}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </StyledTableContainer>
          </GlassCard>
        </Stack>
      </Container>
    </Box>
  );
}
