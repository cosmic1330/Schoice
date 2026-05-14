import * as cheerio from "cheerio";

async function printEpsGrid() {
  const url = "https://tw.stock.yahoo.com/quote/2330.TW/profile";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
      },
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    // 找到「最新四季每股盈餘」
    let found = false;
    $("div").each((_i, el) => {
      if (found) return;
      if ($(el).text().trim() === "最新四季每股盈餘") {
        found = true;
        const container = $(el).parent().parent(); // 往上兩層
        console.log(`\n=== Container Tag: ${container.get(0)?.tagName}, Class: ${container.attr("class")} ===`);
        
        // 印出內部所有的子元素樹
        container.children().each((_j, child) => {
          console.log(`Child [${child.tagName}] class="${$(child).attr("class")}" text="${$(child).text().trim()}"`);
          $(child).children().each((_k, sub) => {
            console.log(`  Sub [${sub.tagName}] class="${$(sub).attr("class")}" text="${$(sub).text().trim()}"`);
            $(sub).children().each((_l, leaf) => {
               console.log(`    Leaf [${leaf.tagName}] class="${$(leaf).attr("class")}" text="${$(leaf).text().trim()}"`);
            });
          });
        });
      }
    });

  } catch (e) {
    console.error(e);
  }
}

printEpsGrid();
