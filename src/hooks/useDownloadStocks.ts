import { error, info } from "@tauri-apps/plugin-log";
import { sendNotification } from "@tauri-apps/plugin-notification";
import { load } from "cheerio";
import { useCallback, useState } from "react";
import { tauriFetcher, TauriFetcherType } from "../tools/http";
import { StockTableType } from "../types";
import { load as StoreLoad } from "@tauri-apps/plugin-store";


enum QueryStockType {
  TWSE = 2,
  OTC = 4,
}

export default function useDownloadStocks() {
  const [disable, setDisable] = useState(false);

  const queryStocks = useCallback(async (type: QueryStockType) => {
    const data: StockTableType[] = [];
    try {
      const url = `https://isin.twse.com.tw/isin/C_public.jsp?strMode=${type}`;
      const arrayBuffer = (await tauriFetcher(
        url,
        TauriFetcherType.ArrayBuffer
      )) as ArrayBuffer;

      // 使用 TextDecoder轉換編碼big5->utf-8
      const decoder = new TextDecoder("big5");
      const decodedText = decoder.decode(arrayBuffer);
      const $ = load(decodedText);

      const rows = $("tbody tr").toArray();
      const thirdRowToEnd = rows.slice(2);

      for (let i = 0; i < thirdRowToEnd.length; i++) {
        const row = thirdRowToEnd[i];
        const firstTd = $(row).find("td").eq(0).text(); // 第一個<td>
        const [stock_id, stock_name] = firstTd.split("　");

        // id必須是四位數字且第一位不是0且第一位不是0
        if (
          (stock_id.length !== 4 && !/^\d+$/.test(stock_id)) ||
          stock_id[0] === "0"
        ) {
          continue;
        }
        const market_type = $(row).find("td").eq(3).text(); // 第四個<td>
        const industry_group = $(row).find("td").eq(4).text(); // 第五個<td>
        if (stock_id.length === 4) {
          info(`Valid ID: ${stock_id} ${stock_name}`);
          data.push({ stock_id, stock_name, market_type, industry_group });
        }
      }
    } catch (e) {
      error(`Error fetching data: ${e}`);
    }
    return data;
  }, []);

  const handleDownloadMenu = useCallback(async () => {
    try {
      setDisable(true);
      const TWSE_data = await queryStocks(QueryStockType.TWSE);
      const OTC_data = await queryStocks(QueryStockType.OTC);
      TWSE_data.push(...OTC_data);
      info(`Total stocks fetched: ${TWSE_data.length}`);
      const store = await StoreLoad("store.json", { autoSave: false });
      await store.set("menu", TWSE_data);
      setDisable(false);
      sendNotification({ title: "Menu", body: "Update Success!" });
    } catch (e) {
      error(`Error updating menu: ${e}`);
    }
  }, []);

  return { handleDownloadMenu, disable };
}
