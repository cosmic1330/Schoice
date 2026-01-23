import { error, info } from "@tauri-apps/plugin-log";
import { getStore } from "../store/Setting.store";
import { StockTableType } from "../types";
import { fetchStocksFromExchanges } from "./stockScraper";

/**
 * Syncs the stock menu by scraping exchanges, merging Supabase data,
 * and updating local SQL and Store data.
 */
export async function syncStockMenu(): Promise<StockTableType[]> {
  try {
    const allScrapedStocks = await fetchStocksFromExchanges();
    info(`Total stocks fetched from exchange: ${allScrapedStocks.length}`);

    // 1. Update Tauri Store
    const store = await getStore();
    await store.set("menu", allScrapedStocks);
    await store.set("lastMenuUpdate", Date.now());
    await store.save();

    return allScrapedStocks;
  } catch (e) {
    error(`Critical error in syncStockMenu: ${e}`);
    throw e;
  }
}
