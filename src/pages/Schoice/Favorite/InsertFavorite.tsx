import { Button, Stack } from "@mui/material";
import { emit } from "@tauri-apps/api/event";
import { info } from "@tauri-apps/plugin-log";
import { t } from "i18next";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import useStocksStore from "../../../store/Stock.store";
import Menu from "../../Add/Menu";
import type FormData from "../../Add/type";

export default function InsertFavorite() {
  const { increase, reload } = useStocksStore();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = useCallback(async (data: FormData) => {
    if (data.stock) {
      await reload();
      increase(data.stock);
      await emit("stock-added", { stockNumber: data.stock.id });
      reset();
    } else {
      info(t("Pages.Add.noStock"));
    }
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
      <Stack direction="row" spacing={2} my={2}>
        <Menu {...{ control, errors }} />
        <Button type="submit" variant="contained" size="small" fullWidth>
          {t("Pages.Add.add")}
        </Button>
      </Stack>
    </form>
  );
}
