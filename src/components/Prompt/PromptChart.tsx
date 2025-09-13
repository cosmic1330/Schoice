import { Box, Typography } from "@mui/material";
import { useMemo } from "react";
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
import useFormatSkillData, {
  FormatDataRow,
} from "../../hooks/useFormatSkillData";
import useSchoiceStore from "../../store/Schoice.store";
import type { Prompts } from "../../types";
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
const indicatorMap: Record<string, keyof FormatDataRow> = {
  收盤價: "c",
  開盤價: "o",
  成交量: "v",
  最低價: "l",
  最高價: "h",
  ma5: "ma5",
  ma5扣抵: "ma5_ded",
  ma10: "ma10",
  ma10扣抵: "ma10_ded",
  ma20: "ma20",
  ma20扣抵: "ma20_ded",
  ma60: "ma60",
  ma60扣抵: "ma60_ded",
  ma120: "ma120",
  ma120扣抵: "ma120_ded",
  ema5: "ema5",
  ema10: "ema10",
  ema20: "ema20",
  ema60: "ema60",
  ema120: "ema120",
  macd: "macd",
  dif: "dif",
  osc: "osc",
  k: "k",
  d: "d",
  j: "j",
  rsi5: "rsi5",
  rsi10: "rsi10",
  布林上軌: "bollUb",
  布林中軌: "bollMa",
  布林下軌: "bollLb",
  obv: "obv",
  obv_ma5: "obv_ma5",
  obv_ma10: "obv_ma10",
  obv_ma20: "obv_ma20",
  obv_ma60: "obv_ma60",
  obv_ema5: "obv_ema5",
  obv_ema10: "obv_ema10",
  obv_ema20: "obv_ema20",
  obv_ema60: "obv_ema60",
  mfi: "mfi",
};

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
// const weekMapping: Record<string, number> = {
//   本週: 0,
//   上週: 1,
//   上上週: 2,
//   "3週前": 3,
//   "4週前": 4,
//   "5週前": 5,
// };

export default function PromptChart({
  hourlyPrompts,
  dailyPrompts,
  weeklyPrompts,
  hourlyData = [],
  dailyData = [],
  weeklyData = [],
}: PromptChartProps) {
  const hourlyFormatData = useFormatSkillData(hourlyData);
  const dailyFormatData = useFormatSkillData(dailyData);
  const weeklyFormatData = useFormatSkillData(weeklyData);
  const { exampleChartId } = useSchoiceStore();

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

    // 計算 dailyOut：每筆要通過所有 dailyPrompts 才 matched；若有 hourlyPrompts 則還需在 hourlyDates
    const dailyOut = dailyFormatData.map((d) => ({ ...d, matched: false }));

    if (dailyPrompts.length === 0) {
      if (hourlyPrompts.length > 0) {
        for (let i = 0; i < dailyOut.length; i++) {
          if (hourlyDates.includes(dailyOut[i].t)) dailyOut[i].matched = true;
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
        if (hourlyPrompts.length > 0) {
          if (hourlyDates.includes(row.t)) dailyOut[i].matched = true;
        } else {
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
      <Box>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          圖表資料來源：{exampleChartId}
        </Typography>
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
          篩選方式：日線需同時滿足所有條件；若設定小時條件，日線還需對應到滿足所有小時條件的日期。週線條件目前尚不支援。
        </Typography>
      </Box>
    </>
  );
}
