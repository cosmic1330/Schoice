import {
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { load as StoreLoad } from "@tauri-apps/plugin-store";
import { useEffect, useState } from "react";
import useExampleData from "../../../hooks/useExampleData";
import useSchoiceStore from "../../../store/Schoice.store";
import { FutureIds, StockTableType, UrlType } from "../../../types";

export default function ExampleSelector() {
  const [menu, setMenu] = useState<StockTableType[]>([]);
  const { exampleChartId, setExampleChartId } = useSchoiceStore();
  const { getNewData, hour, day, week } = useExampleData();
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<StockTableType | null>(
    null
  );

  useEffect(() => {
    StoreLoad("store.json", { autoSave: false }).then((store) => {
      store.get("menu").then((menu) => {
        const menuList = (menu as StockTableType[]) || [];
        // 新增 enum FutureIds 的特殊選項（若尚未存在於 menu 中）
        const futureList: StockTableType[] = [
          {
            stock_id: FutureIds.WTX,
            stock_name: "台指期近一",
            industry_group: "期貨",
            market_type: "期貨",
          },
          {
            stock_id: FutureIds.TWSE,
            stock_name: "台灣加權指數",
            industry_group: "指數",
            market_type: "指數",
          },
        ];

        const combined = [...menuList];
        futureList.forEach((f) => {
          if (!combined.find((m) => m.stock_id === f.stock_id)) {
            combined.push(f);
          }
        });
        setMenu(combined);
      });
    });
  }, []);

  // 當 menu 或 exampleChartId 更新時，同步已選中的 option 到 local state
  useEffect(() => {
    const sel = menu.find((m) => m.stock_id === exampleChartId) || null;
    setSelectedOption(sel);
  }, [menu, exampleChartId]);

  const handleConfirm = async () => {
    if (!selectedOption) return;
    const id = selectedOption.stock_id;
    setLoading(true);
    try {
      setExampleChartId(id);
      await getNewData({ type: UrlType.Indicators, id });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid size={{ xs: 6 }}>
      <Card>
        <CardContent>
          <Typography variant="subtitle1" mb={1} fontWeight="bold">
            範例圖表 (Example)
          </Typography>

          {loading ? (
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <CircularProgress size={14} />
              <Typography variant="body2">更新中...</Typography>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} mb={2}>
              <Chip
                label={
                  hour && hour.length > 0
                    ? `小時: ${hour.length}`
                    : "小時: 未載入"
                }
                color={hour && hour.length > 0 ? "success" : "default"}
                size="small"
              />
              <Chip
                label={
                  day && day.length > 0 ? `日: ${day.length}` : "日: 未載入"
                }
                color={day && day.length > 0 ? "success" : "default"}
                size="small"
              />
              <Chip
                label={
                  week && week.length > 0 ? `週: ${week.length}` : "週: 未載入"
                }
                color={week && week.length > 0 ? "success" : "default"}
                size="small"
              />
            </Stack>
          )}

          <Autocomplete
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
            value={selectedOption}
            onChange={(_, newValue) => setSelectedOption(newValue)}
            fullWidth
            renderInput={(params) => (
              <TextField {...params} label="選擇範例股票" />
            )}
          />
        </CardContent>
        <CardActions sx={{ justifyContent: "flex-end", gap: 1, pr: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirm}
            disabled={!selectedOption || loading}
          >
            {loading && <CircularProgress size={18} sx={{ mr: 1 }} />}
            確定
          </Button>
        </CardActions>
      </Card>
    </Grid>
  );
}
