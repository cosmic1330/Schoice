import { nanoid } from "nanoid";
import { create } from "zustand";
import { handleError } from "../tools/error";
import { supabase } from "../tools/supabase";
import {
  FundamentalPrompts,
  PromptItem,
  PromptsMap,
  PromptType,
  PromptValue,
  TrashPrompt,
  WatchStockItem,
} from "../types";

interface CloudState {
  bulls: PromptsMap;
  bears: PromptsMap;
  alarms: PromptsMap;
  trash: TrashPrompt[];
  fundamentalCondition: FundamentalPrompts | null;
  watchStocks: WatchStockItem[];
  setFundamentalCondition: (
    condition: FundamentalPrompts | null,
    userId: string
  ) => void;
  removeFromWatchList: (stockId: string, userId: string) => Promise<void>;
  addToWatchList: (
    stockId: string,
    userId: string,
    strategyName?: string,
    strategyScript?: string
  ) => Promise<void>;
  addAlarm: (alarm: PromptItem, id: string, userId: string) => Promise<void>;
  removeAlarm: (id: string, userId: string) => Promise<void>;
  recover: (id: string, userId: string) => Promise<void>;
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
  ) => Promise<void>;
  remove: (id: string, type: PromptType, userId: string) => Promise<void>;
  removeFromTrash: (index: number, id: string, userId: string) => Promise<void>;
  reload: (userId: string) => Promise<void>;
}

const useCloudStore = create<CloudState>((set, get) => ({
  bulls: {},
  bears: {},
  alarms: {},
  trash: [],
  fundamentalCondition: null,
  watchStocks: [],
  setFundamentalCondition: async (
    condition: FundamentalPrompts | null,
    userId: string
  ) => {
    if (condition === null) {
      set(() => ({ fundamentalCondition: null }));
      await supabase
        .from("fundamental_condition")
        .delete()
        .eq("user_id", userId);
      return;
    } else {
      await supabase
        .from("fundamental_condition")
        .upsert({ user_id: userId, conditions: condition })
        .select("*")
        .single();
      set(() => ({
        fundamentalCondition: condition,
      }));
    }
  },
  removeFromWatchList: async (stockId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from("watch_stock")
        .delete()
        .eq("stock_id", stockId)
        .eq("user_id", userId);
      if (error) {
        handleError(error, "removeFromWatchList");
        return;
      }
      set((state) => ({
        watchStocks: state.watchStocks?.filter(
          (item) => item.stock_id !== stockId
        ),
      }));
    } catch (err) {
      handleError(err, "removeFromWatchList");
    }
  },
  addToWatchList: async (
    stockId: string,
    userId: string,
    strategyName?: string,
    strategyScript?: string
  ) => {
    try {
      const now = new Date().toISOString().split("T")[0];
      const { error } = await supabase.from("watch_stock").insert({
        stock_id: stockId,
        user_id: userId,
        strategy_name: strategyName || null,
        strategy_script: strategyScript || null,
        date: now,
      });
      if (error) {
        handleError(error, "addToWatchList");
        return;
      }
      set((state) => ({
        watchStocks: [
          ...state.watchStocks,
          {
            stock_id: stockId,
            added_date: now,
            strategy_name: strategyName,
          },
        ],
      }));
    } catch (err) {
      handleError(err, "addToWatchList");
    }
  },
  addAlarm: async (alarm: PromptItem, id: string, userId: string) => {
    try {
      const { error } = await supabase
        .from("user_prompts")
        .update({ alarm: true })
        .eq("prompt_id", id)
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
  removeAlarm: async (id: string, userId: string) => {
    try {
      const { error } = await supabase
        .from("user_prompts")
        .update({ alarm: false })
        .eq("prompt_id", id)
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
  recover: async (id: string, userId: string) => {
    try {
      const trash = get().trash;
      const index = trash.findIndex((item) => item.id === id);
      if (index === -1) return;

      const { id: itemId, type, value } = trash[index];
      const { error } = await supabase
        .from("user_prompts")
        .update({ trash: false })
        .eq("prompt_id", itemId)
        .eq("user_id", userId);

      if (error) {
        handleError(error, "recover");
        return;
      }

      set((state) => {
        const newTrash = [...state.trash];
        newTrash.splice(index, 1);

        switch (type) {
          case PromptType.BULL:
            return {
              bulls: {
                ...state.bulls,
                [itemId]: value,
              },
              trash: newTrash,
            };
          case PromptType.BEAR:
            return {
              bears: {
                ...state.bears,
                [itemId]: value,
              },
              trash: newTrash,
            };
          default:
            return { trash: newTrash };
        }
      });
    } catch (err) {
      handleError(err, "recover");
    }
  },
  increase: async (
    name: string,
    prompts: PromptValue,
    type: PromptType,
    userId: string
  ) => {
    try {
      const id = nanoid();
      const { data, error } = await supabase
        .from("user_prompts")
        .insert({
          user_id: userId,
          prompt_type: type,
          prompt_name: name,
          conditions: JSON.stringify(prompts),
          prompt_id: id,
          trash: false,
          alarm: false,
        })
        .select("index");
      if (error) {
        handleError(error, "increase");
        return undefined;
      }

      const index = data[0].index;
      const newPrompt: PromptItem = {
        name,
        conditions: prompts,
        index,
      };

      set((state) => {
        switch (type) {
          case PromptType.BULL:
            return {
              bulls: {
                ...state.bulls,
                [id]: newPrompt,
              },
            };
          case PromptType.BEAR:
            return {
              bears: {
                ...state.bears,
                [id]: newPrompt,
              },
            };
          default:
            return state;
        }
      });

      return id;
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

      set((state) => {
        const currentPrompt =
          type === PromptType.BULL ? state.bulls[id] : state.bears[id];
        const updatedPrompt: PromptItem = {
          name,
          conditions: prompts,
          index: currentPrompt?.index ?? 0,
        };

        switch (type) {
          case PromptType.BULL:
            return {
              bulls: {
                ...state.bulls,
                [id]: updatedPrompt,
              },
            };
          case PromptType.BEAR:
            return {
              bears: {
                ...state.bears,
                [id]: updatedPrompt,
              },
            };
          default:
            return state;
        }
      });
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

      set((state) => {
        const trashItem: TrashPrompt = {
          time: Date.now(),
          id,
          type,
          value: type === PromptType.BULL ? state.bulls[id] : state.bears[id],
        };

        switch (type) {
          case PromptType.BULL: {
            const { [id]: _, ...remainingBulls } = state.bulls;
            return {
              bulls: remainingBulls,
              trash: [...state.trash, trashItem],
            };
          }
          case PromptType.BEAR: {
            const { [id]: _, ...remainingBears } = state.bears;
            return {
              bears: remainingBears,
              trash: [...state.trash, trashItem],
            };
          }
          default:
            return state;
        }
      });
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
        const { [id]: _, ...remainingAlarms } = state.alarms;
        return {
          trash: state.trash.filter((item) => item.id !== id),
          alarms: remainingAlarms,
        };
      });
    } catch (err) {
      handleError(err, "removeFromTrash");
    }
  },
  reload: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_prompts")
        .select("*")
        .eq("user_id", userId);
      if (error) {
        handleError(error, "reload");
        return;
      }
      const trash: TrashPrompt[] = [];
      const bulls: PromptsMap = {};
      const bears: PromptsMap = {};
      const alarms: PromptsMap = {};
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (item.trash) {
          trash.push({
            id: item.prompt_id,
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
            alarms[item.prompt_id] = {
              name: item.prompt_name,
              conditions: JSON.parse(item.conditions),
              index: item.index || null,
            };
          }
          switch (item.prompt_type) {
            case PromptType.BULL:
              bulls[item.prompt_id] = {
                name: item.prompt_name,
                conditions: JSON.parse(item.conditions),
                index: item.index || null,
              };
              break;
            case PromptType.BEAR:
              bears[item.prompt_id] = {
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
      }
      const { data: watchStocksData } = await supabase
        .from("watch_stock")
        .select("stock_id, date, strategy_name")
        .eq("user_id", userId);
      const watchStocks: WatchStockItem[] =
        watchStocksData?.map((item) => ({
          stock_id: item.stock_id,
          added_date: item.date,
          strategy_name: item.strategy_name,
        })) || [];

      const { data: fundamentalConditionData } = await supabase
        .from("fundamental_condition")
        .select("*")
        .eq("user_id", userId);
      const fundamentalCondition =
        fundamentalConditionData &&
        fundamentalConditionData?.length > 0 &&
        fundamentalConditionData[0].conditions;
      set(() => ({
        bulls,
        bears,
        alarms,
        trash,
        watchStocks: watchStocks,
        fundamentalCondition: fundamentalCondition
          ? JSON.parse(fundamentalCondition)
          : null,
      }));
    } catch (error) {
      handleError(error, "reload");
    }
  },
}));

export default useCloudStore;
