import { Box, Typography } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { t } from "i18next";
import { Control, Controller, FieldErrors } from "react-hook-form";
import useCloudStore from "../../../store/Cloud.store";
import { FormData } from "./type";

export default function Menu({
  control,
  errors,
}: {
  control: Control<FormData, any, FormData>;
  errors: FieldErrors<FormData>;
}) {
  const { menu } = useCloudStore();

  return (
    <Box width="100%">
      <Controller
        name="stock"
        control={control}
        defaultValue={null}
        rules={{
          required: t("Pages.Add.required"),
          pattern: {
            value: /^\d{4}$/,
            message: t("Pages.Add.pattern"),
          },
        }}
        render={({ field }) => (
          <Autocomplete
            {...field}
            disablePortal
            options={menu}
            getOptionLabel={(option) =>
              `${option.stock_id} ${option.stock_name}`
            }
            renderOption={(props, option) => (
              <li {...props} key={option.stock_id}>
                {option.stock_name} ({option.stock_id})
              </li>
            )}
            defaultValue={null}
            value={field.value || null}
            onChange={(_, newValue) => {
              field.onChange(newValue);
            }}
            fullWidth
            renderInput={(params) => (
              <TextField {...params} label={t("Pages.Add.selectStock")} />
            )}
          />
        )}
      />
      <Typography variant="caption" color="error">
        {errors.stock && errors.stock?.message}
      </Typography>
    </Box>
  );
}
