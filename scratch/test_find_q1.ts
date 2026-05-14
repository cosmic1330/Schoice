import * as cheerio from "cheerio";

async function find2026Q1() {
  const url = "https://tw.stock.yahoo.com/quote/2330.TW/profile";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
      },
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    $("div, span, li").each((_i, el) => {
      if ($(el).text().trim() === "2026-Q1") {
        console.log("=== Found 2026-Q1 ===");
        let curr = $(el);
        for (let level = 1; level <= 4; level++) {
           curr = curr.parent();
           console.log(`\n--- Parent Level ${level} [${curr.get(0)?.tagName}] class="${curr.attr("class")}" ---`);
           console.log("Full Text inside:", curr.text().substring(0, 150));
        }
      }
    });

  } catch (e) {
    console.error(e);
  }
}

find2026Q1();
