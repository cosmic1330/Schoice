import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { load as StoreLoad } from "@tauri-apps/plugin-store";
import { useEffect, useMemo, useState } from "react";
import {
  ComposedChart,
  Customized,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { stockDailyQueryBuilder } from "../../classes/StockDailyQueryBuilder";
import useExampleData from "../../hooks/useExampleData";
import useFormatSkillData, {
  FormatDataRow,
} from "../../hooks/useFormatSkillData";
import useSchoiceStore from "../../store/Schoice.store";
import { FutureIds, Prompts, StockTableType, UrlType } from "../../types";
import BaseCandlestickRectangle from "../RechartCustoms/BaseCandlestickRectangle";

type dataRow = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

interface PromptChartProps {
  hourlyPrompts: Prompts;
  dailyPrompts: Prompts;
  weeklyPrompts: Prompts;

  // data 由呼叫方傳入；若沒有則顯示空白提示
  hourlyData?: dataRow[];
  dailyData?: dataRow[];
  weeklyData?: dataRow[];
}

// 指標顯示名稱到欄位 key 的對應（參考 StockDailyQueryBuilder.mapping）
const indicatorMap: Record<string, keyof FormatDataRow> = Object.entries(
  stockDailyQueryBuilder.getMapping()
).reduce((acc, [name, item]) => {
  acc[name] = item.key as keyof FormatDataRow;
  return acc;
}, {} as Record<string, keyof FormatDataRow>);

const hourMapping: Record<string, number> = {
  現在: 0,
  "1小時前": 1,
  "2小時前": 2,
  "3小時前": 3,
  "4小時前": 4,
  "5小時前": 5,
};

const dayMapping: Record<string, number> = {
  今天: 0,
  昨天: 1,
  前天: 2,
  "3天前": 3,
  "4天前": 4,
  "5天前": 5,
};

// 保留給未來擴充週線條件
const weekMapping: Record<string, number> = {
  本週: 0,
  上週: 1,
  上上週: 2,
  "3週前": 3,
  "4週前": 4,
  "5週前": 5,
};

export default function PromptChart({
  hourlyPrompts,
  dailyPrompts,
  weeklyPrompts,
  hourlyData = [],
  dailyData = [],
  weeklyData = [],
}: PromptChartProps) {
  const { exampleChartId, setExampleChartId } = useSchoiceStore();
  const { getNewData, hour, day, week } = useExampleData();

  // Resolve data source: prioritize internal hook data if available (which updates on selection)
  // But initial load might be empty, so handle carefully.
  // Actually, useExampleData loads on mount.
  const activeHourlyData = hour.length > 0 ? hour : hourlyData;
  const activeDailyData = day.length > 0 ? day : dailyData;
  const activeWeeklyData = week.length > 0 ? week : weeklyData;

  const hourlyFormatData = useFormatSkillData(activeHourlyData);
  const dailyFormatData = useFormatSkillData(activeDailyData);
  const weeklyFormatData = useFormatSkillData(activeWeeklyData);

  const [menu, setMenu] = useState<StockTableType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedOption, setSelectedOption] = useState<StockTableType | null>(
    null
  );

  useEffect(() => {
    StoreLoad("store.json", { autoSave: false }).then((store) => {
      store.get("menu").then((menu) => {
        const menuList = (menu as StockTableType[]) || [];
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
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const list = useMemo(() => {
    if (
      dailyFormatData.length === 0 ||
      hourlyFormatData.length === 0 ||
      weeklyFormatData.length === 0
    )
      return [];

    // helper: 比較兩個值是否符合 operator
    const compare = (left: number, right: number, operator: string) => {
      switch (operator) {
        case "大於":
        case ">":
          return left > right;
        case "小於":
        case "<":
          return left < right;
        case "等於":
        case "=":
          return left === right;
        case "大於等於":
          return left >= right;
        case "小於等於":
          return left <= right;
        default:
          return false;
      }
    };

    // helper: 安全取得 indicator 值
    const getVal = (row: any, key?: keyof FormatDataRow) =>
      row ? row[key as string] : undefined;

    // 計算符合所有 hourlyPrompts 的日期集合
    const hourlyDates: number[] = (() => {
      if (hourlyPrompts.length === 0) return [];

      const matchCount = new Map<number, number>(); // dateKey -> count of prompts matched

      for (const p of hourlyPrompts) {
        const offset1 = hourMapping[p.day1] ?? 0;
        const isCustom = p.day2 === "自定義數值";
        const offset2 = isCustom ? 0 : hourMapping[p.day2];
        const indicator1 = indicatorMap[p.indicator1];
        const indicator2Key = isCustom ? undefined : indicatorMap[p.indicator2];

        const seenDates = new Set<number>(); // 同一 prompt 在同一天只算一次

        for (let i = 0; i < hourlyFormatData.length; i++) {
          const left = getVal(hourlyFormatData[i - offset1], indicator1) as
            | number
            | undefined;
          const right = isCustom
            ? Number(p.indicator2)
            : (getVal(hourlyFormatData[i - offset2], indicator2Key) as
                | number
                | undefined);

          if (left === undefined || right === undefined) continue;

          if (compare(left, right, p.operator)) {
            const dateKey = Math.floor(hourlyFormatData[i].t / 10000);
            if (!seenDates.has(dateKey)) {
              seenDates.add(dateKey);
              matchCount.set(dateKey, (matchCount.get(dateKey) ?? 0) + 1);
            }
          }
        }
      }

      return Array.from(matchCount.entries())
        .filter(([, cnt]) => cnt === hourlyPrompts.length)
        .map(([date]) => date);
    })();

    // 計算符合所有 weeklyPrompts 的日期集合
    const weeklyDates: number[] = (() => {
      if (weeklyPrompts.length === 0) return [];

      const matchCount = new Map<number, number>();

      for (const p of weeklyPrompts) {
        const offset1 = weekMapping[p.day1] ?? 0;
        const isCustom = p.day2 === "自定義數值";
        const offset2 = isCustom ? 0 : weekMapping[p.day2];
        const indicator1 = indicatorMap[p.indicator1];
        const indicator2Key = isCustom ? undefined : indicatorMap[p.indicator2];

        const seenDates = new Set<number>();

        for (let i = 0; i < weeklyFormatData.length; i++) {
          const left = getVal(weeklyFormatData[i - offset1], indicator1) as
            | number
            | undefined;
          const right = isCustom
            ? Number(p.indicator2)
            : (getVal(weeklyFormatData[i - offset2], indicator2Key) as
                | number
                | undefined);

          if (left === undefined || right === undefined) continue;

          if (compare(left, right, p.operator)) {
            // Weekly data usually has dateKey already, but formatData uses 't' as date number (e.g. 20231027)
            const dateKey = weeklyFormatData[i].t;
            if (!seenDates.has(dateKey)) {
              seenDates.add(dateKey);
              matchCount.set(dateKey, (matchCount.get(dateKey) ?? 0) + 1);
            }
          }
        }
      }

      return Array.from(matchCount.entries())
        .filter(([, cnt]) => cnt === weeklyPrompts.length)
        .map(([date]) => date);
    })();

    // 計算 dailyOut：每筆要通過所有 dailyPrompts 才 matched；若有 hourlyPrompts 則還需在 hourlyDates
    const dailyOut = dailyFormatData.map((d) => ({ ...d, matched: false }));

    if (dailyPrompts.length === 0) {
      if (hourlyPrompts.length > 0) {
        for (let i = 0; i < dailyOut.length; i++) {
          if (hourlyDates.includes(dailyOut[i].t)) dailyOut[i].matched = true;
        }
      } else if (weeklyPrompts.length > 0) {
        for (let i = 0; i < dailyOut.length; i++) {
          if (weeklyDates.includes(dailyOut[i].t)) dailyOut[i].matched = true;
        }
      }
      return dailyOut;
    }

    for (let i = 0; i < dailyFormatData.length; i++) {
      const row = dailyFormatData[i];

      const allMatch = dailyPrompts.every((p) => {
        const offset1 = dayMapping[p.day1] ?? 0;
        const isCustom = p.day2 === "自定義數值";
        const offset2 = isCustom ? 0 : dayMapping[p.day2];
        const indicator1 = indicatorMap[p.indicator1];
        const indicator2Key = isCustom ? undefined : indicatorMap[p.indicator2];

        const left = getVal(dailyFormatData[i - offset1], indicator1) as
          | number
          | undefined;
        const right = isCustom
          ? Number(p.indicator2)
          : (getVal(dailyFormatData[i - offset2], indicator2Key) as
              | number
              | undefined);

        if (left === undefined || right === undefined) return false;
        return compare(left, right, p.operator);
      });

      if (allMatch) {
        let isMatch = true;
        if (hourlyPrompts.length > 0) {
          if (!hourlyDates.includes(row.t)) isMatch = false;
        }
        if (weeklyPrompts.length > 0) {
          // Note: This logic assumes day.t matches weekly date logic (e.g. matching only on Friday)
          // If a relaxed "in the same week" matching is needed, we need a date-to-week conversion
          if (!weeklyDates.includes(row.t)) isMatch = false;
        }
        if (isMatch) {
          dailyOut[i].matched = true;
        }
      }
    }

    return dailyOut;
  }, [
    dailyPrompts,
    hourlyPrompts,
    dailyFormatData,
    hourlyFormatData,
    weeklyPrompts,
  ]);

  if (!list || list.length === 0) {
    return (
      <Box border="1px solid #e0e0e0" borderRadius={1} p={2} mt={2}>
        <Typography variant="body2" color="textSecondary">
          無可用資料以繪製圖表
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box display="flex" alignItems="center" gap={2} mb={1}>
        {isEditing ? (
          <>
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
              size="small"
              sx={{ width: 300 }}
              renderInput={(params) => (
                <TextField {...params} label="選擇範例股票" />
              )}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleConfirm}
              disabled={!selectedOption || loading}
              size="small"
              sx={{ height: 40, whiteSpace: "nowrap" }}
            >
              {loading && <CircularProgress size={18} sx={{ mr: 1 }} />}
              更新
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => setIsEditing(false)}
              size="small"
              sx={{ height: 40, whiteSpace: "nowrap" }}
            >
              取消
            </Button>
          </>
        ) : (
          <>
            <Typography variant="body2" color="textSecondary">
              圖表資料來源：{exampleChartId} {selectedOption?.stock_name}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setIsEditing(true)}
              sx={{ height: 32 }}
            >
              切換
            </Button>
          </>
        )}
      </Box>
      <Box height={300} width="100%" mt={2}>
        <ResponsiveContainer>
          <ComposedChart data={list.slice(-160)}>
            <XAxis dataKey="t" />
            <YAxis domain={["dataMin", "dataMax"]} dataKey="l" />
            <ZAxis type="number" range={[10]} />
            <Tooltip
              offset={50}
              contentStyle={{ backgroundColor: "#fff", borderRadius: 4 }}
              labelStyle={{ color: "#000" }}
              itemStyle={{ color: "#000" }}
            />
            <Line
              dataKey="h"
              stroke="#000"
              opacity={0} // 設置透明度為 0，隱藏線條
              dot={false}
              activeDot={false}
              legendType="none"
            />
            <Line
              dataKey="c"
              stroke="#000"
              opacity={0} // 設置透明度為 0，隱藏線條
              dot={false}
              activeDot={false}
              legendType="none"
            />
            <Line
              dataKey="l"
              stroke="#000"
              opacity={0} // 設置透明度為 0，隱藏線條
              dot={false}
              activeDot={false}
              legendType="none"
            />
            <Line
              dataKey="o"
              stroke="#000"
              opacity={0} // 設置透明度為 0，隱藏線條
              dot={false}
              activeDot={false}
              legendType="none"
            />
            <Customized component={BaseCandlestickRectangle} />
            <Line
              dataKey="ma5"
              stroke="#589bf3"
              dot={false}
              activeDot={false}
              legendType="none"
            />
            <Line
              dataKey="ma10"
              stroke="#b277f2"
              dot={false}
              activeDot={false}
              legendType="none"
            />
            <Line
              dataKey="ma20"
              stroke="#ff7300"
              dot={false}
              activeDot={false}
              legendType="none"
            />
            <Line
              dataKey="ma60"
              stroke="#63c762"
              dot={false}
              activeDot={false}
              legendType="none"
            />
            {/* red vertical lines for matched rows */}
            {list
              .filter((r) => r.matched)
              .map((r) => (
                <ReferenceLine
                  key={r.t}
                  x={r.t}
                  stroke="#ff3b30"
                  strokeWidth={2}
                />
              ))}
          </ComposedChart>
        </ResponsiveContainer>
      </Box>

      <Box mt={1}>
        <Typography variant="body2" color="textSecondary">
          篩選方式：日線需同時滿足所有條件；若設定小時條件，日線還需對應到滿足所有小時條件的日期。週線條件需滿足該週日期。
        </Typography>
      </Box>
    </>
  );
}
