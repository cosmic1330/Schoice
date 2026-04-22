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
    const isEpsMissing = !data || !data.fundamentals || data.fundamentals.eps_recent_q1 == null;
    const isPositionsMissing = !data || !data.positions || data.positions.recent_w1_name == null;
    const isMetricsMissing = !data || !data.metrics || data.metrics.pe == null;

    // 2. [Fallback] If scraper fails or data is incomplete, try fetching from Supabase Cloud
    if (isEpsMissing || isPositionsMissing || isMetricsMissing) {
      info(`[[v12]] [Sync] Scraper data incomplete for ${stockId} (EPS:${isEpsMissing}, Pos:${isPositionsMissing}), using Supabase as fallback...`);
      const [mRes, fRes, pRes] = await Promise.all([
        supabase.from("financial_metric").select("*").eq("stock_id", stockId).maybeSingle(),
        supabase.from("recent_fundamental").select("*").eq("stock_id", stockId).maybeSingle(),
        supabase.from("investor_positions").select("*").eq("stock_id", stockId).maybeSingle(),
      ]);

      if (!data) {
        data = { 
          metrics: { stock_id: stockId }, 
          fundamentals: { stock_id: stockId }, 
          positions: { stock_id: stockId } 
        };
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

    const results = await Promise.allSettled([
      tauriFetcher(profileUrl, TauriFetcherType.ArrayBuffer),
      tauriFetcher(revenueUrl, TauriFetcherType.ArrayBuffer),
      tauriFetcher(holdersUrl, TauriFetcherType.ArrayBuffer),
    ]);

    const decoder = new TextDecoder("utf-8");
    const profileRes = results[0].status === "fulfilled" ? results[0].value : null;
    const revenueRes = results[1].status === "fulfilled" ? results[1].value : null;
    const holdersRes = results[2].status === "fulfilled" ? results[2].value : null;

    if (!profileRes && !revenueRes && !holdersRes) {
      error(`All 3 extension data pages failed to fetch for ${stockId}`);
      return null;
    }

    const $profile = profileRes ? load(decoder.decode(profileRes as ArrayBuffer)) : null;
    const $revenue = revenueRes ? load(decoder.decode(revenueRes as ArrayBuffer)) : null;
    const $holders = holdersRes ? load(decoder.decode(holdersRes as ArrayBuffer)) : null;

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

    // 1. Process Profile Page: Financial Metrics & Basic Info
    if ($profile) {
      $profile("div, span").each((_i, el) => {
        const $el = $profile(el);
        // 只處理葉子節點
        if ($el.children().length > 0) return;

        const text = $el.text().trim();
        if (!text) return;

        for (const [key, field] of Object.entries(metricsMap)) {
          if (text === key || (text.includes(key) && text.length < 15)) {
            // 策略 A: 嘗試取父節點的最後一個子節點 (傳統結構：[Label, Value])
            const lastChild = $el.parent().children().last();
            const lastChildText = lastChild.text().trim().replace(/,/g, "").replace(/%/g, "");
            let val = parseFloat(lastChildText);

            // 策略 B: 嘗試取「標籤」上方的數值 (垂直結構：[Value, Label])
            if (isNaN(val) || lastChildText === text) {
              const firstChild = $el.parent().children().first();
              const firstChildText = firstChild.text().trim().replace(/,/g, "").replace(/%/g, "");
              val = parseFloat(firstChildText);
              
              // 安全檢查：數值不應等於標籤文本
              if (isNaN(val) || firstChildText === text) {
                // 策略 C: 嘗試取下一個兄弟節點
                const nextText = $el.next().text().trim().replace(/,/g, "").replace(/%/g, "");
                val = parseFloat(nextText);
              }
            }

            if (!isNaN(val)) {
              data.metrics[field] = Math.round(val * 100) / 100;
              info(`[Scraper] Found ${key} for ${stockId}: ${val}`);
            }
          }
        }

        // 特殊處理：財報季度 (Report Period)
        if (text.includes("財報季度")) {
          const periodNodes = $el.parent().children();
          const period = periodNodes.last().text().trim();
          if (period && period !== text) {
             data.metrics.report_period = period;
          } else {
             const firstPeriod = periodNodes.first().text().trim();
             if (firstPeriod && firstPeriod !== text) data.metrics.report_period = firstPeriod;
          }
        }
      });
    }

    // 2. Process Profile Page: EPS (Quarterly & Yearly)
    if ($profile) {
      const quarterlyEPS: { name: string; value: number }[] = [];
      const yearlyEPS: { name: string; value: number }[] = [];

    const epsLabels: string[] = [];
    const epsValues: string[] = [];

    $profile('.table-grid .grid-item span').each((_i, el) => {
      const cls = $profile(el).attr('class') || '';
      if (cls.includes('As(st)')) {
        epsLabels.push($profile(el).text());
      }
    });
    
    $profile('.table-grid .grid-item div').each((_i, el) => {
      const cls = $profile(el).attr('class') || '';
      if (cls.includes('Py(8px)')) {
        epsValues.push($profile(el).text());
      }
    });

    epsLabels.forEach((labelRaw, i) => {
      const valueRaw = epsValues[i] || "";
      const label = labelRaw.trim().replace(/\s+/g, ' ');
      const valStr = valueRaw.replace('元', '').replace(/,/g, '').trim();
      const val = parseFloat(valStr);

      if (isNaN(val)) return;

      // Ensure we don't insert duplicate names 
      if (/\d{4} Q\d/.test(label)) {
        if (!quarterlyEPS.some(e => e.name === label)) {
          quarterlyEPS.push({ name: label, value: val });
        }
      } else if (/^\d{4}$/.test(label)) {
        if (!yearlyEPS.some(e => e.name === label)) {
          yearlyEPS.push({ name: label, value: val });
        }
      }
    });
    
    console.log(`[ExtData Scraper] Extracted quarterly EPS for ${stockId}:`, quarterlyEPS);
    console.log(`[ExtData Scraper] Extracted yearly EPS for ${stockId}:`, yearlyEPS);

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

      for (let i = 0; i < 4; i++) {
        data.fundamentals[`eps_recent_q${i + 1}`] = quarterlyEPS[i]?.value ?? null;
        data.fundamentals[`eps_recent_q${i + 1}_name`] = quarterlyEPS[i]?.name ?? null;
        data.fundamentals[`eps_recent_y${i + 1}`] = yearlyEPS[i]?.value ?? null;
        data.fundamentals[`eps_recent_y${i + 1}_name`] = yearlyEPS[i]?.name ?? null;
      }
    }

    // 3. Process Revenue Page
    if ($revenue) {
      const revValues: string[] = [];

      $revenue('.table-grid .grid-item div').each((_i, el) => {
        const cls = $revenue(el).attr('class') || '';
        if (cls.includes('Py(8px)')) revValues.push($revenue(el).text().trim());
      });

      // Revenue grid: 8 items per row
      // 0: Month Name, 1: Rev, 2: MoM, 3: NetRev, 4: YoY, 5: AccRev, 6: AccMoM, 7: YoY_Acc
      for (let i = 0; i < 4; i++) {
          const base = i * 8;
          if (base + 7 >= revValues.length) break;
          
          data.fundamentals[`revenue_recent_m${i + 1}_name`] = revValues[base + 0];
          data.fundamentals[`revenue_recent_m${i + 1}_mom`] = pf(revValues[base + 2]);
          data.fundamentals[`revenue_recent_m${i + 1}_yoy`] = pf(revValues[base + 4]);
          data.fundamentals[`revenue_recent_m${i + 1}_yoy_acc`] = pf(revValues[base + 7]);
      }
    }

    // 4. Process Investor Positions (Major Holders) Page
    if ($holders) {
      const holderValues: string[] = [];

      $holders('.table-grid .grid-item div').each((_i, el) => {
        const cls = $holders(el).attr('class') || '';
        if (cls.includes('Py(8px)')) holderValues.push($holders(el).text().trim());
      });

      // Holders grid: 5 items per row
      // 0: Date(Label), 1: Foreign, 2: BigInvestor(1000+), 3: Dir/Sup, 4: Price
      for (let i = 0; i < 4; i++) {
          const base = i * 5;
          if (base + 2 >= holderValues.length) break;
          
          data.positions[`recent_w${i + 1}_name`] = holderValues[base + 0];
          data.positions[`recent_w${i + 1}_foreign_ratio`] = pf(holderValues[base + 1]);
          data.positions[`recent_w${i + 1}_big_investor_ratio`] = pf(holderValues[base + 2]);
      }
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
  const tryFetch = async (idWithSuffix: string) => {
    const url = `https://tw.stock.yahoo.com/quote/${idWithSuffix}/profile`;
    const arrayBuffer = (await tauriFetcher(
      url,
      TauriFetcherType.ArrayBuffer,
    )) as ArrayBuffer;

    const decoder = new TextDecoder("utf-8");
    const decodedText = decoder.decode(arrayBuffer);
    return decodedText;
  };

  try {
    let decodedText = await tryFetch(`${stockId}.TW`);
    
    // If .TW doesn't contain the label, try .TWO (OTC)
    if (!decodedText.includes("已發行普通股數")) {
      info(`[Scraper] Label not found with .TW, trying .TWO for ${stockId}`);
      decodedText = await tryFetch(`${stockId}.TWO`);
    }

    // Diagnostic log
    info(`[Scraper] Fetched HTML for ${stockId}, length: ${decodedText.length}`);

    const $ = load(decodedText);
    const companyInfo: any = {};

    $(".table-grid .grid-item, .grid-item, div, span, li").each((_i, el) => {
      const $el = $(el);
      const text = $el.text().trim();

      if (text.includes("已發行普通股數")) {
        let valueStr = "";
        let shares = NaN;

        // Strategy 1: Newline split (as seen in n8n reference)
        if (text.includes("\n")) {
          const parts = text.split("\n");
          // label is parts[0], value is parts[1] (or combined parts after 0)
          valueStr = parts.slice(1).join(" ").trim().replace(/,/g, "");
          shares = parseFloat(valueStr);
          if (!isNaN(shares)) {
             info(`[Scraper] Strategy 1 (Newline) matched: ${shares}`);
          }
        }

        // Strategy 2: Check parent's last child (Horizontal layout)
        if (isNaN(shares)) {
          valueStr = $el.parent().children().last().text().trim().replace(/,/g, "");
          shares = parseFloat(valueStr);
          if (!isNaN(shares)) info(`[Scraper] Strategy 2 (Parent Last Child) matched: ${shares}`);
        }
        
        // Strategy 3: Check parent's first child (Vertical layout)
        if (isNaN(shares) || valueStr === text) {
           valueStr = $el.parent().children().first().text().trim().replace(/,/g, "");
           shares = parseFloat(valueStr);
           if (!isNaN(shares)) info(`[Scraper] Strategy 3 (Parent First Child) matched: ${shares}`);
        }

        // Strategy 4: Check next sibling
        if (isNaN(shares) || valueStr === text) {
           valueStr = $el.next().text().trim().replace(/,/g, "");
           shares = parseFloat(valueStr);
           if (!isNaN(shares)) info(`[Scraper] Strategy 4 (Next Sibling) matched: ${shares}`);
        }
        
        if (!isNaN(shares) && shares > 0) {
          companyInfo.issued_shares = shares;
          info(`[Scraper] Success: Found issued_shares for ${stockId}: ${shares}`);
        } else {
          info(`[Scraper] Warning: Found label for ${stockId} but failed to parse value: "${text.replace(/\n/g, "\\n")}"`);
        }
      }
    });

    if (!companyInfo.issued_shares) {
      info(`[Scraper] Failed to find issued_shares for ${stockId} on profile page.`);
    }

    return companyInfo.issued_shares ? companyInfo : null;
  } catch (e) {
    error(`[Scraper] Error fetching Yahoo profile for ${stockId}: ${e}`);
    return null;
  }
}
