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

import { supabase } from "./supabase";

/**
 * Fetches Comprehensive Stock Data (Metrics, EPS, Revenue, Positions)
 * Priority: Yahoo Finance (Primary) -> Supabase (Fallback)
 */
export async function fetchStockExtData(stockId: string): Promise<{
  metrics?: any;
  fundamentals?: any;
  positions?: any;
} | null> {
  try {
    // 1. [Primary] Attempt Yahoo Scraper first to ensure absolute freshness
    let data: any = await scrapeYahooExtData(stockId);
    
    // 檢查爬蟲是否抓到完整數據 (以 EPS 和 籌碼日期作為指標)
    const isEpsMissing = !data || !data.fundamentals || data.fundamentals.eps_recent_q1 === null;
    const isPositionsMissing = !data || !data.positions || data.positions.recent_w1_name === null;
    const isMetricsMissing = !data || !data.metrics || data.metrics.pe === null;

    // 2. [Fallback] If scraper fails or data is incomplete, try fetching from Supabase Cloud
    if (isEpsMissing || isPositionsMissing || isMetricsMissing) {
      info(`[[v12]] [Sync] Scraper data incomplete for ${stockId} (EPS:${isEpsMissing}, Pos:${isPositionsMissing}), using Supabase as fallback...`);
      const [mRes, fRes, pRes] = await Promise.all([
        supabase.from("financial_metric").select("*").eq("stock_id", stockId).maybeSingle(),
        supabase.from("recent_fundamental").select("*").eq("stock_id", stockId).maybeSingle(),
        supabase.from("investor_positions").select("*").eq("stock_id", stockId).maybeSingle(),
      ]);

      if (!data) {
        data = { metrics: {}, fundamentals: {}, positions: {} };
      }

      // Merge strategy: Keep Yahoo data if present, otherwise use Supabase
      if (mRes.data) data.metrics = { ...mRes.data, ...data.metrics };
      if (fRes.data) data.fundamentals = { ...fRes.data, ...data.fundamentals };
      if (pRes.data) data.positions = { ...pRes.data, ...data.positions };
    }

    return data;
  } catch (e) {
    error(`Error in scraper-first fetch for ${stockId}: ${e}`);
    return null;
  }
}

/**
 * Internal Yahoo Scraper Fallback
 * Enhanced with selectors and logic from n8n reference.
 */
async function scrapeYahooExtData(stockId: string) {
  try {
    const profileUrl = `https://tw.stock.yahoo.com/quote/${stockId}.TW/profile`;
    const revenueUrl = `https://tw.stock.yahoo.com/quote/${stockId}.TW/revenue`;
    const holdersUrl = `https://tw.stock.yahoo.com/quote/${stockId}.TW/major-holders`;

    const [profileBuffer, revenueBuffer, holdersBuffer] = await Promise.all([
      tauriFetcher(profileUrl, TauriFetcherType.ArrayBuffer),
      tauriFetcher(revenueUrl, TauriFetcherType.ArrayBuffer),
      tauriFetcher(holdersUrl, TauriFetcherType.ArrayBuffer),
    ]);

    const decoder = new TextDecoder("utf-8");
    const $profile = load(decoder.decode(profileBuffer as ArrayBuffer));
    const $revenue = load(decoder.decode(revenueBuffer as ArrayBuffer));
    const $holders = load(decoder.decode(holdersBuffer as ArrayBuffer));

    const data: any = { 
      metrics: { stock_id: stockId }, 
      fundamentals: { stock_id: stockId },
      positions: { stock_id: stockId }
    };

    const pf = (val: string) => {
      if (!val) return null;
      const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
      return isNaN(num) ? null : num;
    };

    // 1. Process Profile Page: Financial Metrics
    const metricsMap: Record<string, string> = {
      "營業毛利率": "gross_profit_margin",
      "營業利益率": "operating_margin",
      "稅前淨利率": "pre_tax_profit_margin",
      "資產報酬率": "roa",
      "股東權益報酬率": "roe",
      "每股淨值": "book_value_per_share",
      "本益比": "pe",
      "股價淨值比": "pb",
      "殖利率": "dividend_yield",
    };

    $profile(".table-grid .grid-item").each((_i, el) => {
      const label = $profile(el).find("span").first().text().trim();
      const valStr = $profile(el).children().last().text().trim().replace(/,/g, "").replace(/%/g, "");
      
      for (const [key, field] of Object.entries(metricsMap)) {
        if (label.includes(key)) {
          const val = parseFloat(valStr);
          if (!isNaN(val)) data.metrics[field] = Math.round(val * 100) / 100;
        }
      }
    });

    // 2. Process Profile Page: EPS (Quarterly & Yearly)
    const quarterlyEPS: { name: string; value: number }[] = [];
    const yearlyEPS: { name: string; value: number }[] = [];

    $profile(".table-grid .grid-item").each((_i, el) => {
      const label = $profile(el).find('span[class*="As(st)"]').text().trim().replace(/\s+/g, ' ');
      const valStr = $profile(el).find('div[class*="Py(8px)"]').text().trim().replace('元', '').replace(/,/g, '');
      const val = parseFloat(valStr);

      if (!isNaN(val) && label) {
        if (/\d{4} Q\d/.test(label)) {
          quarterlyEPS.push({ name: label, value: val });
        } else if (/^\d{4}$/.test(label)) {
          yearlyEPS.push({ name: label, value: val });
        }
      }
    });

    quarterlyEPS.sort((a, b) => {
      const [aY, aQ] = a.name.split(' ');
      const [bY, bQ] = b.name.split(' ');
      if (aY !== bY) return Number(bY) - Number(aY);
      return Number(bQ.slice(1)) - Number(aQ.slice(1));
    });
    yearlyEPS.sort((a, b) => Number(b.name) - Number(a.name));

    for (let i = 0; i < 4; i++) {
      data.fundamentals[`eps_recent_q${i + 1}`] = quarterlyEPS[i]?.value ?? null;
      data.fundamentals[`eps_recent_q${i + 1}_name`] = quarterlyEPS[i]?.name ?? null;
      data.fundamentals[`eps_recent_y${i + 1}`] = yearlyEPS[i]?.value ?? null;
      data.fundamentals[`eps_recent_y${i + 1}_name`] = yearlyEPS[i]?.name ?? null;
    }

    // 3. Process Revenue Page
    const revNames = $revenue("div.table-body li.List\\(n\\) div.W\\(65px\\)").map((_, el) => $revenue(el).text().trim()).get();
    const revMoms = $revenue("div.table-body li.List\\(n\\) div.table-row > div:nth-child(2) li:nth-child(2) span").map((_, el) => $revenue(el).text().trim()).get();
    const revYoys = $revenue("div.table-body li.List\\(n\\) div.table-row > div:nth-child(2) li:nth-child(4) span").map((_, el) => $revenue(el).text().trim()).get();
    const revYoyAccs = $revenue("div.table-body li.List\\(n\\) div.table-row > div:nth-child(3) li:nth-child(3) span").map((_, el) => $revenue(el).text().trim()).get();

    for (let i = 0; i < 4; i++) {
        data.fundamentals[`revenue_recent_m${i + 1}_name`] = revNames[i] || null;
        data.fundamentals[`revenue_recent_m${i + 1}_mom`] = pf(revMoms[i]);
        data.fundamentals[`revenue_recent_m${i + 1}_yoy`] = pf(revYoys[i]);
        data.fundamentals[`revenue_recent_m${i + 1}_yoy_acc`] = pf(revYoyAccs[i]);
    }

    // 4. Process Investor Positions (Major Holders) Page
    const holderNames = $holders("div.table-body li.List\\(n\\) div.W\\(112px\\)").map((_, el) => $holders(el).text().trim()).get();
    const foreignRatios = $holders("div.table-body li.List\\(n\\) div.table-row > div:nth-child(2)").map((_, el) => $holders(el).text().trim()).get();
    const bigInvestorRatios = $holders("div.table-body li.List\\(n\\) div.table-row > div:nth-child(3)").map((_, el) => $holders(el).text().trim()).get();

    for (let i = 0; i < 4; i++) {
        data.positions[`recent_w${i + 1}_name`] = holderNames[i] || null;
        data.positions[`recent_w${i + 1}_foreign_ratio`] = pf(foreignRatios[i]);
        data.positions[`recent_w${i + 1}_big_investor_ratio`] = pf(bigInvestorRatios[i]);
    }

    return data;
  } catch (e) {
    error(`Yahoo scraper fallback failed for ${stockId}: ${e}`);
    return null;
  }
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

    const decoder = new TextDecoder("utf-8");
    const decodedText = decoder.decode(arrayBuffer);
    const $ = load(decodedText);

    const companyInfo: any = {};
    $(".table-grid.row-fit-half .grid-item").each((_i, el) => {
      const name = $(el).find("span > span").first().text().trim();
      let value = $(el).find("div.Py\\(8px\\)").last().text().trim();

      if (name.includes("已發行普通股數")) {
        value = value.replace(/,/g, "");
        const shares = parseFloat(value);
        if (!isNaN(shares)) {
          companyInfo.issued_shares = shares;
        }
      }
    });

    return Object.keys(companyInfo).length > 0 ? companyInfo : null;
  } catch (e) {
    error(`Error fetching Yahoo profile for ${stockId}: ${e}`);
    return null;
  }
}
