import * as cheerio from "cheerio";

async function checkRevenueHtml() {
  const url = "https://tw.stock.yahoo.com/quote/2330.TW/revenue";
  console.log(`Fetching: ${url}`);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
      },
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    console.log("=== Page Title ===");
    console.log($("title").text());

    console.log("=== Checking all table or grid classes ===");
    const classes = new Set<string>();
    $("[class]").each((_i, el) => {
      const clsStr = $(el).attr("class") || "";
      clsStr.split(/\s+/).forEach(c => {
        if (c.includes("grid") || c.includes("table") || c.includes("row") || c.includes("col") || c.includes("list") || c.includes("card")) {
          classes.add(c);
        }
      });
    });
    console.log(Array.from(classes));

    console.log("\n=== Checking possible text containing '營收' ===");
    $("div, span, li, table, tr, td").each((_i, el) => {
      const text = $(el).text().trim();
      if (text.includes("單月營收") || text.includes("月營收") || text.includes("115年") || text.includes("2026年")) {
        console.log(`Tag: ${el.tagName}, Class: ${$(el).attr("class")}`);
        console.log(`Text: ${text.substring(0, 100)}...\n`);
      }
    });

  } catch (e) {
    console.error(e);
  }
}

checkRevenueHtml();
