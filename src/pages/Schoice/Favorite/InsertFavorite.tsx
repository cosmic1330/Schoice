import AddCircleIcon from "@mui/icons-material/AddCircle";
import { Box, Button, Stack, alpha } from "@mui/material";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useUser } from "../../../context/UserContext";
import useCloudStore from "../../../store/Cloud.store";
import Menu from "./Menu";
import { FormData } from "./type";

export default function InsertFavorite() {
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();
  const { user } = useUser();
  const { addToWatchList } = useCloudStore();

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (!data.stock) {
        return;
      }
      const { stock } = data;
      if (!user) {
        console.error("User not logged in");
        return;
      }
      await addToWatchList(stock.stock_id, user.id);
      reset();
    },
    [reset, user, addToWatchList]
  );

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ width: "100%" }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems="flex-start"
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
          border: (theme) => `1px dashed ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Box sx={{ flexGrow: 1, width: "100%" }}>
          <Menu {...{ control, errors }} />
        </Box>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          startIcon={<AddCircleIcon />}
          sx={{
            height: "56px",
            px: 4,
            borderRadius: "12px",
            whiteSpace: "nowrap",
            minWidth: { sm: "140px" },
            boxShadow: (theme) =>
              `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
            alignSelf: { xs: "stretch", sm: "flex-start" },
          }}
        >
          {t("Pages.Add.add")}
        </Button>
      </Stack>
    </Box>
  );
}
