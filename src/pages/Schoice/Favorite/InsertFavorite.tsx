import { Button, Stack } from "@mui/material";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { useUser } from "../../../context/UserContext";
import useCloudStore from "../../../store/Cloud.store";
import Menu from "./Menu";
import { FormData } from "./type";
import { useTranslation } from "react-i18next";

export default function InsertFavorite() {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();
  const { user } = useUser();
  const { addToWatchList } = useCloudStore();
    const { t } = useTranslation();

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
    [reset, user]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
      <Stack direction="row" spacing={2} my={2}>
        <Menu {...{ control, errors }} />
        <Button
          type="submit"
          variant="contained"
          size="small"
          fullWidth
          disabled={isSubmitting}
        >
          {t("Pages.Add.add")}
        </Button>
      </Stack>
    </form>
  );
}
