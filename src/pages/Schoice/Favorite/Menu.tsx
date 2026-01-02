import { Box, Typography, alpha } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { useEffect, useState } from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { getStore } from "../../../store/Setting.store";
import { StockTableType } from "../../../types";
import { FormData } from "./type";

export default function Menu({
  control,
  errors,
}: {
  control: Control<FormData, any, FormData>;
  errors: FieldErrors<FormData>;
}) {
  const [menu, setMenu] = useState<StockTableType[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    getStore().then((store) => {
      store.get("menu").then((menu) => {
        const menuList = menu as StockTableType[];
        setMenu(menuList);
      });
    });
  }, []);

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
              <li
                {...props}
                key={option.stock_id}
                style={{ fontSize: "0.875rem" }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {option.stock_name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ ml: 1, color: "text.disabled" }}
                >
                  ({option.stock_id})
                </Typography>
              </li>
            )}
            defaultValue={null}
            value={field.value || null}
            onChange={(_, newValue) => {
              field.onChange(newValue);
            }}
            fullWidth
            renderInput={(params) => (
              <TextField
                {...params}
                label={t("Pages.Add.selectStock")}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    bgcolor: (theme) =>
                      alpha(theme.palette.background.paper, 0.5),
                    "& fieldset": {
                      borderColor: (theme) => alpha(theme.palette.divider, 0.1),
                    },
                    "&:hover fieldset": {
                      borderColor: (theme) =>
                        alpha(theme.palette.primary.main, 0.3),
                    },
                  },
                }}
              />
            )}
          />
        )}
      />
      {errors.stock && (
        <Typography
          variant="caption"
          color="error"
          sx={{ mt: 0.5, display: "block", fontWeight: 600 }}
        >
          {errors.stock.message}
        </Typography>
      )}
    </Box>
  );
}
