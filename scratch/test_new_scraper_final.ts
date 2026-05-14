import * as cheerio from "cheerio";

async function testNewScraper(stockId: string, marketType: string) {
  console.log(`=== Testing New Scraper for ${stockId} (${marketType}) ===`);
  const suffix = marketType === "上櫃" ? ".TWO" : ".TW";
  const profileUrl = `https://tw.stock.yahoo.com/quote/${stockId}${suffix}/profile`;
  const revenueUrl = `https://tw.stock.yahoo.com/quote/${stockId}${suffix}/revenue`;

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

    const fundamentals: any = {};
    const pf = (val: string | null | undefined) => {
      if (!val) return null;
      const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
      return isNaN(num) ? null : num;
    };

    // 1. Check Revenue (New Row Selector)
    console.log("\n[Revenue Extraction]");
    const revRows = $revenue('.table-body-wrapper .table-row');
    console.log(`Found .table-row count in revenue: ${revRows.length}`);

    let count = 0;
    revRows.each((_i, row) => {
      if (count >= 4) return;
      const cols = $revenue(row).children();
      const monthName = cols.eq(0).text().trim();
      const mItems = cols.eq(1).find('li');
      if (mItems.length >= 4) {
        fundamentals[`revenue_recent_m${count + 1}_name`] = monthName;
        fundamentals[`revenue_recent_m${count + 1}_mom`] = pf(mItems.eq(1).text());
        fundamentals[`revenue_recent_m${count + 1}_yoy`] = pf(mItems.eq(3).text());
        const accItems = cols.eq(2).find('li');
        if (accItems.length >= 3) {
          fundamentals[`revenue_recent_m${count + 1}_yoy_acc`] = pf(accItems.eq(2).text());
        }
        count++;
      }
    });

    for (let i = 1; i <= 4; i++) {
       console.log(`Parsed m${i}:`, {
          name: fundamentals[`revenue_recent_m${i}_name`],
          mom: fundamentals[`revenue_recent_m${i}_mom`],
          yoy: fundamentals[`revenue_recent_m${i}_yoy`],
          yoy_acc: fundamentals[`revenue_recent_m${i}_yoy_acc`],
       });
    }

    // 2. Check EPS
    console.log("\n[EPS Extraction]");
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

    quarterlyEPS.sort((a, b) => {
      const [aY, aQ] = a.name.split(' ');
      const [bY, bQ] = b.name.split(' ');
      if (aY !== bY) return Number(bY) - Number(aY);
      return Number(bQ.slice(1)) - Number(aQ.slice(1));
    });

    for (let i = 0; i < 4; i++) {
      fundamentals[`eps_recent_q${i + 1}`] = quarterlyEPS[i]?.value ?? null;
      fundamentals[`eps_recent_q${i + 1}_name`] = quarterlyEPS[i]?.name ?? null;
    }

    for (let i = 1; i <= 4; i++) {
       console.log(`Parsed q${i}:`, {
          name: fundamentals[`eps_recent_q${i}_name`],
          eps: fundamentals[`eps_recent_q${i}`],
       });
    }

  } catch (e) {
    console.error(e);
  }
}

// 測試上市台積電與上櫃元太
async function runAll() {
  await testNewScraper("2330", "上市");
  await testNewScraper("8069", "上櫃");
}

runAll();
