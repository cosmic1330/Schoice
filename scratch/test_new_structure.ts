import * as cheerio from "cheerio";

async function analyzeNewTableStructure() {
  const urls = [
    "https://tw.stock.yahoo.com/quote/2330.TW/revenue",
    "https://tw.stock.yahoo.com/quote/2330.TW/profile",
    "https://tw.stock.yahoo.com/quote/2330.TW/major-holders"
  ];

  for (const url of urls) {
    console.log(`\n=== Analyzing: ${url} ===`);
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
        },
      });
      const html = await res.text();
      const $ = cheerio.load(html);

      console.log("Checking .table-row count:", $(".table-row").length);
      console.log("Checking .table-body-wrapper count:", $(".table-body-wrapper").length);

      // 印出前 3 個 table-row 的內部 HTML 結構
      $(".table-row").slice(0, 3).each((i, row) => {
        console.log(`\n--- Row ${i + 1} ---`);
        $(row).children().each((_j, col) => {
          console.log(`Col [${col.tagName}] class="${$(col).attr("class")}" text="${$(col).text().trim()}"`);
          // 如果內部還有 children，也印出來
          $(col).children().each((_k, sub) => {
            console.log(`  Sub [${sub.tagName}] class="${$(sub).attr("class")}" text="${$(sub).text().trim()}"`);
          });
        });
      });

    } catch (e) {
      console.error(e);
    }
  }
}

analyzeNewTableStructure();
