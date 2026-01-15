import { create } from "zustand";
import { FutureIds, PromptType, SelectType, StockTableType } from "../types";

export enum ChartType {
  HOURLY_OBV = "小時OBV",
  HOURLY_KD = "小時KD",
  HOURLY_RSI = "小時RSI",
  HOURLY_OSC = "小時OSC",
  HOURLY_BOLL = "小時BOLL",
  HOURLY_DMI = "小時DMI",
  HOURLY_CMF = "小時CMF",
  DAILY_OBV = "日OBV",
  DAILY_KD = "日KD",
  DAILY_RSI = "日RSI",
  DAILY_OSC = "日OSC",
  DAILY_BOLL = "日BOLL",
  DAILY_DMI = "日DMI",
  DAILY_CMF = "日CMF",
  WEEKLY_KD = "週KD",
  WEEKLY_OBV = "週OBV",
  WEEKLY_RSI = "週RSI",
  WEEKLY_BOLL = "週BOLL",
  WEEKLY_OSC = "週OSC",
  WEEKLY_DMI = "週DMI",
  WEEKLY_CMF = "週CMF",
}

interface SchoiceState {
  data_count: number;
  update_progress: number;
  using: PromptType;
  todayDate: number;
  select: SelectType | null;
  theme: string;
  chartType: ChartType;
  filterStocks: StockTableType[] | null;
  backtestPersent: number;
  exampleChartId: string;
  setFilterStocks: (stocks: StockTableType[] | null) => void;
  setBacktestPersent: (persent: number) => void;
  changeChartType: (type: ChartType) => void;
  changeTheme: (theme: string) => void;
  changeDataCount: (count: number) => void;
  changeUpdateProgress: (p: number) => void;
  changeUsing: (type: PromptType) => void;
  clearSeleted: () => void;
  setSelect: ({
    prompt_id,
    type,
  }: {
    prompt_id: string;
    type: PromptType;
  }) => void;
  changeTodayDate: (date: number) => void;
  setExampleChartId: (id: string) => void;
}

const useSchoiceStore = create<SchoiceState>((set) => ({
  data_count: 0,
  update_progress: 0,
  using: PromptType.BULL,
  todayDate: 0,
  theme: localStorage.getItem("slitenting-theme") || "",
  select: null,
  chartType:
    (localStorage.getItem("slitenting-chartType") as ChartType) ||
    ChartType.WEEKLY_BOLL,
  filterStocks: null,
  backtestPersent: 0,
  exampleChartId:
    (localStorage.getItem("slitenting-example-chart-id") as string) ||
    FutureIds.WTX,
  setFilterStocks: (stocks: StockTableType[] | null) => {
    set({ filterStocks: stocks });
  },
  setBacktestPersent: (persent: number) => {
    set({ backtestPersent: persent });
  },
  changeChartType: (type: ChartType) => {
    localStorage.setItem("slitenting-chartType", type);
    set({ chartType: type });
  },
  changeTheme: (theme: string) => {
    localStorage.setItem("slitenting-theme", theme);
    set({ theme });
  },
  changeDataCount: (count: number) => {
    set({ data_count: count });
  },
  changeUpdateProgress: (p: number) => {
    set({ update_progress: p });
  },
  changeUsing: (type: PromptType) => {
    set({ using: type });
  },
  clearSeleted: () => {
    set({ select: null });
  },
  setSelect: ({ prompt_id, type }: SelectType) => {
    switch (type) {
      case PromptType.BULL:
        set({
          select: {
            prompt_id,
            type,
          },
        });
        break;
      case PromptType.BEAR:
        set({
          select: {
            prompt_id,
            type,
          },
        });
        break;
      default:
        break;
    }
  },
  changeTodayDate: (date: number) => {
    set({ todayDate: date });
  },
  setExampleChartId: (id: string) => {
    localStorage.setItem("slitenting-example-chart-id", id);
    set({ exampleChartId: id });
  },
}));

export default useSchoiceStore;
