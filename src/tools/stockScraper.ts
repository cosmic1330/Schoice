import { error, info } from "@tauri-apps/plugin-log";
import { load } from "cheerio";
import { StockTableType } from "../types";
import { tauriFetcher, TauriFetcherType } from "./http";

export enum QueryStockType {
  TWSE = 2,
  OTC = 4,
}

/**
 * Scrapes stock data from TWSE or OTC exchanges.
 */
export async function queryStocks(
  type: QueryStockType,
): Promise<StockTableType[]> {
  const data: StockTableType[] = [];
  try {
    const url = `https://isin.twse.com.tw/isin/C_public.jsp?strMode=${type}`;
    const arrayBuffer = (await tauriFetcher(
      url,
      TauriFetcherType.ArrayBuffer,
    )) as ArrayBuffer;

    // Use TextDecoder to convert big5 to utf-8
    const decoder = new TextDecoder("big5");
    const decodedText = decoder.decode(arrayBuffer);
    const $ = load(decodedText);

    const rows = $("tbody tr").toArray();
    const thirdRowToEnd = rows.slice(2);

    for (let i = 0; i < thirdRowToEnd.length; i++) {
      const row = thirdRowToEnd[i];
      const firstTd = $(row).find("td").eq(0).text(); // First <td>
      const [stock_id, stock_name] = firstTd.split("　");

      // ID must be 4 digits and first digit not 0
      if (
        (stock_id.length !== 4 && !/^\d+$/.test(stock_id)) ||
        stock_id[0] === "0"
      ) {
        continue;
      }
      const market_type = $(row).find("td").eq(3).text(); // Fourth <td>
      const industry_group = $(row).find("td").eq(4).text(); // Fifth <td>
      if (stock_id.length === 4) {
        info(`Valid ID found via scraper: ${stock_id} ${stock_name}`);
        data.push({ stock_id, stock_name, market_type, industry_group });
      }
    }
  } catch (e) {
    error(`Error fetching data in scraper: ${e}`);
  }
  return data;
}

/**
 * Fetches stocks from all supported exchanges.
 */
export async function fetchStocksFromExchanges(): Promise<StockTableType[]> {
  const TWSE_data = await queryStocks(QueryStockType.TWSE);
  const OTC_data = await queryStocks(QueryStockType.OTC);
  return [...TWSE_data, ...OTC_data];
}

/**
 * Scrapes basic company profile from Yahoo Finance (Taiwan).
 */
export async function fetchStockProfile(
  stockId: string,
): Promise<{ issued_shares?: number } | null> {
  try {
    const url = `https://tw.stock.yahoo.com/quote/${stockId}.TW/profile`;
    const arrayBuffer = (await tauriFetcher(
      url,
      TauriFetcherType.ArrayBuffer,
    )) as ArrayBuffer;

    const decoder = new TextDecoder("utf-8"); // Yahoo is usually utf-8
    const decodedText = decoder.decode(arrayBuffer);
    const $ = load(decodedText);

    const mapping: Record<string, string> = {
      已發行普通股數: "issued_shares",
    };

    let companyInfo: any = {};

    $(".table-grid.row-fit-half .grid-item").each((_i, el) => {
      const name = $(el).find("span > span").first().text().trim();
      let value = $(el).find("div.Py\\(8px\\)").last().text().trim(); // Use last() to get the content div

      const key = mapping[name];
      if (!key) return;

      if (key === "issued_shares") {
        value = value.replace(/,/g, "");
        const shares = parseFloat(value);
        if (!isNaN(shares)) {
          companyInfo[key] = shares;
        }
      }
    });

    if (Object.keys(companyInfo).length === 0) {
      info(`No profile data found for ${stockId} on Yahoo`);
      return null;
    }

    return companyInfo;
  } catch (e) {
    error(`Error fetching Yahoo profile for ${stockId}: ${e}`);
    return null;
  }
}
