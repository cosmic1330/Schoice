import DeleteIcon from "@mui/icons-material/Delete";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import {
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { StorePrompt } from "../../../types";
import ConditionsListResult from "./ConditionsListResult";

export default function ConditionsList({
  prompts,
  handleDeleteCondition,
}: {
  prompts: StorePrompt[];
  handleDeleteCondition: (index: number) => void;
}) {
  return (
    <Paper variant="outlined" sx={{ padding: 2, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        條件列表
      </Typography>
      <Grid container spacing={2}>
        {prompts.map((prompt, index) => (
          <Grid size={3} key={index}>
            <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    配置 #{index + 1}
                  </Typography>
                  <Chip label="1 条條件记录" size="small" color="primary" />
                </Stack>
                <Stack spacing={1} mb={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <StarBorderIcon fontSize="small" />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      类别:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {prompt.indicator1}
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <StarBorderIcon fontSize="small" />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      操作符:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {prompt.operator}
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <StarBorderIcon fontSize="small" />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      值:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {prompt.indicator2}
                    </Typography>
                  </Stack>
                </Stack>
                <Stack direction="row" justifyContent="flex-end">
                  <Tooltip title="删除条件">
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteCondition(index)}
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Divider sx={{ my: 2 }} />
      <ConditionsListResult {...{ prompts }} />
    </Paper>
  );
}
