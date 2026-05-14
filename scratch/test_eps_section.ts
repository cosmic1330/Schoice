import * as cheerio from "cheerio";

async function analyzeEpsSection() {
  const url = "https://tw.stock.yahoo.com/quote/2330.TW/profile";
  console.log(`=== Analyzing EPS Section: ${url} ===`);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
      },
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    // 尋找包含「最新四季每股盈餘」或「最近四年每股盈餘」的區塊
    $("div").each((_i, el) => {
      const txt = $(el).text().trim();
      if (txt === "最新四季每股盈餘" || txt === "最近四年每股盈餘") {
        console.log(`\n=== Found Section: ${txt} ===`);
        // 查看它的父節點或兄弟節點
        const parentWrapper = $(el).closest(".table-body-wrapper, .table-grid, div:has(.table-row), div:has(li)");
        
        // 印出它下方所有的標籤和數值
        parentWrapper.find("li, .grid-item, .table-row, div").each((_j, item) => {
          const itemTxt = $(item).text().trim();
          if (itemTxt && itemTxt.length < 30 && $(item).children().length === 0) {
            console.log(`[${item.tagName}] class="${$(item).attr("class")}" text="${itemTxt}"`);
          }
        });
      }
    });

  } catch (e) {
    console.error(e);
  }
}

analyzeEpsSection();
