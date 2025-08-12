import { nanoid } from "nanoid";
import { create } from "zustand";
import { handleError } from "../tools/error";
import { supabase } from "../tools/supabase";
import {
  FilterStock,
  PromptItem,
  Prompts,
  PromptsMap,
  PromptType,
  PromptValue,
  TrashPrompt,
} from "../types";

export enum ChartType {
  HOURLY_OBV = "小時OBV",
  HOURLY_KD = "小時KD",
  HOURLY_RSI = "小時RSI",
  HOURLY_OSC = "小時OSC",
  HOURLY_BOLL = "小時BOLL",
  DAILY_OBV = "日OBV",
  DAILY_KD = "日KD",
  DAILY_RSI = "日RSI",
  DAILY_OSC = "日OSC",
  DAILY_BOLL = "日BOLL",
  WEEKLY_KD = "週KD",
  WEEKLY_OBV = "週OBV",
  WEEKLY_RSI = "週RSI",
  WEEKLY_BOLL = "週BOLL",
  WEEKLY_OSC = "週OSC",
}

interface SchoiceState {
  dataCount: number;
  using: PromptType;
  todayDate: number;
  bulls: PromptsMap;
  bears: PromptsMap;
  alarms: PromptsMap;
  select: {
    id: string;
    name: string;
    conditions: PromptValue;
    type: PromptType;
    index: number;
  } | null;
  theme: string;
  chartType: ChartType;
  trash: TrashPrompt[];
  filterStocks?: FilterStock[];
  filterConditions?: Prompts;
  backtestPersent: number;
  addAlarm: (
    alarm: PromptItem,
    id: string,
    index: number,
    userId: string
  ) => void;
  removeAlarm: (id: string, index: number, userId: string) => void;
  setBacktestPersent: (persent: number) => void;
  addFilterStocks: (
    stocks: FilterStock[] | undefined,
    prompts: Prompts | undefined
  ) => void;
  removeFilterStocks: () => void;
  recover: (id: string, userId: string) => Promise<void>;
  changeChartType: (type: ChartType) => void;
  changeTheme: (theme: string) => void;
  changeDataCount: (count: number) => void;
  changeUsing: (type: PromptType) => void;
  increase: (
    name: string,
    prompts: PromptValue,
    type: PromptType,
    userId: string
  ) => Promise<string | undefined>;
  edit: (
    id: string,
    name: string,
    prompts: PromptValue,
    type: PromptType,
    userId: string
  ) => void;
  remove: (name: string, type: PromptType, userId: string) => void;
  removeFromTrash: (index: number, id: string, userId: string) => void;
  reload: () => void;
  clear: () => void;
  clearSeleted: () => void;
  selectObj: (id: string, type: PromptType) => void;
  changeTodayDate: (date: number) => void;
}

const useSchoiceStore = create<SchoiceState>((set, get) => ({
  dataCount: 0,
  using: PromptType.BULL,
  todayDate: 0,
  theme: localStorage.getItem("slitenting-theme") || "",
  bulls: {},
  bears: {},
  alarms: {},
  select: null,
  chartType:
    (localStorage.getItem("slitenting-chartType") as ChartType) ||
    ChartType.WEEKLY_BOLL,
  trash: [],
  filterConditions: undefined,
  filterStocks: undefined,
  backtestPersent: 0,
  addAlarm: async (
    alarm: PromptItem,
    id: string,
    index: number,
    userId: string
  ) => {
    try {
      const { error } = await supabase
        .from("user_prompts")
        .update({ alarm: true })
        .eq("prompt_id", id)
        .eq("index", index)
        .eq("user_id", userId);
      if (error) {
        handleError(error, "addAlarm");
        return;
      }
      const alarms = get().alarms;
      const data = {
        ...alarms,
        [id]: alarm,
      };
      set(() => ({
        alarms: data,
      }));
    } catch (err) {
      handleError(err, "addAlarm");
    }
  },
  removeAlarm: async (id: string, index: number, userId: string) => {
    try {
      const { error } = await supabase
        .from("user_prompts")
        .update({ alarm: true })
        .eq("prompt_id", id)
        .eq("index", index)
        .eq("user_id", userId);
      if (error) {
        handleError(error, "removeAlarm");
        return;
      }
      const alarms = get().alarms as PromptsMap;
      const { [id]: _, ...dataAlarm } = alarms;
      set(() => ({
        alarms: dataAlarm,
      }));
    } catch (err) {
      handleError(err, "removeAlarm");
    }
  },
  setBacktestPersent: (persent: number) => {
    set({ backtestPersent: persent });
  },
  addFilterStocks: (stocks, prompts) => {
    set({
      filterStocks: stocks,
      filterConditions: prompts,
    });
  },
  removeFilterStocks: () => {
    set({
      filterStocks: undefined,
      filterConditions: undefined,
    });
  },
  recover: async (id: string, userId: string) => {
    const trash = get().trash;
    const index = trash.findIndex((item) => item.id === id);
    if (index !== -1) {
      const { id, type, value } = trash[index];
      await supabase
        .from("user_prompts")
        .update({ trash: false })
        .eq("prompt_id", id)
        .eq("user_id", userId);
      switch (type) {
        case PromptType.BULL:
          set((state) => ({
            bulls: {
              ...state.bulls,
              [id]: value,
            },
          }));
          break;
        case PromptType.BEAR:
          set((state) => ({
            bears: {
              ...state.bears,
              [id]: value,
            },
          }));
          break;
        default:
          break;
      }
      trash.splice(index, 1);
      set({ trash });
    }
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
    set({ dataCount: count });
  },
  changeUsing: (type: PromptType) => {
    set({ using: type });
  },
  increase: async (
    name: string,
    prompts: PromptValue,
    type: PromptType,
    userId: string
  ) => {
    try {
      const id = nanoid();
      const { data, error } = await supabase.from("user_prompts").insert({
        user_id: userId,
        prompt_type: type,
        prompt_name: name,
        conditions: JSON.stringify(prompts),
        prompt_id: id,
        trash: false,
        alarm: false,
      });
      if (error) {
        handleError(error, "increase");
        return undefined;
      }
      const index = 123;
      switch (type) {
        case PromptType.BULL:
          set((state) => ({
            bulls: {
              ...state.bulls,
              [id]: {
                name,
                conditions: prompts,
                index,
              },
            },
          }));
          return id;
        case PromptType.BEAR:
          set((state) => ({
            bears: {
              ...state.bears,
              [id]: {
                name,
                conditions: prompts,
                index,
              },
            },
          }));
          return id;
        default:
          return undefined;
      }
    } catch (err) {
      handleError(err, "increase");
      return undefined;
    }
  },
  edit: async (
    id: string,
    name: string,
    prompts: PromptValue,
    type: PromptType,
    userId: string
  ) => {
    try {
      const { error } = await supabase
        .from("user_prompts")
        .update({
          prompt_name: name,
          conditions: JSON.stringify(prompts),
        })
        .eq("prompt_id", id)
        .eq("user_id", userId);
      if (error) {
        handleError(error, "edit");
        return;
      }
      switch (type) {
        case PromptType.BULL:
          set((state) => {
            return {
              bulls: {
                ...state.bulls,
                [id]: {
                  name,
                  conditions: prompts,
                  index: state.bears[id]?.index ?? null,
                },
              },
            };
          });
          break;
        case PromptType.BEAR:
          set((state) => {
            return {
              bears: {
                ...state.bears,
                [id]: {
                  name,
                  conditions: prompts,
                  index: state.bears[id]?.index ?? null,
                },
              },
            };
          });
          break;
        default:
          break;
      }
    } catch (err) {
      handleError(err, "edit");
    }
  },
  remove: async (id: string, type: PromptType, userId: string) => {
    try {
      const { error } = await supabase
        .from("user_prompts")
        .update({ trash: true })
        .eq("prompt_id", id)
        .eq("user_id", userId);
      if (error) {
        handleError(error, "remove");
        return;
      }
      switch (type) {
        case PromptType.BULL:
          const { [id]: bull_value, ...dataBulls } = get().bulls;
          const removeBull = {
            time: Date.now(),
            id,
            type,
            value: bull_value,
          };
          set((state) => {
            return {
              bulls: dataBulls,
              trash: [...state.trash, removeBull],
            };
          });
          break;
        case PromptType.BEAR:
          const { [id]: bear_value, ...dataBears } = get().bears;
          const removeBear = {
            time: Date.now(),
            id,
            type,
            value: bear_value,
          };
          set((state) => {
            return {
              bears: dataBears,
              trash: [...state.trash, removeBear],
            };
          });
          break;
        default:
          break;
      }
    } catch (err) {
      handleError(err, "remove");
    }
  },
  removeFromTrash: async (index: number, id: string, userId: string) => {
    try {
      const { error } = await supabase
        .from("user_prompts")
        .delete()
        .eq("index", index)
        .eq("prompt_id", id)
        .eq("user_id", userId);
      if (error) {
        handleError(error, "removeFromTrash");
        return;
      }
      set((state) => {
        delete state.alarms[id];
        return {
          trash: state.trash.filter((item) => item.id !== id),
          alarms: state.alarms,
        };
      });
    } catch (err) {
      handleError(err, "removeFromTrash");
    }
  },
  reload: async () => {
    try {
      const { data, error } = await supabase.from("user_prompts").select();
      if (error) {
        handleError(error, "reload");
        return;
      }
      const trash: TrashPrompt[] = [];
      const bulls: PromptsMap = {};
      const bears: PromptsMap = {};
      const alarms: PromptsMap = {};

      for (const item of data) {
        try {
          if (item.trash) {
            trash.push({
              id: item.id,
              type: item.prompt_type as PromptType,
              value: {
                name: item.prompt_name,
                conditions: JSON.parse(item.conditions),
                index: item.index || null,
              },
              time: item.updated_at,
            });
          } else {
            if (item.alarm) {
              alarms[item.id] = {
                name: item.prompt_name,
                conditions: JSON.parse(item.conditions),
                index: item.index || null,
              };
            }
            switch (item.prompt_type) {
              case PromptType.BULL:
                bulls[item.id] = {
                  name: item.prompt_name,
                  conditions: JSON.parse(item.conditions),
                  index: item.index || null,
                };
                break;
              case PromptType.BEAR:
                bears[item.id] = {
                  name: item.prompt_name,
                  conditions: JSON.parse(item.conditions),
                  index: item.index || null,
                };
                break;
              default:
                console.warn(`未知的 prompt_type: ${item.prompt_type}`);
                break;
            }
          }
        } catch (itemErr) {
          handleError(itemErr, "reload:item");
        }
      }
      set(() => ({
        bulls,
        bears,
        alarms,
        trash,
      }));
    } catch (error) {
      handleError(error, "reload");
    }
  },
  clear: async () => {
    set({
      bulls: {},
      bears: {},
      alarms: {},
      trash: [],
      filterStocks: undefined,
      filterConditions: undefined,
    });
  },
  clearSeleted: () => {
    set({ select: null });
  },
  selectObj: (id: string, type: PromptType) => {
    switch (type) {
      case PromptType.BULL:
        const selectBulls = get().bulls[id];
        set({
          select: {
            id,
            type,
            name: selectBulls.name,
            conditions: selectBulls.conditions,
            index: selectBulls.index,
          },
        });
        break;
      case PromptType.BEAR:
        const selectBears = get().bears[id];
        set({
          select: {
            id,
            type,
            name: selectBears.name,
            conditions: selectBears.conditions,
            index: selectBears.index,
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
}));

export default useSchoiceStore;
