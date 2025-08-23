import { load as StoreLoad } from "@tauri-apps/plugin-store";
import { useCallback, useEffect, useState } from "react";
import useSchoiceStore from "../store/Schoice.store";
import { tauriFetcher } from "../tools/http";
import { TaType, UrlTaPerdOptions, UrlType } from "../types";
import analyzeIndicatorsData, {
  IndicatorsDateTimeType,
} from "../utils/analyzeIndicatorsData";
import generateDealDataDownloadUrl from "../utils/generateDealDataDownloadUrl";

export default function useExampleData() {
  const [hour, setHour] = useState<TaType>([]);
  const [day, setDay] = useState<TaType>([]);
  const [week, setWeek] = useState<TaType>([]);
  const { exampleChartId } = useSchoiceStore();

  const getHourData = useCallback(
    async ({ type, id, store }: { type: UrlType; id: string; store: any }) => {
      const response = await tauriFetcher(
        generateDealDataDownloadUrl({
          type,
          id,
          perd: UrlTaPerdOptions.Hour,
        })
      );
      if (!response || typeof response !== "string") return;
      const ta = analyzeIndicatorsData(
        response,
        IndicatorsDateTimeType.DateTime
      );
      setHour(ta);
      await store.set(UrlTaPerdOptions.Hour, JSON.stringify(ta));
      await store.save();
    },
    []
  );

  const getDayData = useCallback(
    async ({ type, id, store }: { type: UrlType; id: string; store: any }) => {
      const response = await tauriFetcher(
        generateDealDataDownloadUrl({
          type,
          id,
          perd: UrlTaPerdOptions.Day,
        })
      );
      if (!response || typeof response !== "string") return;
      const ta = analyzeIndicatorsData(response, IndicatorsDateTimeType.Date);
      setDay(ta);
      await store.set(UrlTaPerdOptions.Day, JSON.stringify(ta));
      await store.save();
    },
    []
  );

  const getWeekData = useCallback(
    async ({ type, id, store }: { type: UrlType; id: string; store: any }) => {
      const response = await tauriFetcher(
        generateDealDataDownloadUrl({
          type,
          id,
          perd: UrlTaPerdOptions.Week,
        })
      );
      if (!response || typeof response !== "string") return;
      const ta = analyzeIndicatorsData(response, IndicatorsDateTimeType.Date);
      setWeek(ta);
      await store.set(UrlTaPerdOptions.Week, JSON.stringify(ta));
      await store.save();
    },
    []
  );

  const getNewData = useCallback(
    async ({ type, id }: { type: UrlType; id: string }) => {
      const store = await StoreLoad("example.json", { autoSave: false });
      setHour([]);
      setDay([]);
      setWeek([]);
      // 等待三個 fetch 完成後再返回，讓呼叫方可以等待完成狀態
      await Promise.all([
        getHourData({ type, id, store }),
        getDayData({ type, id, store }),
        getWeekData({ type, id, store }),
      ]);
    },
    [getDayData, getHourData, getWeekData]
  );

  useEffect(() => {
    const type = UrlType.Indicators;
    const id = exampleChartId;
    StoreLoad("example.json", { autoSave: false }).then(async (store) => {
      const hour_list = await store.get<string>(UrlTaPerdOptions.Hour);
      const day_list = await store.get<string>(UrlTaPerdOptions.Day);
      const week_list = await store.get<string>(UrlTaPerdOptions.Week);
      // hour
      if (hour_list) {
        setHour(JSON.parse(hour_list) as TaType);
      } else {
        getHourData({ type, id, store });
      }
      // day
      if (day_list) {
        setDay(JSON.parse(day_list) as TaType);
      } else {
        getDayData({ type, id, store });
      }

      // week
      if (week_list) {
        setWeek(JSON.parse(week_list) as TaType);
      } else {
        getWeekData({ type, id, store });
      }
    });
  }, []);

  return { day, week, hour, getNewData };
}
