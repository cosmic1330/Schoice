import * as cheerio from "cheerio";

async function analyzeProfileStructure() {
  const url = "https://tw.stock.yahoo.com/quote/2330.TW/profile";
  console.log(`=== Analyzing: ${url} ===`);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
      },
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    console.log("\n=== Checking .table-body-wrapper in Profile ===");
    $(".table-body-wrapper").each((i, el) => {
      console.log(`\n--- Wrapper ${i + 1} ---`);
      $(el).find("div, span, li").each((_j, tag) => {
        const txt = $(tag).text().trim();
        if (txt.includes("Q1") || txt.includes("Q2") || txt.includes("Q3") || txt.includes("Q4") || txt.includes("2026") || txt.includes("2025")) {
          // 只印出簡短字串
          if (txt.length < 50) {
            console.log(`[${tag.tagName}] class="${$(tag).attr("class")}" text="${txt}"`);
          }
        }
      });
    });

    console.log("\n=== Checking possible text containing '2026' or 'EPS' across entire page ===");
    $("div, span, li").each((_i, tag) => {
      const txt = $(tag).text().trim();
      if (txt.includes("2026") || txt.includes("EPS") || txt.includes("每股盈餘")) {
        if (txt.length < 40 && $(tag).children().length === 0) {
          console.log(`[${tag.tagName}] class="${$(tag).attr("class")}" text="${txt}"`);
        }
      }
    });

  } catch (e) {
    console.error(e);
  }
}

analyzeProfileStructure();
