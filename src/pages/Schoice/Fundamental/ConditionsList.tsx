import CategoryIcon from "@mui/icons-material/Category";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import TuneIcon from "@mui/icons-material/Tune";
import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { FundamentalPrompts } from "../../../types";
import ConditionsListResult from "./ConditionsListResult";

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
  "&:hover": {
    borderColor: alpha(theme.palette.primary.main, 0.3),
    transform: "translateY(-2px)",
    boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
  },
}));

export default function ConditionsList({
  prompts,
  handleDeleteCondition,
  handleEditCondition,
}: {
  prompts: FundamentalPrompts;
  handleDeleteCondition: (index: number) => void;
  handleEditCondition: (index: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <GlassPaper elevation={0}>
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <TuneIcon sx={{ color: "primary.main" }} />
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{ color: "text.primary" }}
        >
          {t("Pages.Schoice.Fundamental.conditionList")}
        </Typography>
      </Stack>

      <Grid container spacing={2}>
        {prompts.map((prompt, index) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={index}>
            <ConditionCard elevation={0}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      color: "primary.main",
                      letterSpacing: 1,
                    }}
                  >
                    {t("Pages.Schoice.Fundamental.configPrefix")} #{index + 1}
                  </Typography>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip
                      title={t("Pages.Schoice.Fundamental.editCondition")}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleEditCondition(index)}
                        sx={{
                          bgcolor: (theme) =>
                            alpha(theme.palette.primary.main, 0.05),
                          "&:hover": {
                            bgcolor: (theme) =>
                              alpha(theme.palette.primary.main, 0.1),
                          },
                        }}
                      >
                        <EditIcon
                          sx={{ fontSize: 14, color: "primary.main" }}
                        />
                      </IconButton>
                    </Tooltip>
                    <Tooltip
                      title={t("Pages.Schoice.Fundamental.deleteCondition")}
                    >
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteCondition(index)}
                        sx={{
                          bgcolor: (theme) =>
                            alpha(theme.palette.error.main, 0.05),
                          "&:hover": {
                            bgcolor: (theme) =>
                              alpha(theme.palette.error.main, 0.1),
                          },
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>

                <Stack spacing={1.5}>
                  <Stack direction="row" alignItems="flex-start" spacing={1}>
                    <CategoryIcon
                      sx={{ fontSize: 16, color: "text.disabled", mt: 0.2 }}
                    />
                    <Box>
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 600,
                          lineHeight: 1,
                        }}
                      >
                        {t("Pages.Schoice.Fundamental.category")}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {prompt.indicator}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" alignItems="flex-start" spacing={1}>
                    <PrecisionManufacturingIcon
                      sx={{ fontSize: 16, color: "text.disabled", mt: 0.2 }}
                    />
                    <Box>
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 600,
                          lineHeight: 1,
                        }}
                      >
                        {t("Pages.Schoice.Fundamental.operator")}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: "secondary.main" }}
                      >
                        {prompt.operator}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" alignItems="flex-start" spacing={1}>
                    <MyLocationIcon
                      sx={{ fontSize: 16, color: "text.disabled", mt: 0.2 }}
                    />
                    <Box>
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 600,
                          lineHeight: 1,
                        }}
                      >
                        {t("Pages.Schoice.Fundamental.value")}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>
                        {prompt.value}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </CardContent>
            </ConditionCard>
          </Grid>
        ))}
      </Grid>

      {prompts.length > 0 && (
        <>
          <Divider sx={{ my: 3, opacity: 0.5 }} />
          <ConditionsListResult {...{ prompts }} />
        </>
      )}
    </GlassPaper>
  );
}
