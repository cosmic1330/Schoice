import { Button, Stack } from "@mui/material";
import { t } from "i18next";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { useUser } from "../../../context/UserContext";
import useSchoiceStore from "../../../store/Schoice.store";
import Menu from "./Menu";
import { FormData } from "./type";

export default function InsertFavorite() {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();
  const { user } = useUser();
  const { addToWatchList } = useSchoiceStore();

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
      await addToWatchList(stock, user.id);
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
