import * as cheerio from "cheerio";

async function testScraper(stockId: string) {
  console.log(`=== Testing Scraper for ${stockId} ===`);
  const profileUrl = `https://tw.stock.yahoo.com/quote/${stockId}.TW/profile`;
  const revenueUrl = `https://tw.stock.yahoo.com/quote/${stockId}.TW/revenue`;

  try {
    const fetchOptions = {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
      },
    };

    console.log(`Fetching profile: ${profileUrl}`);
    const profileRes = await fetch(profileUrl, fetchOptions);
    const profileHtml = await profileRes.text();
    const $profile = cheerio.load(profileHtml);

    console.log(`Fetching revenue: ${revenueUrl}`);
    const revenueRes = await fetch(revenueUrl, fetchOptions);
    const revenueHtml = await revenueRes.text();
    const $revenue = cheerio.load(revenueHtml);

    // 1. Check Profile EPS
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

    console.log("\n[EPS Raw Extract]");
    console.log("epsLabels (As(st)):", epsLabels);
    console.log("epsValues (Py(8px)):", epsValues);

    const quarterlyEPS: { name: string; value: number }[] = [];
    const yearlyEPS: { name: string; value: number }[] = [];

    epsLabels.forEach((labelRaw, i) => {
      const valueRaw = epsValues[i] || "";
      const label = labelRaw.trim().replace(/\s+/g, ' ');
      const valStr = valueRaw.replace('元', '').replace(/,/g, '').trim();
      const val = parseFloat(valStr);
      if (isNaN(val)) return;

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
    console.log("Quarterly EPS parsed:", quarterlyEPS);
    console.log("Yearly EPS parsed:", yearlyEPS);

    // 2. Check Revenue
    const revValues: string[] = [];
    $revenue('.table-grid .grid-item div').each((_i, el) => {
      const cls = $revenue(el).attr('class') || '';
      if (cls.includes('Py(8px)')) {
        revValues.push($revenue(el).text().trim());
      }
    });

    console.log("\n[Revenue Raw Extract]");
    console.log(`Total rev grid items found: ${revValues.length}`);
    console.log("First 16 items in rev grid:", revValues.slice(0, 16));

    const pf = (val: string) => {
      if (!val) return null;
      const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
      return isNaN(num) ? null : num;
    };

    console.log("\n[Revenue Parsed Rows]");
    for (let i = 0; i < 4; i++) {
      const base = i * 8;
      if (base + 7 >= revValues.length) break;
      console.log(`Row m${i + 1}:`, {
        name: revValues[base + 0],
        rev: revValues[base + 1],
        mom: pf(revValues[base + 2]),
        yoy: pf(revValues[base + 4]),
        yoy_acc: pf(revValues[base + 7]),
      });
    }

    // 3. Check Metrics PE
    console.log("\n[Metrics Search]");
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
    const foundMetrics: any = {};
    $profile("div, span").each((_i, el) => {
      const $el = $profile(el);
      if ($el.children().length > 0) return;
      const text = $el.text().trim();
      if (!text) return;

      for (const [key, field] of Object.entries(metricsMap)) {
        if (text === key || (text.includes(key) && text.length < 15)) {
          const lastChild = $el.parent().children().last();
          const lastChildText = lastChild.text().trim().replace(/,/g, "").replace(/%/g, "");
          let val = parseFloat(lastChildText);
          if (isNaN(val) || lastChildText === text) {
            const firstChild = $el.parent().children().first();
            const firstChildText = firstChild.text().trim().replace(/,/g, "").replace(/%/g, "");
            val = parseFloat(firstChildText);
            if (isNaN(val) || firstChildText === text) {
              const nextText = $el.next().text().trim().replace(/,/g, "").replace(/%/g, "");
              val = parseFloat(nextText);
            }
          }
          if (!isNaN(val)) {
            foundMetrics[field] = val;
          }
        }
      }
    });
    console.log("Found metrics:", foundMetrics);

  } catch (e) {
    console.error("Test failed:", e);
  }
}

testScraper("2330");
